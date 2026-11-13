// An uploaded .docx turned into HTML for the rich text editor (mammoth.js), keeping how each table's borders look.
//
// mammoth knows nothing about table borders, and Quill draws every table with a full grid -- so a Word table that has only
// horizontal lines (or none at all) arrived looking like a different table, and went into the issued document that way. Here the
// document's own XML is read once more: for each table, are there vertical lines, are there horizontal lines? The answer is written
// onto the table's rows as data-row="dx<mode>-<table>-<row>" (h = horizontal lines only, v = vertical only, n = none; a full grid
// gets nothing, as before). Quill keeps the data-row of a row (see tableBorderMatcher in quill-word-paste.ts), the editor styles it
// (dmsrich-text-edit.css) and the Word export reads it (HtmlToOpenXmlConverter.ConvertTable).
//
// Anything unexpected (no zip, tables that do not line up) leaves the HTML exactly as mammoth produced it.

import * as mammoth from 'mammoth';
import JSZip from 'jszip';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

type Edges = { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean; insideH?: boolean; insideV?: boolean };

// A border element: undefined = not stated, false = none/nil, true = a line.
function edgeState(parent: Element | null, name: string): boolean | undefined {
  if (!parent) return undefined;
  const el = Array.from(parent.children).find((c) => c.namespaceURI === W && c.localName === name);
  if (!el) return undefined;
  const val = (el.getAttributeNS(W, 'val') || '').toLowerCase();
  if (!val) return undefined;
  return !(val === 'none' || val === 'nil');
}

function readEdges(bordersEl: Element | null): Edges {
  return {
    top: edgeState(bordersEl, 'top'),
    bottom: edgeState(bordersEl, 'bottom'),
    left: edgeState(bordersEl, 'left') ?? edgeState(bordersEl, 'start'),
    right: edgeState(bordersEl, 'right') ?? edgeState(bordersEl, 'end'),
    insideH: edgeState(bordersEl, 'insideH'),
    insideV: edgeState(bordersEl, 'insideV'),
  };
}

function child(parent: Element | null, name: string): Element | null {
  if (!parent) return null;
  return Array.from(parent.children).find((c) => c.namespaceURI === W && c.localName === name) ?? null;
}

// Borders a table style gives (following "based on"), for tables that state none themselves.
function styleEdges(styles: Document | null, styleId: string | null): Edges {
  let id = styleId;
  for (let guard = 0; id && styles && guard < 10; guard++) {
    const style = Array.from(styles.getElementsByTagNameNS(W, 'style')).find((s) => s.getAttributeNS(W, 'styleId') === id);
    if (!style) break;
    const borders = child(child(style, 'tblPr'), 'tblBorders');
    if (borders) return readEdges(borders);
    id = child(style, 'basedOn')?.getAttributeNS(W, 'val') ?? null;
  }
  return {};
}

// 'h' | 'v' | 'n' for a table that is not a full grid, '' for a full grid.
function tableMode(tbl: Element, styles: Document | null): string {
  const tblPr = child(tbl, 'tblPr');
  const own = child(tblPr, 'tblBorders');
  const base: Edges = own ? readEdges(own) : styleEdges(styles, child(tblPr, 'tblStyle')?.getAttributeNS(W, 'val') ?? null);

  let tableVert = !!(base.left || base.right || base.insideV);
  let tableHorz = !!(base.top || base.bottom || base.insideH);

  // Cells can state their own borders over the table's: a line some cell sets, or every cell switching the table's lines off.
  const cells = Array.from(tbl.getElementsByTagNameNS(W, 'tc'));
  let cellVert = false;
  let cellHorz = false;
  let allVertOff = cells.length > 0;
  let allHorzOff = cells.length > 0;
  for (const tc of cells) {
    const e = readEdges(child(child(tc, 'tcPr'), 'tcBorders'));
    if (e.left || e.right) cellVert = true;
    if (e.top || e.bottom) cellHorz = true;
    if (!(e.left === false && e.right === false)) allVertOff = false;
    if (!(e.top === false && e.bottom === false)) allHorzOff = false;
  }
  if (allVertOff) tableVert = false;
  if (allHorzOff) tableHorz = false;
  const vert = tableVert || cellVert;
  const horz = tableHorz || cellHorz;

  if (vert && horz) return '';
  if (horz) return 'h';
  if (vert) return 'v';
  return 'n';
}

async function tableModes(buffer: ArrayBuffer): Promise<string[] | null> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');
    if (!documentXml) return null;
    const stylesXml = await zip.file('word/styles.xml')?.async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'application/xml');
    const styles = stylesXml ? parser.parseFromString(stylesXml, 'application/xml') : null;
    return Array.from(doc.getElementsByTagNameNS(W, 'tbl')).map((t) => tableMode(t, styles));
  } catch {
    return null;
  }
}

export async function convertDocxToHtml(buffer: ArrayBuffer): Promise<{ value: string }> {
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  try {
    const modes = await tableModes(buffer);
    if (!modes || !modes.some((m) => m)) return result;

    const doc = new DOMParser().parseFromString(result.value, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));
    // Both lists are in document order; if they do not line up, nothing is tagged rather than the wrong table.
    if (tables.length !== modes.length) return result;

    tables.forEach((table, t) => {
      if (!modes[t]) return;
      Array.from(table.rows).forEach((row, r) => {
        const id = `dx${modes[t]}-${t}-${r}`;
        row.setAttribute('data-row', id);
        Array.from(row.cells).forEach((cell) => cell.setAttribute('data-row', id));
      });
    });
    return { value: doc.body.innerHTML };
  } catch {
    return result;
  }
}
