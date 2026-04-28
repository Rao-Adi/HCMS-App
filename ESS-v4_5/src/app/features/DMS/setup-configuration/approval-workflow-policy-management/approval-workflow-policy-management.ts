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
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { EmployeeList } from '@app/shared/Dropdowns/employee-list/employee-list';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { PermissionService } from '@app/shared/services/permission.service';

export enum ApprovalPolicy {
  ObserveOnly = 'OBSERVE_ONLY',
  CanEdit = 'CAN_EDIT',
  // CrossFunctional = 'CROSS_FUNCTIONAL',
  // ParallelApproval = 'PARALLEL',
}

export enum PolicyId {
  RequestForDocumentCreation = 1,
  DocumentCreation = 2,
  DocumentRevisionObsoletion = 3,
}

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
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'approvalworkflow';

  selectedTab: string = 'RequestForDocumentCreation';
  switchValue1 = false;
  loading = false;
  showExclusionTable = false;
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  approvalSequenceData: any[] = [];
  selectedUser?: string;
  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedBusinessDomain: string = '';
  selectedDocumentType?: string = '';
  selectedDesignation?: string[] = [];
  selectedRole?: string[] = [];
  selectedEmployee?: string[] = [];
  radioValue = '';

  selectedAuthorityType: number | null = null;
  selectedWorkflowExclude: number | null = null;

  approvalPolicy: ApprovalPolicy | null = null;
  PolicyId = PolicyId; // 👈 REQUIRED
  selectedPolicyId: PolicyId = PolicyId.RequestForDocumentCreation;

  selectedEmployeeSingle: any = null; // For single select
  selectedDesignationSingle: any = null; // For single select
  selectedRoleSingle: any = null; // For single select
  // single state
  activeMode: 'manual' | 'integration' | null = null;

  designations: any[] = [];
  userRoles: any[] = [];
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
    private _permissionService: PermissionService,
    private _workflowStepService: WorkflowStepService,
    private _notificationToastService: NotificationToastService,
    private _peoplePartnerService: PeoplePartnersService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });
  }

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
    //reset preselected values
    if (value == 2) {
      //this.getAllUsersList();
    }
    if (value == 3) {
      //this.getAllRoles();
    }
    if (value == 4) {
      //this.getAllDesignationList();
    }
    this.selectedUser = '';
    this.selectedDesignationSingle = null;
    this.selectedRoleSingle = null;
    this.selectedWorkflowExclude = 0;
  }

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

  clickSwitch(): void {
    if (this.loading) return;

    this.switchValue1 = this.switchValue1 == true ? false : true;
  }

  addExclusion() { 
    if (!this.approvalPolicy) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select an approval policy.',
      );
      return;
    }

    this.showExclusionTable = this.showExclusionTable == true ? false : true;

    const payLoad = {
      EntityType:
        this.selectedPolicyId == PolicyId.RequestForDocumentCreation
          ? 'Request'
          : this.selectedPolicyId == PolicyId.DocumentCreation
            ? 'Document'
            : 'Revision',
      StepType: 'Review', //
      documentTypeCode: this.selectedDocumentType,
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      designationCodes: this.getDesignationCodes(),
      roles: this.getRoleCodes(),
      employeeCodes: this.getEmployeeCodes(),
      CanEdit: this.approvalPolicy === ApprovalPolicy.CanEdit,
      RequireCrossFunctionalHead: false,
      IsParallelApproval: this.switchValue1,
    };

    this._workflowStepService.create(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this.showExclusionTable = true;
          this.approvalSequenceData = [...response.Data];

          this._notificationToastService.createNotification('success', 'Workflow', response.Message);
        }
      },
      error: (err) => {
        this._notificationToastService.createNotification('error', 'Error', 'Failed to create workflow step.');
      },
    });
  }

  selectTab(policyId: any) {
    // 1. Update the selected tab
    this.selectedPolicyId = policyId;

    this.resetAllFields();
  }

  resetAllFields() {
    this.emptyInnerFields();
  }

  emptyInnerFields() {
    this.approvalSequenceData = [];
    this.showExclusionTable = false;
    this.selectedAuthorityType = null;
    this.selectedWorkflowExclude = null;
    this.approvalPolicy = null;
    this.selectedEmployeeSingle = null;
    this.selectedDesignationSingle = null;
    this.selectedRoleSingle = null;
    this.selectedDesignation = [];
    this.selectedRole = [];
    this.selectedEmployee = [];
    this.selectedUser = '';
    this.radioValue = '';
    this.activeMode = null;

    //Cabinet Fields
    this.selectedDivisions = '';
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.selectedBusinessDomain = '';
    this.selectedDocumentType = '';
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
    this.emptyInnerFields();
    if (value != null) {
      this.selectedDocumentType = value;

      const payLoad = {
        EntityType:
          this.selectedPolicyId == PolicyId.RequestForDocumentCreation
            ? 'Request'
            : this.selectedPolicyId == PolicyId.DocumentCreation
              ? 'Document'
              : 'Revision',
        documentTypeCode: this.selectedDocumentType,
        divisionCode: this.selectedDivisions,
        departmentCode: this.selectedDepartment,
        subDepartmentCode: this.selectedSubDepartment,
        businessDomainCode: this.selectedBusinessDomain,
      };
      this._workflowStepService.getWorkflowStepByDocumentTypeCode(payLoad).subscribe((res) => {
        // console.log('User Details:', res);
        this.showExclusionTable = true;
        this.approvalSequenceData = res?.Data ? res.Data : [];
      });
    } else {
      this.selectedDocumentType = '';
    }
  }

  // Function to handle the change
  onPolicyChange(value: string, step: any) {
    if (value === 'A') {
      step.CanEdit = false;
    } else if (value === 'B') {
      step.CanEdit = true;
    }
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  getAllDesignationList = () => {
    this._peoplePartnerService.GetAllDesignationList().subscribe((res) => {
      if (res?.Data) {
        this.designations = (res.Data ?? []).map((d: any) => ({
          CODE: d.Id || d.id,
          NAME: d.Value || d.value,
        }));
      } else {
        this.designations = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };

  getAllRoles = () => {
    this._peoplePartnerService.GetAllRoles().subscribe((res) => {
      if (res?.Data) {
        this.userRoles = (res.Data ?? []).map((d: any) => ({
          ID: d.Id,
          NAME: d.Value,
        }));
      } else {
        this.userRoles = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };

  getAllUsersList = () => {
    this._peoplePartnerService.GetEmployeeList().subscribe((res) => {
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
