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
import { catchError, forkJoin, map, of } from 'rxjs';
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

@Component({
  selector: 'app-drusers-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper, SpinnerComponent],
  templateUrl: './drusers-component.html',
  styleUrl: './drusers-component.css',
})
export class DRUsersComponent {
  @Input() selectedUsers: any[] = [];
  @Output() usersChanged = new EventEmitter<any[]>();
  @Input() documentTypeCode: string = '';

  // Sentinel Role dropdown value meaning "every role" -- distinct from any real role id (those
  // are backend ints), so it's safe to store alongside them in the same dropdown/rule shape.
  readonly ALL_ROLES_ID = 'ALL';

  gridConfig: GridConfig = {} as GridConfig;
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'requestdocumentcreation';

  manualUserData: any[] = [];
  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  userRoles: any[] = [];
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
        dropdownOptions: this.userRoles,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        placeholder: 'Please select any',
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
      enablePagination: true,
      pageSize: 10,
      pageSizeOptions: [10, 20, 50, 100],
      enableSorting: true,
      enableFiltering: true,
      enableSelection: true,
      enableInlineAdd: this.canAdd,
      enableInlineEdit: this.canEdit,
      enableInlineDelete: this.canDelete,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };
  }

  private getColumns(): GridColumn[] {
    return [
      ...this.cabinetGridService.buildCabinetColumns(this.cabinetHierarchy),
      ...this.getRemainingColumns(),
    ];
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
    // we look up the actual Role ID from the userRoles list.
    const selectedRole = this.userRoles.find(
      (r) => r.id == rowData.userId || r.text == rowData.userId,
    );
    const roleId = selectedRole ? selectedRole.id : rowData.userId;

    if (roleId === this.ALL_ROLES_ID) {
      // "Users in Role" doesn't make sense for the aggregate ALL row -- each employee under it
      // keeps their own real role, so fine-tuning has to happen per specific role (add that
      // role as its own row) rather than in one combined picker for "every role".
      this._notificationToastService.createNotification(
        'info',
        'ALL Roles',
        'To fine-tune individual employees, add that specific Role as its own row instead of ALL.',
      );
      return;
    }

    const rule = {
      roleId,
      divisionCode: rowData.level1Id || rowData.divisionCode || null,
      departmentCode: rowData.level2Id || rowData.departmentCode || null,
      subDepartmentCode: rowData.level3Id || rowData.subDepartmentCode || null,
      businessDomainCode: rowData.level4Id || rowData.businessDomainCode || null,
    };

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
        divisionCode: rowData.level1Id || rowData.divisionCode,
        departmentCode: rowData.level2Id || rowData.departmentCode,
        subDepartmentCode: rowData.level3Id || rowData.subDepartmentCode,
        businessDomainCode: rowData.level4Id || rowData.businessDomainCode,
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

    // An "ALL" row's rule matches every employee in this cabinet scope regardless of their
    // individual (real) role -- each employee added via ALL still carries their own actual
    // roleId (needed for a valid DocumentRequestUserDistribution row), not the 'ALL' sentinel,
    // so this can't be a plain roleId equality check the way single-role rows are. This also
    // means deleting an ALL row removes everyone in scope, and adding ALL after a specific
    // single-role row was already added for the same scope correctly recognizes those
    // employees as already present instead of duplicating them.
    if (rule.roleId === this.ALL_ROLES_ID) {
      return roleId != null && roleId !== this.ALL_ROLES_ID;
    }

    return roleId === rule.roleId;
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
    const rule = {
      roleId,
      divisionCode: rowData.level1Id || rowData.divisionCode || null,
      departmentCode: rowData.level2Id || rowData.departmentCode || null,
      subDepartmentCode: rowData.level3Id || rowData.subDepartmentCode || null,
      businessDomainCode: rowData.level4Id || rowData.businessDomainCode || null,
    };

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

    this._peoplePartnerService.getUserByRoleId(roleId, payload).subscribe({
      next: (res) => {
        const data = res?.Data;
        const users = (Array.isArray(data) ? data : data?.Items || []).filter(
          (u: any) => u != null,
        );

        const mappedUsers = users.map((u: any) => ({
          ...u, // Preserves raw backend properties like 'empid' for the parent to use
          employeeCode: u.empcode || u.EmployeeCode || u.employeeCode,
          employeeName: u.firstname
            ? `${u.firstname} ${u.midname || ''} ${u.lastname || ''}`.trim().replace(/\s+/g, ' ')
            : u.EmployeeName || u.employeeName || u.UserName || u.userName,
          designation:
            u.Designation || u.designation || u.DesignationName || (u.dsgid ? String(u.dsgid) : ''),
          role: this.getDisplayName(this.userRoles, roleId),
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

  // Same idea as autoSelectEmployeesForRow, but for the "ALL" pseudo-role: fetches every real
  // role's employees for this cabinet scope (one call per role, in parallel) and adds them all.
  // Each employee keeps their own real roleId (not the 'ALL' sentinel) since that's what
  // actually gets persisted as DocumentRequestUserDistribution.RoleId -- 'ALL' only exists as a
  // UI shorthand for "every role", never as data sent to the backend.
  private autoSelectEmployeesForAllRoles(rowData: any): void {
    const rule = {
      roleId: this.ALL_ROLES_ID,
      divisionCode: rowData.level1Id || rowData.divisionCode || null,
      departmentCode: rowData.level2Id || rowData.departmentCode || null,
      subDepartmentCode: rowData.level3Id || rowData.subDepartmentCode || null,
      businessDomainCode: rowData.level4Id || rowData.businessDomainCode || null,
    };

    const realRoles = this.userRoles.filter((r) => r.id !== this.ALL_ROLES_ID);
    if (realRoles.length === 0) {
      this.updateSelectionStatus(rowData, rule, 0);
      return;
    }

    const payloadFor = () => ({
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
    });

    const requestsPerRole = realRoles.map((role) =>
      this._peoplePartnerService.getUserByRoleId(role.id, payloadFor()).pipe(
        map((res) => ({ roleId: role.id, res })),
        // One role's lookup failing shouldn't sink the whole ALL-roles add -- treat it as
        // "no employees found for that role" rather than failing every other role too.
        catchError(() => of({ roleId: role.id, res: null })),
      ),
    );

    forkJoin(requestsPerRole).subscribe((results) => {
      let totalFetched = 0;

      for (const { roleId, res } of results) {
        const data = res?.Data;
        const users = (Array.isArray(data) ? data : data?.Items || []).filter(
          (u: any) => u != null,
        );
        totalFetched += users.length;

        const mappedUsers = users.map((u: any) => ({
          ...u,
          employeeCode: u.empcode || u.EmployeeCode || u.employeeCode,
          employeeName: u.firstname
            ? `${u.firstname} ${u.midname || ''} ${u.lastname || ''}`.trim().replace(/\s+/g, ' ')
            : u.EmployeeName || u.employeeName || u.UserName || u.userName,
          designation:
            u.Designation || u.designation || u.DesignationName || (u.dsgid ? String(u.dsgid) : ''),
          role: this.getDisplayName(this.userRoles, roleId),
          roleId,
          divisionCode: rule.divisionCode,
          departmentCode: rule.departmentCode,
          subDepartmentCode: rule.subDepartmentCode,
          businessDomainCode: rule.businessDomainCode,
        }));

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
      }

      this.updateSelectionStatus(rowData, rule, totalFetched);
      this.usersChanged.emit(this.selectedEmployeeList);
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
            level1Id: rule.divisionCode,
            level2Id: rule.departmentCode,
            level3Id: rule.subDepartmentCode,
            level4Id: rule.businessDomainCode,
            userId: this.getDisplayName(this.userRoles, roleId),
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

    this._peoplePartnerService.getUserByRoleId(rule.roleId, payload).subscribe({
      next: (res) => {
        const data = res?.Data;
        const users = (Array.isArray(data) ? data : data?.Items || []).filter(
          (u: any) => u != null,
        );
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
      userId: this.getDisplayName(this.userRoles, rowData.userId),
      employeeSelectionStatus: 'Loading...',
    };

    this.manualUserData = [rowWithId, ...this.manualUserData];

    // rowData.userId is still the raw role ID at this point (rowWithId.userId above has
    // already been swapped for the display text).
    const selectedRole = this.userRoles.find(
      (r) => r.id == rowData.userId || r.text == rowData.userId,
    );
    const roleId = selectedRole ? selectedRole.id : rowData.userId;

    if (roleId === this.ALL_ROLES_ID) {
      this.autoSelectEmployeesForAllRoles(rowWithId);
    } else {
      this.autoSelectEmployeesForRow(rowWithId, roleId);
    }
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    //console.log('Row updated:', event);
    // debugger;
    const payLoad = {
      divisionCode: event.rowData.level1Id || event.rowData.level1Id,
      departmentCode: event.rowData.level2Id || event.rowData.level2Id,
      subDepartmentCode: event.rowData.level3Id || event.rowData.level3Id,
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

    // Find the actual role ID from the userRoles list
    const role = this.userRoles.find(r => r.id === deletedRow.userId || r.text === deletedRow.userId);
    const roleId = role ? role.id : null;

    if (!roleId) return;

    const rule = {
      roleId,
      divisionCode: deletedRow.level1Id || null,
      departmentCode: deletedRow.level2Id || null,
      subDepartmentCode: deletedRow.level3Id || null,
      businessDomainCode: deletedRow.level4Id || null,
    };

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
      hierarchy: this._cabinetHirarchyService.loadDropdownHierarchy(),
    }).subscribe(({ userRoles, hierarchy }) => {
      // ✅ Normalize Roles -- "ALL" first so it reads as the deliberate bulk-add option, not
      // just another role in the list.
      this.userRoles = [
        { id: this.ALL_ROLES_ID, text: 'ALL', rawName: ' ' },
        ...(userRoles?.Data?.map((d: any) => ({
          id: d.Id,
          text: d.Value,
        })) ?? []),
      ];

      // ✅ Cabinet hierarchy
      this.cabinetHierarchy = hierarchy;

      // ✅ Load hierarchy dropdown data
      this.cabinetGridService.loadDropdownData(hierarchy).subscribe(() => {
        this.buildGrid();
        // Rebuilds the "Document Users" grid rows from selectedUsers now that userRoles/
        // cabinet dropdown options (needed to resolve display text) are actually loaded.
        this.reconstructManualUserData();
        this.loading = false;
      });
    });
  }

  GetAllUserRoles = () => {
    this._peoplePartnerService.GetAllRoles().subscribe((res) => {
      const roles = (res?.Data ?? []).map((d: any) => ({
        id: d.Id,
        text: d.Value,
      }));
      this.userRoles = [{ id: this.ALL_ROLES_ID, text: 'ALL', rawName: ' ' }, ...roles];
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
