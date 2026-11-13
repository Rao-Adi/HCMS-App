// The AI spell check review: the ORIGINAL document, laid out as it is (tables, lists, headings), with each word the AI removed struck through
// and each word it added marked in green. Before, the review was one block of plain text, so a table came out as "VersionDatePrepared
// By..." and a bulleted list as lines with no bullets.
//
// The text of the original and of the corrected document is read the same way (block by block, a line break between blocks), compared word by
// word, and the marks are written back into the original's own text nodes -- the markup around them is left alone.

export interface ReviewEdit {
  type: 'same' | 'del' | 'add';
  text: string;
}

const BLOCKS = new Set([
  'P', 'DIV', 'LI', 'UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'BR', 'HR',
]);

interface TextRun {
  node: Text;
  start: number;
  end: number;
}

/** The text of a document, a line break between blocks, plus where each text node sits in it. */
function readText(root: Node): { text: string; runs: TextRun[] } {
  let text = '';
  const runs: TextRun[] = [];
  const breakLine = () => {
    if (text.length && !text.endsWith('\n')) text += '\n';
  };
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const data = (n as Text).data;
      if (!data) return;
      runs.push({ node: n as Text, start: text.length, end: text.length + data.length });
      text += data;
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const block = BLOCKS.has((n as Element).tagName);
    if (block) breakLine();
    n.childNodes.forEach(walk);
    if (block) breakLine();
  };
  walk(root);
  return { text, runs };
}

const tokenise = (text: string): { token: string; index: number }[] =>
  Array.from(text.matchAll(/\S+\s*/g)).map((m) => ({ token: m[0], index: m.index ?? 0 }));

/** The plain text of an HTML fragment, read the way the review reads it. */
export function reviewText(html: string): string {
  return readText(new DOMParser().parseFromString(html || '', 'text/html').body).text;
}

/** The words of an HTML fragment, as the review compares them. */
export function reviewTokens(html: string): string[] {
  return tokenise(reviewText(html)).map((t) => t.token);
}

/**
 * The original HTML with the edits marked. `edits` is the word-by-word comparison of reviewTokens(original) and reviewTokens(corrected)
 * (one edit per word, not merged). Returns the HTML to show.
 */
export function buildReviewHtml(originalHtml: string, edits: ReviewEdit[]): string {
  const doc = new DOMParser().parseFromString(originalHtml || '', 'text/html');
  // Nothing in the review can run: it is the author's own content, shown read-only.
  doc.querySelectorAll('script, iframe, object, embed, style, link').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((a) => {
      if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
    });
  });

  const { text, runs } = readText(doc.body);
  const words = tokenise(text);

  const owned = new Uint8Array(text.length + 1);
  runs.forEach((r) => owned.fill(1, r.start, r.end));

  const deleted = new Uint8Array(text.length + 1);
  const added = new Map<number, string>();

  // Walk the edits over the original's words. An added word goes after the end of the word before it.
  let w = 0;
  let pos = 0; // where the next addition goes
  const place = (p: number): number => {
    // After the previous word's last character that belongs to a text node (the line breaks between blocks belong to none).
    while (p > 0 && !owned[p - 1]) p--;
    return p;
  };
  for (const e of edits) {
    if (e.type === 'add') {
      const at = place(pos);
      added.set(at, (added.get(at) ?? '') + e.text.replace(/\s+/g, ' '));
    } else {
      const word = words[w++];
      if (!word) break;
      pos = word.index + word.token.length;
      if (e.type === 'del') deleted.fill(1, word.index, pos);
    }
  }

  const mark = (cls: string, tag: 'del' | 'ins', s: string) => {
    const el = doc.createElement(tag);
    el.className = cls;
    el.textContent = s;
    return el;
  };

  for (const run of runs) {
    const frag = doc.createDocumentFragment();
    let buffer = '';
    let inDel = false;
    const flush = () => {
      if (!buffer) return;
      frag.appendChild(inDel ? mark('dms-ai-diff-del', 'del', buffer) : doc.createTextNode(buffer));
      buffer = '';
    };
    for (let i = run.start; i <= run.end; i++) {
      // An addition sits after character i - 1, so it is written before character i (or at the very end of the run).
      const extra = i > run.start || i === run.end ? added.get(i) : undefined;
      if (extra && i > run.start) {
        flush();
        frag.appendChild(mark('dms-ai-diff-add', 'ins', extra));
        added.delete(i);
      }
      if (i === run.end) break;
      const del = deleted[i] === 1;
      if (del !== inDel) {
        flush();
        inDel = del;
      }
      buffer += run.node.data[i - run.start];
    }
    flush();
    run.node.replaceWith(frag);
  }

  // An addition at the very start of the document (nothing before it) goes in front of the first text.
  const head = added.get(0);
  if (head) {
    const first = doc.body.querySelector('p, li, td, th, div') ?? doc.body;
    first.insertBefore(mark('dms-ai-diff-add', 'ins', head), first.firstChild);
  }

  return doc.body.innerHTML;
}
