// The People Partners organisation -- Division > Department > Sub-Department, and the roles held in each
// combination -- as the Document Users and Distribution List grids offer it (the same hierarchy the Users
// screen shows). Loaded once from DMSPeoplePartners/get-org-structure and filtered here as a row is edited.
import { GridColumn } from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';

export interface OrgOption {
  id: string;
  text: string;
  /** Division for a Department, Department for a Sub-Department. */
  parentId?: string;
}

export interface OrgRoleScope {
  divisionId: string;
  departmentId: string;
  subDepartmentId: string;
  roleId: number;
  roleName: string;
}

export interface OrgStructure {
  divisions: OrgOption[];
  departments: OrgOption[];
  subDepartments: OrgOption[];
  roles: OrgRoleScope[];
}

/** The grid fields that hold the organisation unit of a row, top level first. */
export const ORG_FIELDS = ['level1Id', 'level2Id', 'level3Id'];

export function emptyOrgStructure(): OrgStructure {
  return { divisions: [], departments: [], subDepartments: [], roles: [] };
}

const str = (v: any): string => (v === null || v === undefined ? '' : String(v));

// Casing of the JSON keys depends on how the API serialises, so every read accepts both.
const pick = (o: any, ...keys: string[]): any => {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
  return undefined;
};

export function parseOrgStructure(data: any): OrgStructure {
  const options = (rows: any[]): OrgOption[] =>
    (rows ?? []).map((r) => ({
      id: str(pick(r, 'Id', 'id')),
      text: str(pick(r, 'Name', 'name')),
      parentId: str(pick(r, 'ParentId', 'parentId')) || undefined,
    }));

  return {
    divisions: options(pick(data, 'Divisions', 'divisions')),
    departments: options(pick(data, 'Departments', 'departments')),
    subDepartments: options(pick(data, 'SubDepartments', 'subDepartments')),
    roles: (pick(data, 'Roles', 'roles') ?? []).map((r: any) => ({
      divisionId: str(pick(r, 'DivisionId', 'divisionId')),
      departmentId: str(pick(r, 'DepartmentId', 'departmentId')),
      subDepartmentId: str(pick(r, 'SubDepartmentId', 'subDepartmentId')),
      roleId: Number(pick(r, 'RoleId', 'roleId')),
      roleName: str(pick(r, 'RoleName', 'roleName')),
    })),
  };
}

/** Departments of the chosen Division. With no Division chosen ("Any") there is nothing to narrow, so none are offered. */
export function departmentsFor(org: OrgStructure, divisionId: any): OrgOption[] {
  const d = str(divisionId);
  return d ? org.departments.filter((x) => x.parentId === d) : [];
}

/** Sub-Departments of the chosen Department. */
export function subDepartmentsFor(org: OrgStructure, departmentId: any): OrgOption[] {
  const d = str(departmentId);
  return d ? org.subDepartments.filter((x) => x.parentId === d) : [];
}

/**
 * The roles held by people inside the organisation unit a row has picked. A level left blank is "all", so a row with
 * nothing picked offers every role in the company.
 */
export function rolesFor(
  org: OrgStructure,
  unit: { division?: any; department?: any; subDepartment?: any },
): { id: number; text: string }[] {
  const division = str(unit.division);
  const department = str(unit.department);
  const subDepartment = str(unit.subDepartment);

  const found = new Map<number, string>();
  for (const r of org.roles) {
    if (division && r.divisionId !== division) continue;
    if (department && r.departmentId !== department) continue;
    if (subDepartment && r.subDepartmentId !== subDepartment) continue;
    if (!found.has(r.roleId)) found.set(r.roleId, r.roleName);
  }
  return [...found.entries()]
    .map(([id, text]) => ({ id, text }))
    .sort((a, b) => a.text.localeCompare(b.text));
}

/**
 * The Division / Department / Sub-Department columns, as cascading dropdowns: Department follows the Division,
 * Sub-Department follows the Department, and changing a level clears the ones below it. The dropdowns read "Any".
 *
 * A saved row with a level left blank reads "All" only when there is something to be "all" of: a Department left blank
 * under a Division that has departments, a Sub-Department left blank under a Department that has sub-departments. Where
 * the level above has none (a department with no sub-departments), the blank stays empty -- "All" there would claim
 * a choice that does not exist.
 */
export function buildOrgColumns(org: OrgStructure): GridColumn[] {
  const common = {
    type: 'dropdown',
    dropdownValueField: 'id',
    dropdownDisplayField: 'text',
    minWidth: 230,
    required: false,
    showSearch: true,
    placeholder: 'Any',
    emptyValueDisplay: 'All',
  } as const;

  return [
    {
      ...common,
      field: 'level1Id',
      headerName: 'Division',
      dropdownOptions: org.divisions,
    },
    {
      ...common,
      field: 'level2Id',
      headerName: 'Department',
      dropdownOptions: org.departments,
      dropdownOptionsForRow: (row: any) => departmentsFor(org, row?.level1Id),
      clearWhenChanged: ['level1Id'],
      emptyValueDisplayForRow: (row: any) =>
        str(row?.level1Id) && departmentsFor(org, row?.level1Id).length === 0 ? '' : 'All',
    },
    {
      ...common,
      field: 'level3Id',
      headerName: 'Sub Department',
      dropdownOptions: org.subDepartments,
      dropdownOptionsForRow: (row: any) => subDepartmentsFor(org, row?.level2Id),
      clearWhenChanged: ['level1Id', 'level2Id'],
      emptyValueDisplayForRow: (row: any) =>
        str(row?.level2Id) && subDepartmentsFor(org, row?.level2Id).length === 0 ? '' : 'All',
    },
  ] as GridColumn[];
}
