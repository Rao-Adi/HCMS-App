// Callers pass wildly inconsistent casing/wording for the same action ('APPROVE', 'APPROVED',
// 'Approve', 'Rejected', 'REJECTED', 'Rework', 'REWORKED') depending on which screen triggers
// the observation modal -- matched by substring so any of those variants normalize the same way.
export function getWorkflowActionLabel(action: string | null | undefined, noun: string): string {
  const a = (action || '').toUpperCase();
  if (a.includes('APPROV')) return `Approve ${noun}`;
  if (a.includes('REJECT')) return `Reject ${noun}`;
  if (a.includes('REWORK') || a.includes('REVERT')) return `Revert ${noun}`;
  return noun;
}
