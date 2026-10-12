// Which roles may be offered for a cabinet combination, from the Role Cabinet Mapping
// (Setups configurations > Users > Role Cabinet Mapping).

/** One mapping as the API returns it. Division is always set; the lower levels are blank for "Any". */
export interface RoleCabinetMappingRow {
  RoleId: number;
  DivisionCode?: string | null;
  DepartmentCode?: string | null;
  SubDepartmentCode?: string | null;
  BusinessDomainCode?: string | null;
}

/** The cabinet a grid row has picked. A level left blank means "Any". */
export interface CabinetSelection {
  division?: string | null;
  department?: string | null;
  subDepartment?: string | null;
  businessDomain?: string | null;
}

// A mapping covers a row's level when its own level is blank ("Any" -- it covers everything below the
// level above) or is exactly the value the row picked. A level the row left blank is "Any" too, so only a
// mapping that is blank at that level covers it -- a mapping for one Department does not cover a row that
// spans every Department.
function covers(rowValue: string | null | undefined, mappedValue: string | null | undefined): boolean {
  const mapped = (mappedValue ?? '').toString().trim();
  if (!mapped) return true;
  return mapped === (rowValue ?? '').toString().trim();
}

/**
 * Ids (as strings) of the roles mapped to a cabinet that covers the one given. Division is always set on
 * a mapping, so with no Division picked on the row there is no role to offer.
 */
export function mappedRoleIdsForCabinet(
  mappings: RoleCabinetMappingRow[],
  cabinet: CabinetSelection,
): Set<string> {
  const ids = new Set<string>();
  for (const m of mappings) {
    if (
      covers(cabinet.division, m.DivisionCode) &&
      covers(cabinet.department, m.DepartmentCode) &&
      covers(cabinet.subDepartment, m.SubDepartmentCode) &&
      covers(cabinet.businessDomain, m.BusinessDomainCode)
    ) {
      ids.add(String(m.RoleId));
    }
  }
  return ids;
}
