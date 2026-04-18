import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, SelectList } from '@app/shared/interfaces/interfaces';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DesignationList } from '@app/shared/Dropdowns/designation-list/designation-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DesignationService } from '@app/shared/services/designation.service';
import { RoleService } from '@app/shared/services/role.service';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { NotificationService } from '@app/shared/notification/notification.service';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { RoleList } from '@app/shared/Dropdowns/role-list/role-list';
import { EmployeeList } from '@app/shared/Dropdowns/employee-list/employee-list';

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
  RequestForDocumentSharingToExternalUsers = 4,
}

@Component({
  selector: 'app-approval-workflow-policy-external-users',
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
  templateUrl: './approval-workflow-policy-external-users.html',
  styleUrl: './approval-workflow-policy-external-users.css',
  styles: [
    `
      [nz-button] {
        margin-right: 8px;
        margin-bottom: 12px;
      }
    `,
  ],
})
export class ApprovalWorkflowPolicyExternalUsers {
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'workflowdocument';

  radioValue = '';
  showExclusionTable = false;
  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedBusinessDomain: string = '';
  selectedDocumentType?: string = '';

  selectedDesignation?: string[] = [];
  selectedRole?: string[] = [];
  selectedEmployee?: string[] = [];
  selectedEmployeeSingle: any = null; // For single select
  selectedDesignationSingle: any = null; // For single select
  selectedRoleSingle: any = null; // For single select

  approvalPolicy: ApprovalPolicy | null = null;
  PolicyId = PolicyId; // 👈 REQUIRED
  selectedPolicyId: PolicyId = PolicyId.RequestForDocumentSharingToExternalUsers;

  authorityTypes: SelectList[] = [
    { CODE: '1', NAME: 'Reporting to Levels' },
    { CODE: '2', NAME: 'Employee' },
    { CODE: '3', NAME: 'Role' },
    { CODE: '4', NAME: 'Designation' },
    { CODE: '5', NAME: 'Head of Division' },
    { CODE: '6', NAME: 'Head of Department' },
    { CODE: '7', NAME: 'Head of Sub-Department' },
  ];
  employees: any[] = [];
  designations: any[] = [];
  userRoles: any[] = [];
  approvalSequenceData: any[] = [];

  workflowExclude: SelectList[] = [
    { CODE: '1', NAME: 'Designation' },
    { CODE: '2', NAME: 'Role' },
    { CODE: '3', NAME: 'Specific Employee' },
  ];

  selectedAuthorityType: number | null = null;
  selectedWorkflowExclude: number | null = null;

  constructor(
    private _permissionService: PermissionService,
    private _notification: NotificationService,
    private _designationServices: DesignationService,
    private _roleService: RoleService,
    private _workflowStepService: WorkflowStepService,
    private _peoplePartnerService: PeoplePartnersService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      //this.loadData(this.pageSize);
      this.getAllUsersList();
    });
  }

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
    if (value == 2) {
      this.getAllUsersList();
    }
    if (value == 3) {
      this.getAllRoles();
    }
    if (value == 4) {
      this.getAllDesignations();
    }
  }

  onWorkflowExcludeChange(value: number | null): void {
    this.selectedWorkflowExclude = value;
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

  onDesignationChange(value: string): void {
    //this.selectedDesignation = value;
  }

  onRoleChange(value: string): void {
    //this.selectedRole = value;
  }
  onEmployeeChange(value: string): void {
    //this.selectedEmployee = value;
  }

  onDocumentTypeChange(value: string): void {
    if (value != null) {
      this.selectedDocumentType = value;
      const payLoad = {
        EntityType: 'Request',
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
      this.approvalSequenceData = [];
      this.selectedDocumentType = '';
      this.showExclusionTable = false;
    }
  }

  addExclusion() {
    debugger;
    this.showExclusionTable = this.showExclusionTable == true ? false : true;
    if (!this.approvalPolicy) {
      this._notification.createNotification(
        'warning',
        'Validation',
        'Please select an approval policy.',
      );
      return;
    }

    const payLoad = {
      WorkflowPolicyId: 4, // Approval Workflow Policy – for sharing Documents to External Users
      EntityType: 'REQUEST_FOR_DOCUMENT_SHARING_TO_EXTERNAL_USERS',
      StepType: 'Review',
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
      IsParallelApproval: false,
    };

    this._workflowStepService.create(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this.approvalSequenceData = [...response.Data];

          this._notification.createNotification('success', 'Workflow', response.Message);
        }
      },
      error: (err) => {
        this._notification.createNotification('error', 'Error', 'Failed to create workflow step.');
      },
    });
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
    this.radioValue = '';

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
    this._peoplePartnerService.GetAllRoles().subscribe((res) => {
      if (res) {
        this.userRoles = (res.Data ?? []).map((d: any) => ({
          id: d.Id,
          text: d.Value,
        }));
      } else {
        this.userRoles = [];
      }
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

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }
}
