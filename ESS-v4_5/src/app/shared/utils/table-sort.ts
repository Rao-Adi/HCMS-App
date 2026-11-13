// Click-to-sort for the plain HTML tables (the ones that are not an AG Grid, which sorts by itself): a click on a heading sorts ascending, a
// second click descending, a third click puts the rows back in their original order.

export interface TableSort {
  key: string | null;
  dir: 'asc' | 'desc';
}

export const noSort = (): TableSort => ({ key: null, dir: 'asc' });

/** The next state after a click on the heading of `key`. */
export function nextSort(current: TableSort, key: string): TableSort {
  if (current.key !== key) return { key, dir: 'asc' };
  if (current.dir === 'asc') return { key, dir: 'desc' };
  return noSort();
}

/** The arrow shown next to a heading: up, down, or a faint up/down pair when the table is not sorted by it. */
export function sortIcon(current: TableSort, key: string): string {
  if (current.key !== key) return 'bi-arrow-down-up';
  return current.dir === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
}

function compare(a: any, b: any): number {
  const blankA = a === null || a === undefined || a === '';
  const blankB = b === null || b === undefined || b === '';
  if (blankA || blankB) return blankA === blankB ? 0 : blankA ? 1 : -1; // blanks last
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const sa = String(a).trim();
  const sb = String(b).trim();
  // Dates ("Nov 10, 2026 16:08:11", "2026-11-10") sort by time, not alphabetically -- only when both read as one and carry a digit.
  if (/\d/.test(sa) && /\d/.test(sb) && /[-/,:]|\b(19|20)\d\d\b/.test(sa) && /[-/,:]|\b(19|20)\d\d\b/.test(sb)) {
    const da = Date.parse(sa);
    const db = Date.parse(sb);
    if (!isNaN(da) && !isNaN(db)) return da - db;
  }
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' });
}

/** The rows whose shown text contains `search` (case-insensitive); all rows when the search is empty. `text` returns what a row displays. */
export function searchRows<T>(rows: T[], search: string, text: (row: T) => string): T[] {
  const q = (search ?? '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => (text(r) ?? '').toString().toLowerCase().includes(q));
}

/** A sorted copy (the original order when there is no sort). `value` reads what the column shows from a row. */
export function sortRows<T>(rows: T[], sort: TableSort, value: (row: T, key: string) => any): T[] {
  if (!sort.key) return rows;
  const key = sort.key;
  const sign = sort.dir === 'asc' ? 1 : -1;
  // Array.prototype.sort is stable, so rows that tie keep their order.
  return rows
    .map((row, index) => ({ row, index }))
    .sort((x, y) => {
      const ax = value(x.row, key);
      const ay = value(y.row, key);
      const blankX = ax === null || ax === undefined || ax === '';
      const blankY = ay === null || ay === undefined || ay === '';
      // Blanks stay last whichever way the column is sorted.
      if (blankX || blankY) return blankX === blankY ? x.index - y.index : blankX ? 1 : -1;
      return compare(ax, ay) * sign || x.index - y.index;
    })
    .map((x) => x.row);
}
