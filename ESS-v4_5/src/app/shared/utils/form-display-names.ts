// Names shown on screen for forms whose name in the database (the Security menu tables) is different. The database keeps its name (other
// applications and role-rights screens read it); only what the DMS user SEES is changed here.
//
// "Request for Document Creation/Update" -> "Request for Document Revision/Obsoletion"  (menu item, page title, breadcrumb).
// Only that exact name: "My Approvals - Request for Document Creation/Update" is a different form and keeps its name.

const FORM_NAMES: Record<string, string> = {
  'request for document creation/update': 'Request for Document Revision/Obsoletion',
};

/** The name to show for a form (menu text, page title). Anything not in the list comes back unchanged. */
export function formDisplayName<T extends string | null | undefined>(name: T): T {
  if (!name) return name;
  const shown = FORM_NAMES[String(name).trim().toLowerCase()];
  return (shown ?? name) as T;
}

/** A breadcrumb ("Documents / Request for Document Creation/Update"): its LAST part is renamed when it is one of the forms above. */
export function breadcrumbDisplayName<T extends string | null | undefined>(breadcrumb: T): T {
  if (!breadcrumb) return breadcrumb;
  const text = String(breadcrumb);
  const at = text.lastIndexOf(' / ');
  const head = at < 0 ? '' : text.slice(0, at + 3);
  const last = at < 0 ? text : text.slice(at + 3);
  return (head + formDisplayName(last)) as T;
}

/** Renames, in place, every menu item (and its children) whose name is one of the forms above. */
export function renameMenuItems(items: any[] | null | undefined): void {
  for (const item of items ?? []) {
    if (item?.Text) item.Text = formDisplayName(item.Text);
    renameMenuItems(item?.child);
    renameMenuItems(item?.subChild);
  }
}
