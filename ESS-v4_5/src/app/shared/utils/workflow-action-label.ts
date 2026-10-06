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

// Success toast for a single Approve / Revert / Reject taken from a My Approvals screen. One place so
// the two screens (and the wording the client signed off) cannot drift apart.
//   request  -> "The document request is approved successfully!"
//   document -> "Document approved successfully!"
export function getWorkflowSuccessMessage(
  action: string | null | undefined,
  kind: 'request' | 'document',
): string | null {
  const a = (action || '').toUpperCase();
  let past = '';
  if (a.includes('APPROV')) past = 'approved';
  else if (a.includes('REJECT')) past = 'rejected';
  else if (a.includes('REWORK') || a.includes('REVERT')) past = 'reverted';
  else return null;

  return kind === 'request'
    ? `The document request is ${past} successfully!`
    : `Document ${past} successfully!`;
}
