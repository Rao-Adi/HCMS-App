import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { BehaviorSubject } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, SelectList } from '@app/shared/interfaces/interfaces';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DesignationList } from '@app/shared/Dropdowns/designation-list/designation-list';
import { RoleList } from '@app/shared/Dropdowns/role-list/role-list';
import { UserService } from '@app/shared/services/user-service';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { NotificationService } from '@app/shared/notification/notification.service';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { EmployeeList } from '@app/shared/Dropdowns/employee-list/employee-list';
import { DesignationService } from '@app/shared/services/designation.service';
import { RoleService } from '@app/shared/services/role.service';

@Component({
  selector: 'app-approval-workflow-policy-management',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    DocumentTypeList,
    DesignationList,
    RoleList,
    EmployeeList,
    CabinetStructureList,
  ],
  templateUrl: './approval-workflow-policy-management.html',
  styleUrl: './approval-workflow-policy-management.css',
  styles: [
    `
      [nz-button] {
        margin-right: 8px;
        margin-bottom: 12px;
      }
    `,
  ],
})
export class ApprovalWorkflowPolicyManagement {
  public noRowsOverlay: string = '';

  selectedTab: string = 'RequestForDocumentCreation';
  switchValue1 = false;
  switchValue2 = false;
  loading = false;
  showExclusionTable = false;
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  approvalSequenceData: any[] = [];
  selectedUser?: string;
  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';
  selectedDesignation?: string[] = [];
  selectedRole?: string[] = [];
  selectedEmployee?: string[] = [];
  radioValue = '';
 
  selectedEmployeeSingle: any = null; // For single select 
  selectedDesignationSingle: any = null; // For single select
  selectedRoleSingle: any = null; // For single select
  // single state
  activeMode: 'manual' | 'integration' | null = null;

  pageSize = 10;
  rowData: any[] = [];
  totalRows = 0;
  designations: any[] = [];
  roles: any[] = [];
  employees: any[] = [];

  authorityTypes: SelectList[] = [
    { CODE: '1', NAME: 'Reporting to Levels' },
    { CODE: '2', NAME: 'Employee' },
    { CODE: '3', NAME: 'Role' },
    { CODE: '4', NAME: 'Designation' },
    { CODE: '5', NAME: 'Head of Division' },
    { CODE: '6', NAME: 'Head of Department' },
    { CODE: '7', NAME: 'Head of Sub-Department' },
  ];

  workflowExclude: SelectList[] = [
    { CODE: '1', NAME: 'Designation' },
    { CODE: '2', NAME: 'Role' },
    { CODE: '3', NAME: 'Specific Employee' },
  ];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  constructor(
    private _userService: UserService,
    private _workflowStepService: WorkflowStepService,
    private _notification: NotificationService,
    private _designationServices: DesignationService,
    private _roleService: RoleService,
  ) {}

  ngOnInit() {
    this.loadData(this.pageSize);
  }

  onSearch(value: string): void {
    this.loading = true;
    this.searchChange$.next(value);
  }

