import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { UserService } from '@app/shared/services/user-service';
import { ColDef } from 'ag-grid-community';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { UsersInRoleModal } from '../users-in-role-modal/users-in-role-modal';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { RoleCabinetMappingService } from '@app/shared/services/role-cabinet-mapping.service';
import {
  ALL_OPTION,
  ALL_VALUE,
  buildOrgColumns,
  clearAutoFilledUnits,
  emptyOrgStructure,
  fillUnitFromRole,
  isAll,
  ORG_FIELDS,
  OrgStructure,
  parseOrgStructure,
  rolesFor,
  unitChosenByPerson,
  unitValue,
} from '@app/shared/utils/org-structure';
import { SpinnerComponent } from '@app/shared/spinner/spinner.component';

// Identifies which "Document Users" grid row (Role + Cabinet scope) a selectedEmployeeList
// entry belongs to -- mirrors DocumentRequestUserDistribution's RoleId/*Code columns.
interface DistributionRule {
  roleId: any;
  divisionCode: any;
  departmentCode: any;
  subDepartmentCode: any;
  businessDomainCode: any;
}

// The RoleId stored on the employees picked under a row whose Role is "All": every role held in the row's unit. (An employee
// with no RoleId at all was not picked in this grid -- see reconstructManualUserData.)
const ALL_ROLES_ID = 0;

@Component({
  selector: 'app-drusers-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper, SpinnerComponent],
  templateUrl: './drusers-component.html',
  styleUrl: './drusers-component.css',
})
export class DRUsersComponent {
  @Input() selectedUsers: any[] = [];
  @Output() usersChanged = new EventEmitter<any[]>();
  @Input() documentTypeCode?: string = '';

  gridConfig: GridConfig = {} as GridConfig;
  // --- PERMISSION FLAGS ---
  /**
   * Read-only mode: no add row, no edit, no delete. Used by Obsoletion, where FSD 4.1.3
   * disables the Users section "as no new users are assigned" -- the list is shown for
   * confirmation only. Defaults to false so every other screen is unaffected.
   */
  @Input() readOnly = false;

  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'requestdocumentcreation';

  manualUserData: any[] = [];
  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  userRoles: any[] = [];
  // Role <-> Cabinet mapping: a row's Role dropdown only offers the roles mapped to the cabinet picked on it.
  // People Partners organisation (Division > Department > Sub-Department, and the roles held in each).
  org: OrgStructure = emptyOrgStructure();
  selectedEmployeeList: any[] = [];

  totalManullayManageEmployees = 0;
  loading = false;
  loginEmpId: string = '';

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  pinnedTopRowDataPlanning: AccessLevelColumns[] = [
    {
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      userId: null,
      isNewRow: true,
    },
  ];

  constructor(
    private _userService: UserService,
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
    private _cabinetHirarchyService: CabinetHierarchyService,
    private cabinetGridService: CabinetGridService,
    private _UtilitiesService: UtilitiesService,
    private _peoplePartnerService: PeoplePartnersService,
    private _permissionService: PermissionService,
    private _roleCabinetMappingService: RoleCabinetMappingService,
  ) {}

