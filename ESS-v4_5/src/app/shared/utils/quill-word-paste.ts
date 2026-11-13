// Pasting from Microsoft Word into the rich text editor.
//
// Word does not put a real list on the clipboard. Each list item is an ordinary paragraph that carries the list in a style
// ("mso-list: l0 level2 lfo1") and starts with the marker as TEXT (a "·", an "o", "1.", "a)" ...) followed by spaces. Quill reads that
// as plain paragraphs, so a pasted bulleted or numbered list arrived as lines of text with a stray "·" in front of each --
// and went into the issued document that way. This matcher turns such a paragraph back into a list item: the marker is dropped, the
// item gets the list type (bullet / ordered) and the depth Word gave it.
//
// Used as a Quill clipboard matcher: quill.clipboard.addMatcher(Node.ELEMENT_NODE, wordListMatcher).

const BULLET_MARKER = /^[\s ]*(?:[·•●○▪▫■□⁃∙]|o|§|-|–|—|\*)[\s ]+/;
const ORDERED_MARKER = /^[\s ]*(?:\(?[0-9]+[.)]|\(?[a-zA-Z][.)]|\(?[ivxlcdmIVXLCDM]+[.)])[\s ]+/;

export function wordListMatcher(node: Node, delta: any): any {
  const el = node as HTMLElement;
  if (!el || (el.nodeName !== 'P' && el.nodeName !== 'LI')) return delta;

  const style = el.getAttribute('style') || '';
  // "mso-list: l0 level1 lfo1" is a list item; "mso-list: none" (or no mso-list at all) is not.
  const found = /mso-list:\s*(?!none)[^;]*?level(\d+)/i.exec(style);
  if (!found) return delta;

  const level = Math.max(1, parseInt(found[1], 10)) - 1;
  const ops: any[] = delta.ops || [];

  // The marker is the start of the first piece of text.
  let ordered = false;
  const first = ops.findIndex((op) => typeof op.insert === 'string' && op.insert.replace(/[\s ]/g, '').length > 0);
  if (first >= 0) {
    const text: string = ops[first].insert;
    const bullet = BULLET_MARKER.exec(text);
    const numbered = bullet ? null : ORDERED_MARKER.exec(text);
    const marker = bullet || numbered;
    if (marker) {
      ordered = !!numbered;
      const rest = text.slice(marker[0].length);
      if (rest.length) ops[first] = { ...ops[first], insert: rest };
      else ops.splice(first, 1);
    }
  }

  // Quill merges neighbouring inserts that have the same formatting, so the line break usually arrives glued to the text
  // (one insert holding "First item" plus the line break). It has to stand alone to carry the list format.
  const NL = String.fromCharCode(10);
  const tail = ops.length - 1;
  if (tail >= 0 && typeof ops[tail].insert === 'string' && ops[tail].insert.length > 1 && ops[tail].insert.endsWith(NL)) {
    const piece = ops[tail];
    ops.splice(tail, 1, { ...piece, insert: piece.insert.slice(0, -1) }, { insert: NL, ...(piece.attributes ? { attributes: piece.attributes } : {}) });
  }

  // The paragraph's own line break carries the list format.
  let newline = -1;
  for (let i = ops.length - 1; i >= 0; i--) {
    if (ops[i].insert === NL) {
      newline = i;
      break;
    }
  }
  const attributes: any = { ...(newline >= 0 ? ops[newline].attributes : {}), list: ordered ? 'ordered' : 'bullet' };
  if (level > 0) attributes.indent = level;

  if (newline >= 0) ops[newline] = { ...ops[newline], attributes };
  else ops.push({ insert: '\n', attributes });

  delta.ops = ops;
  return delta;
}

// Colours that came along with pasted text.
//
// Text copied from a dark page (a chat, a dark-theme editor, a web app) carries that page's colours inline: light text and a dark
// background. Quill keeps both, so the pasted block arrived as white-on-black in a white document -- and the same colours went into the
// issued document. A colour a person chose on purpose (red text, a yellow highlight) is kept; what is dropped is only a text colour
// too light to read on the white page and a background too dark to read dark text on.

