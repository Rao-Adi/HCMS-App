/**
 * The one place the DMS decides what a status is called and what colour it gets.
 *
 * Before this, every screen answered those two questions for itself: my-approval-request.ts had an
 * if/else chain of hex codes (with a typo -- it tested for 'revered'), my-documents.ts had a
 * keyword-matching helper, my-total-requests.ts had a lookup table, the approval-history and
 * observation dialogs had component-scoped .badge classes, and the draft lists rendered the status
 * as a plain blue link. The same word came out a different colour depending on where you were
 * standing -- Reverted in particular was grey in one grid, amber in a modal, indigo in another
 * grid, and red in a third.
 *
 * Two rules everything now goes through:
 *   - normalizeStatusLabel() decides the WORD. Storage values are not user-facing: the workflow
 *     stores 'Reworked' and 'Running' and 'Completed', which read as Reverted, Pending and
 *     Approved.
 *   - statusBadgeClass() decides the COLOUR, by returning a class from styles.css rather than
 *     inline hex. Change the colour there and it changes everywhere at once, which is the whole
 *     point.
 */

export type DmsStatusTone = 'approved' | 'rejected' | 'reverted' | 'pending' | 'draft';

/** Storage/workflow values that read differently to a user. */
const EXPLICIT_LABELS: Record<string, string> = {
  reworked: 'Reverted',
  rework: 'Reverted',
  running: 'Pending',
  completed: 'Approved',
  inprogress: 'In Approval',
};

/**
 * The word to show for a stored status. Anything already user-facing (state names like
 * "Training Pending" or "Authorization Pending") is passed through untouched.
 */
export function normalizeStatusLabel(raw: unknown): string {
  const value = (raw ?? '').toString().trim();
  if (!value) return '';

  const key = value.toLowerCase().replace(/[\s_-]/g, '');
  return EXPLICIT_LABELS[key] ?? value;
}

/**
 * Which of the five tones a status belongs to.
 *
 * Matched on keywords, not an exact-string table, because several of these values are free-text
 * state names from the database rather than fixed codes -- so a state renamed from "Authorized" to
 * "Authorised" keeps its colour instead of silently falling back to grey.
 *
 * Order matters: 'reject' is tested before 'pending' so "Rejected - pending rework" reads as
 * rejected, and reverted is tested before pending so it never collapses into the amber bucket the
 * way it used to.
 */
export function statusTone(raw: unknown): DmsStatusTone {
  const s = normalizeStatusLabel(raw).toLowerCase();
  if (!s) return 'draft';

  if (s.includes('revert') || s.includes('rework')) return 'reverted';
  if (s.includes('reject')) return 'rejected';
  if (s.includes('approv') || s.includes('effective') || s.includes('authoriz') || s.includes('authoris') || s.includes('complete')) {
    return 'approved';
  }
  if (s.includes('pending') || s.includes('progress') || s.includes('review') || s.includes('running') || s.includes('submit')) {
    return 'pending';
  }
  return 'draft';
}

/** The CSS class carrying that tone's colours. Defined once in styles.css. */
export function statusBadgeClass(raw: unknown): string {
  return 'dms-status-' + statusTone(raw);
}

/**
 * Ready-made pill markup for an ag-Grid cellRenderer.
 *
 * Returns '' for an empty status so a blank cell stays blank rather than rendering an empty pill.
 */
export function statusBadgeHtml(raw: unknown): string {
  const label = normalizeStatusLabel(raw);
  if (!label) return '';
  return `<span class="dms-status-pill ${statusBadgeClass(label)}">${label}</span>`;
}

/** Drop straight into a ColDef: `cellRenderer: statusCellRenderer`. */
export function statusCellRenderer(params: { value?: unknown }): string {
  return statusBadgeHtml(params?.value);
}
