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