  ngOnInit() {
    this.loading = true;
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      if (this.selectedUsers && this.selectedUsers.length > 0) {
        this.selectedEmployeeList = [...this.selectedUsers];
      }

      this.loadDropdownsAndGrid();
    });
    // this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
    //   this.canAdd = permissions.canAdd;
    //   this.canEdit = permissions.canEdit;
    //   this.canDelete = permissions.canDelete;

    //   if (this.selectedUsers && this.selectedUsers.length > 0) {
    //     this.selectedEmployeeList = [...this.selectedUsers];
    //   }

    //   this._cabinetHirarchyService.loadDropdownHierarchy().subscribe((levels) => {
    //     this.cabinetHierarchy = levels;

    //     this.cabinetGridService.loadDropdownData(levels).subscribe(() => this.buildGrid());
    //   });

    //   this.GetAllUserRoles();
    //   // this._cabinetHirarchyService.loadDropdownHierarchy(); // 🔥 REQUIRED
    //   // this.getAllDivisionList();
    //   // this.getAllDepartmentList();
    //   // this.getAllSubDepartmentList();
    // });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedUsers']) {
      this.selectedEmployeeList = [...this.selectedUsers];
      // No-op until userRoles/cabinet dropdowns are loaded (guarded inside) -- on the very
      // first row click in a session this fires before loadDropdownsAndGrid() resolves, so
      // that method retries the reconstruction itself once it's ready.
      this.reconstructManualUserData();
    }
  }

  GetLoginEmpId() {
    this.loginEmpId = this._UtilitiesService.GetEmpid() || '';
  }

  private getRemainingColumns(): GridColumn[] {
    return [
      {
        field: 'userId',
        headerName: 'User Role',
        type: 'dropdown',
        dropdownOptions: [ALL_OPTION, ...this.userRoles],
        // "All" first, then only the roles held inside this row's organisation unit. A change to any level clears the
        // Role, since the one picked may no longer be held there. "All" stands for every role held in that unit.
        dropdownOptionsForRow: (row: any) => [ALL_OPTION, ...this.rolesForRow(row)],
        clearWhenChanged: this.cabinetFieldNames(),
        // Picking a Role fills in the Department / Sub-Department it belongs to (see fillUnitFromRole) -- but not when the
        // Division is "All": a role held in many Divisions says nothing about one Department. Same as the Distribution List.
        afterValueChange: (row: any) => {
          if (!unitValue(row?.level1Id)) clearAutoFilledUnits(row);
          else fillUnitFromRole(this.org, row, 'userId');
        },
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        // Division and Role must be chosen on purpose (a person or "All"), as on the Distribution List.
        placeholder: 'Select Role',
        emptyValueDisplay: 'All',
        required: true,
        clickable: true,
        showSearch: true,
        clickAction: 'userId', // triggers handleGridAction for 'userId'
      },
      {
        field: 'employeeSelectionStatus',
        headerName: 'Employee Selection Status',
        type: 'readonly',
        editable: false,
        minWidth: 220,
      },
    ];
  }

  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      // No paging bar: every row is shown and the grid grows with them. Paging itself stays on (with a
      // page size no list will reach) because the auto-height grid only re-measures itself reliably that
      // way -- turning it off outright left everything past the second row out of sight.
      enablePagination: true,
      hidePaginationPanel: true,
      pageSize: 1000,
      pageSizeOptions: [1000],
      enableSorting: true,
      enableFiltering: true,
      enableSelection: true,
      enableInlineAdd: this.canAdd && !this.readOnly,
      enableInlineEdit: this.canEdit && !this.readOnly,
      enableInlineDelete: this.canDelete && !this.readOnly,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
      canAddRow: (row: any) => this.roleIsFree(row),
      canUpdateRow: (row: any, index: number) => this.roleIsFree(row, index),
    };
  }

  // The id of the Role a row holds. A row added in this session holds the id; one rebuilt from saved users holds the
  // Role's name, so either is matched against the role list.
  private roleIdOfRow(row: any): string {
    const value = row?.userId;
    if (value === null || value === undefined || value === '') return '';
    if (isAll(value)) return 'ALL';
    const role = this.userRoles.find((r) => String(r.id) === String(value) || r.text === value);
    return String(role ? role.id : value);
  }

  // A Role can be in Document Users only once. "All" (every role of the unit) can be added once for each unit.
  private roleIsFree(row: any, ignoreIndex = -1): boolean {
    const role = this.roleIdOfRow(row);
    if (!role) return true;

    const unit = (r: any) => [r?.level1Id, r?.level2Id, r?.level3Id].map((v) => String(unitValue(v) ?? '')).join('|');
    const taken = this.manualUserData.some(
      (r, i) => i !== ignoreIndex && this.roleIdOfRow(r) === role && (role !== 'ALL' || unit(r) === unit(row)),
    );
    if (taken) {
      const name = this.userRoles.find((r) => String(r.id) === role)?.text || 'This role';
      this._notificationToastService.createNotification(
        'warning',
        'Document Users',
        role === 'ALL'
          ? 'All roles is already added for this Division / Department / Sub Department.'
          : `Role "${name}" is already added.`,
      );
    }
    return !taken;
  }

  private cabinetFieldNames(): string[] {
    return ORG_FIELDS;
  }

  // The roles held inside the organisation unit this row has picked.
  private rolesForRow(row: any): any[] {
    // A Department / Sub-Department that a Role filled in itself does not narrow the list: it stays the roles of the
    // Division (and whatever the person chose), so another Role can be picked straight away.
    return rolesFor(this.org, {
      division: row?.level1Id,
      department: row?.autoFilledDepartment ? '' : row?.level2Id,
      subDepartment: row?.autoFilledSubDepartment ? '' : row?.level3Id,
    });
  }

  private getColumns(): GridColumn[] {
    // Division > Department > Sub-Department come from People Partners (the hierarchy the Users screen shows) and
    // cascade; a blank level means every one, the same as on the Distribution List. The dropdowns read "Any"; a
    // saved row with the level blank reads "All".
    // Each list has an explicit "All" at the top, as on the Distribution List; choosing it on a level fills the levels below
    // with "All" as well, and Division must be chosen (a person or "All" -- an untouched row never means everyone).
    const orgColumns = buildOrgColumns(this.org, true).map((col) => {
      if (col.field === 'level1Id') {
        return {
          ...col,
          required: true,
          placeholder: 'Select Division',
          afterValueChange: (row: any) => {
            unitChosenByPerson(row);
            if (isAll(row?.level1Id)) {
              row.level2Id = ALL_VALUE;
              row.level3Id = ALL_VALUE;
            }
          },
        };
      }
      if (col.field === 'level2Id') {
        return {
          ...col,
          placeholder: 'All',
          afterValueChange: (row: any) => {
            unitChosenByPerson(row);
            if (isAll(row?.level2Id)) row.level3Id = ALL_VALUE;
          },
        };
      }
      return { ...col, placeholder: 'All' };
    });
    return [...orgColumns, ...this.getRemainingColumns()];
  }

  GetAllManuallyManageEmployee(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._userService
      .GetAllUser(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalManullayManageEmployees = res.Data.TotalCount;
          this.manualUserData = res.Data.Items.map((item: any) => ({
            Id: item.id || item.Id,
            EmployeeCode: item.employeeCode || item.EmployeeCode,
            UserName: item.userName || item.UserName,
            Grade: item.grade || item.Grade,
            DivisionCode: item.divisionCode || item.DivisionCode,
            DivisionName: item.divisionCode || item.DivisionCode,
            DepartmentCode: item.departmentCode || item.DepartmentCode,
            DepartmentName: item.departmentCode || item.DepartmentCode,
            SubDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
            SubDepartmentName: item.subDepartmentCode || item.SubDepartmentCode,
            ReportingTo: item.reportingTo || item.ReportingTo,
            DateOfJoining: new CustomDateFormatPipe().transform(
              item.dateOfJoining || item.DateOfJoining || '',
            ),
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            Description: item.description || item.Description,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          }));
          //console.log('Mapped documentTypeData:', this.documentTypeData);
        } else {
          this.manualUserData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  }

  handleGridAction(event: { action: string; rowData: any }) {
    if (event.action === 'userId') {
      this.openCabinetModal(event.rowData);
    }
  }

  openCabinetModal(rowData: any): void {
    if (!rowData.userId) {
      this._notificationToastService.createNotification(
        'warning',
        'Warning',
        'Please select a User Role first.',
      );
      return;
    }

    // Since rowData.userId might contain the display text (due to getDisplayName in onRowAdded),
    // we look up the actual Role ID from the userRoles list. "All" is ALL_ROLES_ID.
    const roleId = this.resolveRoleId(rowData.userId);

    const rule = this.ruleOf(rowData, roleId);

    // Lets the modal check off everyone already selected for this row (auto-selected on add,
    // or picked in a previous visit to this modal) so the user can see who's in/out at a
    // glance instead of starting from a blank grid.
    const preSelectedEmployeeCodes = this.selectedEmployeeList
      .filter((emp) => this.employeeMatchesRule(emp, rule))
      .map((emp) => emp.employeeCode || emp.EmployeeCode || emp.empcode || emp.empid)
      .filter((code) => code != null);

    const modalRef = this.modal.create({
      nzTitle: 'Users in Role',
      nzContent: UsersInRoleModal,
      nzData: {
        data: roleId, // pass the resolved roleId instead of the text
        // For "All": every role held in the row's unit -- the modal lists the employees of all of them.
        roleIds: roleId === ALL_ROLES_ID ? this.allRoleIdsFor(rule) : undefined,
        divisionCode: rule.divisionCode,
        departmentCode: rule.departmentCode,
        subDepartmentCode: rule.subDepartmentCode,
        businessDomainCode: rule.businessDomainCode,
        documentTypeCode: this.documentTypeCode,
        preSelectedEmployeeCodes,
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((selectedUsers: any[] | undefined) => {
      // save() always calls modalRef.destroy(this.selectedRows) -- an array, even an empty one
      // when the user unchecked everyone. undefined only happens if the modal was dismissed
      // via the mask/Esc/X without clicking Save, which should leave the selection untouched.
      if (!selectedUsers) return;

      const selectedCodes = new Set(
        selectedUsers
          .map((user) => user.employeeCode || user.EmployeeCode || user.empcode || user.empid)
          .filter((code) => code != null),
      );

      // Replace this row's slice of selectedEmployeeList with exactly what the modal now
      // says is checked -- both newly-checked AND unchecked employees need to take effect,
      // not just additions, otherwise deselecting someone here never sticks.
      this.selectedEmployeeList = this.selectedEmployeeList.filter((emp) => {
        if (!this.employeeMatchesRule(emp, rule)) return true;
        const code = emp.employeeCode || emp.EmployeeCode || emp.empcode || emp.empid;
        return selectedCodes.has(code);
      });

      // Tagged with the same rule fields onRowDeleted filters on, so anyone added here still
      // gets cleaned up correctly if the distribution row is later deleted. Scoped to THIS
      // row's rule, not just employeeCode -- someone who holds two roles (e.g. both "Team
      // Head" and "Accountant") must be trackable under both rows independently, otherwise
      // whichever row claims them first silently blocks the other row from ever selecting them.
      selectedUsers.forEach((user) => {
        const code = user.employeeCode || user.EmployeeCode || user.empcode || user.empid;
        const exists = this.selectedEmployeeList.some(
          (u) =>
            (u.employeeCode || u.EmployeeCode || u.empcode || u.empid) === code &&
            this.employeeMatchesRule(u, rule),
        );
        if (!exists) {
          this.selectedEmployeeList.push({ ...user, ...rule });
        }
      });

      // Keep the grid's "Employee Selection Status" column in sync with any manual changes
      // made here.
      const totalMatching = rowData.totalMatchingEmployees ?? selectedUsers.length;
      this.updateSelectionStatus(rowData, rule, totalMatching);

      // Emit the updated list to the parent component (document-request-management.ts)
      this.usersChanged.emit(this.selectedEmployeeList);
    });
  }

  // Shared by onRowDeleted's cleanup filter and the "Employee Selection Status" column's
  // selected-count computation -- both need to identify which selectedEmployeeList entries
  // belong to a given distribution row (Role + Cabinet scope).
  //
  // Reads both casings: entries created live in this session are tagged with camelCase (via
  // `{...rule}`), but entries reloaded from the backend come back PascalCase (RoleId,
  // DivisionCode, ...) -- the API's actual wire format, since AddNewtonsoftJson's
  // DefaultContractResolver (Program.cs) preserves C# property casing as-is, overriding the
  // camelCase System.Text.Json policy configured just above it. Without this fallback, every
  // reloaded employee silently failed to match its row, showing "0 of N selected" even though
  // they truly were selected.
  private employeeMatchesRule(
    emp: any,
    rule: {
      roleId: any;
      divisionCode: any;
      departmentCode: any;
      subDepartmentCode: any;
      businessDomainCode: any;
    },
  ): boolean {
    const roleId = emp.roleId ?? emp.RoleId;
    const divisionCode = emp.divisionCode ?? emp.DivisionCode ?? null;
    const departmentCode = emp.departmentCode ?? emp.DepartmentCode ?? null;
    const subDepartmentCode = emp.subDepartmentCode ?? emp.SubDepartmentCode ?? null;
    const businessDomainCode = emp.businessDomainCode ?? emp.BusinessDomainCode ?? null;

    const cabinetMatches =
      divisionCode === (rule.divisionCode || null) &&
      departmentCode === (rule.departmentCode || null) &&
      subDepartmentCode === (rule.subDepartmentCode || null) &&
      businessDomainCode === (rule.businessDomainCode || null);

    if (!cabinetMatches) return false;

    return roleId === rule.roleId || (roleId != null && rule.roleId != null && String(roleId) === String(rule.roleId));
  }

  // The Role a grid row holds as an id: a role's own id, or ALL_ROLES_ID for "All". (A row rebuilt from saved users holds the
  // Role's name, so either is matched against the role list.)
  private resolveRoleId(value: any): any {
    if (isAll(value)) return ALL_ROLES_ID;
    const role = this.userRoles.find((r) => r.id == value || r.text == value);
    return role ? role.id : value;
  }

  // The rule (Role + organisation unit) a grid row stands for. "All" on a level is a blank code: no filter.
  private ruleOf(row: any, roleId: any): DistributionRule {
    const code = (level: string, alt: string) => {
      const v = row?.[level];
      if (isAll(v)) return null;
      return v || row?.[alt] || null;
    };
    return {
      roleId,
      divisionCode: code('level1Id', 'divisionCode'),
      departmentCode: code('level2Id', 'departmentCode'),
      subDepartmentCode: code('level3Id', 'subDepartmentCode'),
      businessDomainCode: row?.level4Id || row?.businessDomainCode || null,
    };
  }

  // Every role held inside the unit of a rule: what "All" roles stands for.
  private allRoleIdsFor(rule: DistributionRule): number[] {
    return rolesFor(this.org, {
      division: rule.divisionCode,
      department: rule.departmentCode,
      subDepartment: rule.subDepartmentCode,
    }).map((r) => r.id);
  }

  // The employees of a rule: the holders of its Role, or of every role of its unit when the Role is "All" (each person once).
  private fetchEmployeesForRule(rule: DistributionRule, payload: any): Observable<any[]> {
    const pick = (res: any): any[] => {
      const data = res?.Data;
      return (Array.isArray(data) ? data : data?.Items || []).filter((u: any) => u != null);
    };
    const codeOf = (u: any) => u.empcode || u.EmployeeCode || u.employeeCode || u.empid;

    if (rule.roleId !== ALL_ROLES_ID) {
      return this._peoplePartnerService.getUserByRoleId(rule.roleId, payload).pipe(map(pick));
    }
    const roleIds = this.allRoleIdsFor(rule);
    if (!roleIds.length) return of([]);
    return forkJoin(roleIds.map((id) => this._peoplePartnerService.getUserByRoleId(String(id), payload).pipe(map(pick), catchError(() => of([]))))).pipe(
      map((lists) => {
        const seen = new Set<any>();
        const all: any[] = [];
        for (const u of lists.flat()) {
          const code = codeOf(u);
          if (code == null || seen.has(code)) continue;
          seen.add(code);
          all.push(u);
        }
        return all;
      }),
    );
  }

  // Recomputes and writes the "N of M selected" text for one grid row, then replaces
  // manualUserData so the grid picks up the change.
  private updateSelectionStatus(
    rowData: any,
    rule: {
      roleId: any;
      divisionCode: any;
      departmentCode: any;
      subDepartmentCode: any;
      businessDomainCode: any;
    },
    totalMatching: number,
  ): void {
    const selectedCount = this.selectedEmployeeList.filter((emp) =>
      this.employeeMatchesRule(emp, rule),
    ).length;

    rowData.totalMatchingEmployees = totalMatching;
    rowData.employeeSelectionStatus = `${selectedCount} of ${totalMatching} selected`;

    this.manualUserData = this.manualUserData.map((row) =>
      row.id === rowData.id ? { ...rowData } : row,
    );
  }

  // Fetches every employee in the row's Role + Cabinet scope and selects all of them by
  // default -- the "User Role" hyperlink (openCabinetModal) still lets the user narrow this
  // down afterwards, same as before.
  private autoSelectEmployeesForRow(rowData: any, roleId: any): void {
    const rule = this.ruleOf(rowData, roleId);

    const payload = {
      searchtext: '',
      sortby: 'ASC',
      sortcolumn: 'empid',
      isactive: true,
      pagenumber: 1,
      // Large enough to fetch every matching employee in one page rather than the modal's
      // default 10-per-page -- this is a "select all", not a browsable list.
      pagesize: 1000000,
      divisionCode: rule.divisionCode,
      departmentCode: rule.departmentCode,
      subDepartmentCode: rule.subDepartmentCode,
      businessDomainCode: rule.businessDomainCode,
      documentTypeCode: this.documentTypeCode || null,
    };

    this.fetchEmployeesForRule(rule, payload).subscribe({
      next: (users) => {
        const mappedUsers = users.map((u: any) => ({
          ...u, // Preserves raw backend properties like 'empid' for the parent to use
          employeeCode: u.empcode || u.EmployeeCode || u.employeeCode,
          employeeName: u.firstname
            ? `${u.firstname} ${u.midname || ''} ${u.lastname || ''}`.trim().replace(/\s+/g, ' ')
            : u.EmployeeName || u.employeeName || u.UserName || u.userName,
          designation:
            u.Designation || u.designation || u.DesignationName || (u.dsgid ? String(u.dsgid) : ''),
          role: roleId === ALL_ROLES_ID ? 'All' : this.getDisplayName(this.userRoles, roleId),
          ...rule,
        }));

        // Scoped to THIS row's rule, not just employeeCode -- someone who holds two roles
        // (e.g. both "Team Head" and "Accountant") must be trackable under both rows
        // independently, otherwise whichever row is added first silently blocks the other
        // row from ever selecting them (they'd already "exist" globally), which made the
        // second row look like it never got any employees.
        mappedUsers.forEach((user: any) => {
          const code = user.employeeCode || user.EmployeeCode || user.empcode || user.empid;
          const exists = this.selectedEmployeeList.some(
            (u) =>
              (u.employeeCode || u.EmployeeCode || u.empcode || u.empid) === code &&
              this.employeeMatchesRule(u, rule),
          );
          if (!exists) {
            this.selectedEmployeeList.push(user);
          }
        });

        this.updateSelectionStatus(rowData, rule, mappedUsers.length);
        this.usersChanged.emit(this.selectedEmployeeList);
      },
      error: () => {
        this.updateSelectionStatus(rowData, rule, 0);
      },
    });
  }

  // Rebuilds the "Document Users" grid rows (manualUserData) from selectedEmployeeList --
  // needed whenever a different draft/request is loaded (selectedUsers input changes), since
  // the grid rows themselves are never persisted, only the flat employee selection is (see
  // DocumentRequestUserDistribution.RoleId/*Code -- this is what makes reconstruction possible
  // at all). Groups selectedEmployeeList by (RoleId, Cabinet); entries with no RoleId are
  // untagged (auto-expanded from the separate Distribution List/Role section) and are
  // intentionally left out of this grid, same as before.
  private reconstructManualUserData(): void {
    if (!this.userRoles.length) return;

    const groups = new Map<string, { rule: DistributionRule; row: any }>();

    for (const emp of this.selectedEmployeeList) {
      const roleId = emp.roleId ?? emp.RoleId;
      if (roleId == null) continue;

      const rule: DistributionRule = {
        roleId,
        divisionCode: emp.divisionCode ?? emp.DivisionCode ?? null,
        departmentCode: emp.departmentCode ?? emp.DepartmentCode ?? null,
        subDepartmentCode: emp.subDepartmentCode ?? emp.SubDepartmentCode ?? null,
        businessDomainCode: emp.businessDomainCode ?? emp.BusinessDomainCode ?? null,
      };
      const key = JSON.stringify(rule);

      if (!groups.has(key)) {
        groups.set(key, {
          rule,
          row: {
            id: this.generateId(),
            // A blank Division or Role on saved users is "all of them": shown as the explicit All choice (Department and
            // Sub-Department stay blank, which already reads "All").
            level1Id: rule.divisionCode || ALL_VALUE,
            level2Id: rule.departmentCode,
            level3Id: rule.subDepartmentCode,
            level4Id: rule.businessDomainCode,
            userId: Number(roleId) === ALL_ROLES_ID ? ALL_VALUE : this.getDisplayName(this.userRoles, roleId),
            employeeSelectionStatus: 'Loading...',
          },
        });
      }
    }

    this.manualUserData = Array.from(groups.values()).map((g) => g.row);
    groups.forEach((g) => this.fetchTotalMatchingEmployees(g.row, g.rule));
  }

  // Fetches just the total headcount for a Role + Cabinet scope (M in "N of M selected") --
  // used on reconstruction, where the employees themselves are already selected (they came
  // from selectedUsers), unlike autoSelectEmployeesForRow which also has to select them.
  private fetchTotalMatchingEmployees(rowData: any, rule: DistributionRule): void {
    const payload = {
      searchtext: '',
      sortby: 'ASC',
      sortcolumn: 'empid',
      isactive: true,
      pagenumber: 1,
      pagesize: 1000000,
      divisionCode: rule.divisionCode,
      departmentCode: rule.departmentCode,
      subDepartmentCode: rule.subDepartmentCode,
      businessDomainCode: rule.businessDomainCode,
      documentTypeCode: this.documentTypeCode || null,
    };

    this.fetchEmployeesForRule(rule, payload).subscribe({
      next: (users) => {
        this.updateSelectionStatus(rowData, rule, users.length);
      },
      error: () => {
        this.updateSelectionStatus(rowData, rule, 0);
      },
    });
  }

  onSelectionChanged(selectedRows: any[]): void {
    //console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event;
    //debugger;
    // Add logic to generate IDs, validate, etc.
    // const payLoad = {
    //   divisionCode: rowData.level1Id || rowData.level1Id,
    //   departmentCode: rowData.level2Id || rowData.level2Id,
    //   subDepartmentCode: rowData.level3Id || rowData.level3Id,
    //   businessDomainCode: rowData.level4Id || rowData.level4Id,
    // };

    // this._userService.create(payLoad).subscribe(() => {
    //   this._notificationToasService.createNotification('success', 'User', 'User created successfully!');
    // });
    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      divisionName: this.getDisplayName(this.divisions, rowData.divisionName),
      departmentName: this.getDisplayName(this.departments, rowData.departmentName),
      subDepartmentName: this.getDisplayName(this.subDepartments, rowData.subDepartmentName),
      userId: isAll(rowData.userId) ? ALL_VALUE : this.getDisplayName(this.userRoles, rowData.userId),
      employeeSelectionStatus: 'Loading...',
    };

    this.manualUserData = [rowWithId, ...this.manualUserData];

    // rowData.userId is still the raw role ID at this point (rowWithId.userId above has
    // already been swapped for the display text).
    const roleId = this.resolveRoleId(rowData.userId);

    this.autoSelectEmployeesForRow(rowWithId, roleId);
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    //console.log('Row updated:', event);
    // debugger;
    const payLoad = {
      divisionCode: unitValue(event.rowData.level1Id) || undefined,
      departmentCode: unitValue(event.rowData.level2Id) || undefined,
      subDepartmentCode: unitValue(event.rowData.level3Id) || undefined,
      businessDomainCode: event.rowData.level4Id || event.rowData.level4Id,
    };

    this._userService.update(payLoad).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'User',
        'User created successfully!',
      );

      // Update display names
      event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
      event.rowData.departmentName = this.getDisplayName(
        this.departments,
        event.rowData.departmentId,
      );
      // event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

      this.manualUserData[event.index] = { ...event.rowData };
      this.manualUserData = [...this.manualUserData]; // Trigger change detection
    });
  }

  onRowDeleted(rowIndex: number): void {
    const deletedRow = this.manualUserData[rowIndex];
    if (!deletedRow) return;

    // Remove the access rule from the grid data
    this.manualUserData.splice(rowIndex, 1);
    this.manualUserData = [...this.manualUserData];

    // Find the actual role ID from the userRoles list ("All" is ALL_ROLES_ID)
    const role = this.userRoles.find(r => r.id === deletedRow.userId || r.text === deletedRow.userId);
    const roleId = isAll(deletedRow.userId) ? ALL_ROLES_ID : role ? role.id : null;

    if (roleId === null || roleId === undefined || roleId === '') return;

    const rule = this.ruleOf(deletedRow, roleId);

    // Filter out employees that match the deleted rule's criteria
    this.selectedEmployeeList = this.selectedEmployeeList.filter(
      (emp) => !this.employeeMatchesRule(emp, rule),
    );
    this.usersChanged.emit(this.selectedEmployeeList);
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', JSON.stringify(event));

    // Handle calculations if needed
    if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
      const currentSalary = event.rowData.currentSalary || 0;
      const incrementPercentage = event.rowData.incrementPercentage || 0;
      event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

      // Update the row
      this.manualUserData[event.rowIndex] = { ...event.rowData };
    }

    if (event.field === 'file-preview') {
      // Handle file preview
      this.previewFile(event.value);
    } else {
      // Handle regular value changes
      //console.log('Cell value changed:', event);
    }
  }

  // Date.now() alone collides when multiple rows are generated in the same synchronous pass
  // (e.g. reconstructManualUserData() building several group rows in one loop, all within the
  // same millisecond) -- two rows sharing an id makes updateSelectionStatus's id-match replace
  // BOTH rows with whichever row's data resolves last, which is what made two different Role
  // rows collapse into duplicates of one.
  private idCounter = 0;
  private generateId(): number {
    return Date.now() * 1000 + this.idCounter++;
  }

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  previewFile(fileInfo: any): void {
    // Implement file preview logic
    if (fileInfo?.url) {
      // Open in modal or new tab
      window.open(fileInfo.url, '_blank');
    }
  }

  private loadDropdownsAndGrid(): void {
    forkJoin({
      userRoles: this._peoplePartnerService.GetAllRoles(),
      // If the organisation cannot be read the grid still loads; its Division / Department / Role lists are empty.
      org: this._peoplePartnerService.GetOrgStructure().pipe(catchError(() => of(null))),
    }).subscribe(({ userRoles, org }) => {
      this.org = parseOrgStructure(org?.Data);

      // ✅ Normalize Roles. No "ALL" option here -- Role is mandatory on this grid and every
      // row must resolve to one specific real role.
      this.userRoles =
        userRoles?.Data?.map((d: any) => ({
          id: d.Id,
          text: d.Value,
        })) ?? [];

      this.buildGrid();
      // Rebuilds the "Document Users" grid rows from selectedUsers now that userRoles/
      // organisation dropdown options (needed to resolve display text) are actually loaded.
      this.reconstructManualUserData();
      this.loading = false;
    });
  }

  GetAllUserRoles = () => {
    this._peoplePartnerService.GetAllRoles().subscribe((res) => {
      this.userRoles = (res?.Data ?? []).map((d: any) => ({
        id: d.Id,
        text: d.Value,
      }));
    });
  };
}

class AccessLevelColumns {
  divisionId: string | null = null;
  //division: string | null = null;
  departmentId: string | null = null;
  //department: string | null = null;
  subDepartmentId: string | null = null;
  //subDepartment: string | null = null;
  userId: string | null = null;
  isNewRow: boolean = false;
}