  selectedAuthorityType: number | null = null;

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
    //reset preselected values
    if (value == 2) {
      this.getAllUsersList();
    }
    if (value == 3) {
      this.getAllRoles();
    }
    if (value == 4) {
      this.getAllDesignations();
    }
    this.selectedUser = '';
    this.selectedDesignationSingle = null;
    this.selectedRoleSingle = null;
    this.selectedWorkflowExclude = 0;
  }

  selectedWorkflowExclude: number | null = null;
  onWorkflowExcludeChange(value: number | null): void {
    this.selectedWorkflowExclude = value;
  }

  onDesignationChange(value: string): void {
    //this.selectedDesignation = value;
  }

  onRoleChange(value: string): void {
    //this.selectedRole = value;
  }
  onEmployeeChange(value: string): void {
    //this.selectedEmployee = value;
  }

  onDivisionChange(value: string): void {
    this.selectedDivisions = value;
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
  }
  onDepartmentsChange(value: string): void {
    this.selectedDepartment = value;
    this.selectedSubDepartment = '';
  }

  clickSwitch(mode: 'manual' | 'integration'): void {
    if (this.loading) return;

    this.loading = true;

    setTimeout(() => {
      this.activeMode = mode;

      // mutually exclusive switches
      this.switchValue1 = mode === 'manual';
      this.switchValue2 = mode === 'integration';

      this.loading = false;
    }, 300); // keep UX fast
  }

  async saveClaim(): Promise<void> {
    return;
  }

  loadData(pageNumber: number) {
    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.rowData = allData.slice(start, end);
    this.totalRows = allData.length;

    // 🔹 REMOVE THIS when backend is ready
    // this.gridService.loadData(this.apiUrl, request).subscribe(...)
  }

  private getDummyData(): any[] {
    return Array.from({ length: 100 }).map((_, i) => ({
      documentId: `DOC-${i + 1}`,
      documentName: `Policy Document ${i + 1}`,
      version: `v${Math.floor(Math.random() * 5) + 1}.0`,
      documentType: ['Policy', 'SOP', 'Manual'][i % 3],
      division: ['North', 'South', 'East', 'West'][i % 4],
      department: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      subDepartment: ['Ops', 'Admin', 'Support'][i % 3],
      nextReviewDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
        .toISOString()
        .split('T')[0],
      uploadDocument: 'Upload',
    }));
  }

  addExclusion() {
    this.showExclusionTable = this.showExclusionTable == true ? false : true;
    debugger;
    const payLoad = {
      companyId: MASTER_DEFAULT_KEYS.COMPANYID, 
      WorkflowPolicyId: 1, // need to get this from somewhere
      documentTypeCode: this.selectedDocumentType,
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      designationCodes: this.getDesignationCodes(),
      roles: this.getRoleCodes(),
      employeeCodes: this.getEmployeeCodes(),
    };

    this._workflowStepService.create(payLoad).subscribe(() => {
        this._notification.createNotification('success', 'User', 'User created successfully!');
      });

    // this._userService.GetUserByFilters(payLoad).subscribe((res) => {
    //   console.log('User Details:', res);
    //   this.approvalSequenceData = res?.Data ? [res.Data] : [];

    //   var workflowPayload = {
    //     CompanyId: MASTER_DEFAULT_KEYS.COMPANYID,
    //     workflowPolicyId: 0,
    //     sequence: 1,
    //     approverRoleId: 0,
    //     approverUserId: res?.Data.Id,
    //     approvalLevel: 0,
    //   };
    //   this._workflowStepService.create(workflowPayload).subscribe(() => {
    //     this._notification.createNotification('success', 'User', 'User created successfully!');
    //   });
    // });
  }

  private getEmployeeCodes(): string[] {
    // If multi-select has value
    if (this.selectedEmployee && this.selectedEmployee.length > 0) {
      // If app-employee-list returns objects
      if (typeof this.selectedEmployee[0] === 'object') {
        return this.selectedEmployee.map((emp: any) => emp.ID);
        // change ID to CODE if needed
      }

      // If it already returns string[]
      return this.selectedEmployee;
    }

    // If single select is used
    if (this.selectedEmployeeSingle) {
      return [this.selectedEmployeeSingle];
    }

    return [];
  }

  private getDesignationCodes(): string[] {
    // If multi-select has value
    if (this.selectedDesignation && this.selectedDesignation.length > 0) {
      // If app-designation-list returns objects
      if (typeof this.selectedDesignation[0] === 'object') {
        return this.selectedDesignation.map((emp: any) => emp.CODE);
        // change ID to CODE if needed
      }

      // If it already returns string[]
      return this.selectedDesignation;
    }

    // If single select is used
    if (this.selectedDesignationSingle) {
      return [this.selectedDesignationSingle];
    }

    return [];
  }

  private getRoleCodes(): string[] {
    // If multi-select has value
    if (this.selectedRole && this.selectedRole.length > 0) {
      // If app-role-list returns objects
      if (typeof this.selectedRole[0] === 'object') {
        return this.selectedRole.map((emp: any) => emp.ID);
        // change ID to CODE if needed
      }

      // If it already returns string[]
      return this.selectedRole;
    }

    // If single select is used
    if (this.selectedRoleSingle) {
      return [this.selectedRoleSingle];
    }

    return [];
  }

  onDocumentTypeChange(value: string): void {
 
    this.selectedDocumentType = value;
    this._workflowStepService.getWorkflowStepByDocumentTypeCode(value).subscribe((res) => {
      console.log('User Details:', res);
      this.showExclusionTable= true;
      this.approvalSequenceData = res?.Data ? res.Data : [];
 
    });
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  getAllDesignations = () => {
    this._designationServices.getDesignationList().subscribe((res) => {
      if (res?.Data) {
        this.designations = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
      } else {
        this.designations = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };

  getAllRoles = () => {
    this._roleService.getRoleList().subscribe((res) => {
      if (res?.Data) {
        this.roles = (res.Data ?? []).map((d: any) => ({
          ID: d.Id,
          NAME: d.Value,
        }));
      } else {
        this.roles = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };

  getAllUsersList = () => {
    this._userService.getUserList().subscribe((res) => {
      if (res?.Data) {
        this.employees = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
      } else {
        this.employees = [];
      }
    });
  };
}