function luminance(value: any): number | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  let r: number, g: number, b: number;
  let m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(v);
  if (m) {
    r = +m[1];
    g = +m[2];
    b = +m[3];
  } else if ((m = /^#([0-9a-f]{6})$/.exec(v))) {
    r = parseInt(m[1].slice(0, 2), 16);
    g = parseInt(m[1].slice(2, 4), 16);
    b = parseInt(m[1].slice(4, 6), 16);
  } else if ((m = /^#([0-9a-f]{3})$/.exec(v))) {
    r = parseInt(m[1][0] + m[1][0], 16);
    g = parseInt(m[1][1] + m[1][1], 16);
    b = parseInt(m[1][2] + m[1][2], 16);
  } else {
    return null; // a named or unusual colour: left as it is
  }
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function pastedColorMatcher(_node: Node, delta: any): any {
  const ops: any[] = delta.ops || [];
  for (const op of ops) {
    const a = op.attributes;
    if (!a) continue;
    const text = luminance(a.color);
    if (text !== null && text > 0.6) delete a.color;
    const back = luminance(a.background);
    if (back !== null && back < 0.4) delete a.background;
    if (Object.keys(a).length === 0) delete op.attributes;
  }
  return delta;
}

// Tables pasted from Word.
//
// A table cell in Quill is ONE line: nothing else can sit in it. A Word cell usually holds more -- several paragraphs, a bulleted list
// (a "Key Changes" cell with three bullets), blank lines -- and cells that span columns or rows. Quill dealt with these by cutting the table
// apart: the lines of a cell after the first escaped the table, so one Word table arrived as four, header row alone, the bullets
// loose underneath, empty cells where a merged cell had been -- and was saved and printed like that. normalizePastedTables
// rewrites each pasted table, BEFORE Quill sees it, into the plain grid Quill can keep intact:
//   * merged cells are spread over the grid (a spanned position becomes an empty cell, so every value stays under its own heading),
//   * everything in a cell becomes one line (list items and paragraphs follow each other, each list item with its bullet),
//   * rows and columns with nothing in them at all (Word's spacer rows / hidden columns) are dropped.
// Text outside tables, and tables that are already plain, come out the same as they went in.

const MSO_MARKER = /mso-list\s*:\s*ignore/i;
const LEADING_MARKER = /^[\s ]*(?:[·•●○▪▫■□⁃∙]|o|§|-|–|—|\*|\(?[0-9]+[.)]|\(?[a-zA-Z][.)])[\s ]+/;

function cellToLine(cell: Element): string {
  const work = cell.cloneNode(true) as HTMLElement;
  // The bullet/number Word draws as text in front of a list paragraph.
  work.querySelectorAll('span').forEach((s) => {
    if (MSO_MARKER.test(s.getAttribute('style') || '')) s.remove();
  });
  work.querySelectorAll('style, script, xml').forEach((n) => n.remove());
  Array.from(work.getElementsByTagName('*'))
    .filter((n) => n.tagName === 'O:P') // Word's own empty marker elements
    .forEach((n) => n.remove());

  const parts: string[] = [];
  const BLOCKS = 'p, li, div, h1, h2, h3, h4, h5, h6, blockquote';
  const leaves = Array.from(work.querySelectorAll(BLOCKS)).filter((el) => !el.querySelector(BLOCKS));
  if (leaves.length === 0) {
    parts.push(work.innerHTML);
  } else {
    for (const el of leaves) {
      let html = (el as HTMLElement).innerHTML.replace(/<br\s*\/?>/gi, ' ').trim();
      const plain = (el.textContent || '').replace(/[\s ]+/g, ' ').trim();
      if (!plain && !/<img/i.test(html)) continue;
      const style = el.getAttribute('style') || '';
      const isItem = el.tagName === 'LI' || /mso-list\s*:\s*(?!none)/i.test(style);
      if (isItem) {
        html = html.replace(LEADING_MARKER, '');
        html = '• ' + html;
      }
      parts.push(html);
    }
  }
  return parts
    .join(' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/(?:&nbsp;|[\s ])+/g, ' ')
    .trim();
}

function cellIsEmpty(html: string): boolean {
  const probe = document.createElement('div');
  probe.innerHTML = html;
  return !probe.textContent?.replace(/[\s ]+/g, '') && !probe.querySelector('img');
}

// A table's border look travels in the data-row of its rows: "dx<h|v|n>-<table>-<row>" (see docx-to-html.ts). Quill keeps a cell's data-row
// as its row id, but when HTML is pasted it numbers the rows itself (1, 2, 3 ...) and the look would be lost -- this matcher, run on the
// row after Quill's own, puts the id the HTML carries back.
const BORDER_ROW_ID = /^dx[hvn]-\d+-\d+$/;

export function tableBorderMatcher(node: Node, delta: any): any {
  const row = node as HTMLElement;
  const id = row.querySelector?.('td, th')?.getAttribute('data-row') || '';
  if (!BORDER_ROW_ID.test(id)) return delta;
  for (const op of delta.ops || []) {
    if (op.attributes && op.attributes.table !== undefined) op.attributes.table = id;
  }
  return delta;
}

function normalizeTable(table: HTMLTableElement): void {
  // The border look of the table being rewritten (its rows are rebuilt below, so it has to be carried over by hand).
  const firstId = table.querySelector('td, th')?.getAttribute('data-row') || '';
  const look = /^dx([hvn])-(\d+)-\d+$/.exec(firstId);

  const grid: string[][] = [];
  const taken: boolean[][] = [];
  Array.from(table.rows).forEach((row, r) => {
    grid[r] = grid[r] || [];
    taken[r] = taken[r] || [];
    let c = 0;
    Array.from(row.cells).forEach((cell) => {
      while (taken[r][c]) c++;
      const colSpan = Math.min(Math.max(parseInt(cell.getAttribute('colspan') || '1', 10) || 1, 1), 50);
      const rowSpan = Math.min(Math.max(parseInt(cell.getAttribute('rowspan') || '1', 10) || 1, 1), 200);
      const line = cellToLine(cell);
      for (let dr = 0; dr < rowSpan; dr++) {
        for (let dc = 0; dc < colSpan; dc++) {
          const rr = r + dr;
          grid[rr] = grid[rr] || [];
          taken[rr] = taken[rr] || [];
          grid[rr][c + dc] = dr === 0 && dc === 0 ? line : '';
          taken[rr][c + dc] = true;
        }
      }
      c += colSpan;
    });
  });

  let width = 0;
  grid.forEach((row) => (width = Math.max(width, row.length)));
  const rows = grid.filter((row) => row && row.some((v) => v && !cellIsEmpty(v)));
  if (rows.length === 0 || width === 0) return;
  rows.forEach((row) => {
    for (let i = 0; i < width; i++) if (row[i] === undefined) row[i] = '';
  });

  const keep: number[] = [];
  for (let i = 0; i < width; i++) if (rows.some((row) => row[i] && !cellIsEmpty(row[i]))) keep.push(i);

  const fresh = document.createElement('table');
  const body = document.createElement('tbody');
  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    keep.forEach((i) => {
      const td = document.createElement('td');
      td.innerHTML = row[i] || '<br>';
      if (look) td.setAttribute('data-row', `dx${look[1]}-${look[2]}-${rowIndex}`);
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
  fresh.appendChild(body);
  table.replaceWith(fresh);
}

// HTML loaded into the editor from elsewhere (an uploaded .docx converted by mammoth, saved content) never goes through the paste
// handler, so a table whose cell holds a bullet list or several paragraphs was cut apart by Quill the same way. Only a table that
// needs it is rewritten -- one with a list or several paragraphs in a cell, or merged cells; any other table is left exactly as it is.
export function normalizeLoadedTables(html: string): string {
  if (!html || !/<table/i.test(html)) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let changed = false;
  Array.from(doc.querySelectorAll('table'))
    .filter((t) => !t.parentElement?.closest('table'))
    .forEach((t) => {
      // A row with fewer cells than the others (Word lets a row stop short of the last column) leaves Quill a ragged
      // table: the missing cell has no border and the row looks cut off. normalizeTable pads such rows to the full width.
      const rowWidths = Array.from(t.rows).map((row) => row.cells.length);
      const ragged = rowWidths.some((w) => w !== rowWidths[0]);
      const needs =
        ragged ||
        !!t.querySelector('li, [colspan], [rowspan]') ||
        Array.from(t.querySelectorAll('td, th')).some((c) => c.querySelectorAll('p, div').length > 1);
      if (!needs) return;
      normalizeTable(t as HTMLTableElement);
      changed = true;
    });
  return changed ? doc.body.innerHTML : html;
}

export function normalizePastedTables(html: string): string {
  if (!/<table/i.test(html)) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Outermost tables only; a table nested in a cell is read into that cell's one line.
  Array.from(doc.querySelectorAll('table'))
    .filter((t) => !t.parentElement?.closest('table'))
    .forEach((t) => normalizeTable(t as HTMLTableElement));
  return doc.body.innerHTML;
}
