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
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDrag,
  CdkDropList,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { ManageWorkflowPolicyModal } from '../manage-workflow-policy-modal/manage-workflow-policy-modal';
import { WorkflowPolicyService } from '@app/shared/services/workflow-policy-service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

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
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    ManageWorkflowPolicyModal,
    NzModalModule,
  ],
  templateUrl: './approval-workflow-policy-management.html',
  styleUrl: './approval-workflow-policy-management.css',
  styles: [
    `
      [nz-button] {
        margin-right: 8px;
        margin-bottom: 12px;
      }
      .cdk-drag-preview {
        box-sizing: border-box;
        border-radius: 4px;
        background-color: white;
        display: table;
        box-shadow:
          0 5px 5px -3px rgba(0, 0, 0, 0.2),
          0 8px 10px 1px rgba(0, 0, 0, 0.14),
          0 3px 14px 2px rgba(0, 0, 0, 0.12);
      }
      .cdk-drag-placeholder {
        opacity: 0;
      }
      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
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
  selectedWorkflowPolicy: string | null = null;
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
  workflowPolicies: any[] = [];
  workflowPoliciesData: any[] = [];

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
    private modal: NzModalService,
    private _workflowPolicyService: WorkflowPolicyService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      this.GetWorkflowPoliciesByEntity();
    });
  }

  onAuthorityTypeChange(value: number | null): void {
    this.emptyInnerFields();
    this.selectedAuthorityType = value; 
    if (value == 2) {
      this.getAllUsersList();
    }
    if (value == 3) {
      this.getAllRoles();
    }
    if (value == 4) {
      this.getAllDesignationList();
    }
  }

  onWorkflowExcludeChange(value: number | null): void {
    this.selectedWorkflowExclude = value;
    if (value == 1) {
      this.getAllDesignationList();
    }
    if (value == 2) {
      this.getAllRoles();
    }
    if (value == 3) {
      this.getAllUsersList();
    }
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

  openManagePolicyModal() {
    const entityTypeStr =
      this.selectedPolicyId == PolicyId.RequestForDocumentCreation
        ? 'Request'
        : this.selectedPolicyId == PolicyId.DocumentCreation
          ? 'Document'
          : 'Revision';

    const modalRef = this.modal.create({
      nzTitle: `Manage Policy (${entityTypeStr})`,
      nzContent: ManageWorkflowPolicyModal,
      nzData: {
        entityType: entityTypeStr,
      },
      nzFooter: null,
      nzWidth: 1200,
    });
    modalRef.afterClose.subscribe((result) => {
      // console.log('Modal closed with:', result);
      this.GetWorkflowPoliciesByEntity();
    });
  }

  addExclusion() {
    // if (!this.approvalPolicy) {
    //   this._notificationToastService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select an approval policy.',
    //   );
    //   return;
    // }

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

          this._notificationToastService.createNotification(
            'success',
            'Workflow',
            response.Message,
          );
        }
      },
      error: (err) => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to create workflow step.',
        );
      },
    });
  }

  selectTab(policyId: any) {
    // 1. Update the selected tab
    this.selectedPolicyId = policyId;

    this.resetAllFields();
    this.GetWorkflowPoliciesByEntity();
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
    this.selectedWorkflowPolicy = null;

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
      if (!Array.isArray(this.selectedEmployee)) {
        return [this.selectedEmployee as any];
      }

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
      if (!Array.isArray(this.selectedDesignation)) {
        return [this.selectedDesignation as any];
      }

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
      if (!Array.isArray(this.selectedRole)) {
        return [this.selectedRole as any];
      }

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
    this.selectedDocumentType = value || '';
    this.fetchApprovalSequence();
  }

  onWorkflowPolicyChange(value: string): void {
    if (value != null) {
      this.selectedWorkflowPolicy = value;

      // Auto-fill cabinet structure based on selected policy
      const policyDetails = this.workflowPoliciesData.find((p) => String(p.Id) === String(value));
      if (policyDetails) {
        this.selectedDocumentType = policyDetails.documentTypeId || '';
        this.selectedDivisions = policyDetails.level1Id || '';
        this.selectedDepartment = policyDetails.level2Id || '';
        this.selectedSubDepartment = policyDetails.level3Id || '';
        this.selectedBusinessDomain = policyDetails.level4Id || '';
      }

      this.fetchApprovalSequence();
    } else {
      this.selectedWorkflowPolicy = '';
      this.selectedDocumentType = '';
      this.selectedDivisions = '';
      this.selectedDepartment = '';
      this.selectedSubDepartment = '';
      this.selectedBusinessDomain = '';
      this.approvalSequenceData = [];
      this.showExclusionTable = false;
    }
  }

  fetchApprovalSequence() {
    if (!this.selectedWorkflowPolicy) {
      this.approvalSequenceData = [];
      this.showExclusionTable = false;
      return;
    }

    const payLoad = {
      EntityType:
        this.selectedPolicyId == PolicyId.RequestForDocumentCreation
          ? 'Request'
          : this.selectedPolicyId == PolicyId.DocumentCreation
            ? 'Document'
            : 'Revision',
      documentTypeCode: this.selectedDocumentType,
      divisionCode: this.selectedDivisions || '',
      departmentCode: this.selectedDepartment || '',
      subDepartmentCode: this.selectedSubDepartment || '',
      businessDomainCode: this.selectedBusinessDomain || '',
    };

    this._workflowStepService.getWorkflowStepByDocumentTypeCode(payLoad).subscribe((res) => {
      this.showExclusionTable = true;
      this.approvalSequenceData = res?.Data ? res.Data : [];
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.approvalSequenceData, event.previousIndex, event.currentIndex);
      this.saveUpdatedSequence();
    }
  }

  removeSequenceItem(index: number) {
    const policyIdToFallback = this.approvalSequenceData[index]?.WorkflowPolicyId;
    this.approvalSequenceData.splice(index, 1);
    this.saveUpdatedSequence(policyIdToFallback);
  }

  saveUpdatedSequence(fallbackPolicyId?: number) {
    // Re-assign step order based on new array indices
    this.approvalSequenceData.forEach((item, index) => {
      item.StepOrder = index + 1;
    });

    const workflowPolicyId =
      this.approvalSequenceData.length > 0
        ? this.approvalSequenceData[0].WorkflowPolicyId
        : fallbackPolicyId || 0;

    const payLoad = {
      workflowpolicyid: workflowPolicyId,
      steps: this.approvalSequenceData.map((item) => ({
        steporder: item.StepOrder,
        stepgroup: item.StepGroup || 0,
        steptype: item.StepType || '',
        roleid: item.RoleId || 0,
        designationid: item.DesignationId || 0,
        userid: item.EmployeeCode || item.UserId?.toString() || '',
        requiresallapprovals: item.RequiresAllApprovals || false,
      })),
    };

    // Note: Assuming your WorkflowStepService has an `updateSequence` method.
    // Adjust the method name below as needed to match your service's actual implementation.
    this._workflowStepService.updateApprovalSequence(payLoad).subscribe({
      next: (response: any) => {
        if (response?.Success) {
          this.approvalSequenceData = response.Data || [];
          this._notificationToastService.createNotification(
            'success',
            'Workflow',
            'Approval sequence updated successfully.',
          );
        }
      },
      error: (err: any) => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to update approval sequence.',
        );
      },
    });
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
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? '';
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? '';
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? '';
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? '';
    this.fetchApprovalSequence();
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
          NAME: "(" + d.Code + ") " +  d.Value
        }));
      } else {
        this.employees = [];
      }
    });
  };

  GetWorkflowPoliciesByEntity = () => {
    const entityTypeStr =
      this.selectedPolicyId == PolicyId.RequestForDocumentCreation
        ? 'Request'
        : this.selectedPolicyId == PolicyId.DocumentCreation
          ? 'Document'
          : 'Revision';

    this._workflowPolicyService
      .GetAllWorkflowPolicies('', 'ASC', '', true, 1, 10000, entityTypeStr)
      .subscribe((res) => {
        const data = res?.Data;
        const items = data?.Items || (Array.isArray(data) ? data : []);

        if (Array.isArray(items)) {
          this.workflowPoliciesData = items.map((item: any) => ({
            Id: item.Id,
            policyName: item.Name,
            documentTypeId: item.DocumentTypeCode,
            documentTypeName: item.DocumentType,
            level1Id: item.DivisionCode,
            divisionName: item.Division,
            level2Id: item.DepartmentCode,
            departmentName: item.Department,
            level3Id: item.SubDepartmentCode,
            subDepartmentName: item.SubDepartment,
            level4Id: item.BusinessDomainCode,
            businessDomainName: item.BusinessDomain,
            IsActive: item.IsActive,
            IsDeleted: item.IsDeleted,
            CreatedAt: new CustomDateFormatPipe().transform(item.CreatedAt || ''),
            CreatedBy: item.CreatedBy,
            LastModifiedAt: new CustomDateFormatPipe().transform(item.LastModifiedAt || ''),
            LastModifiedBy: item.LastModifiedBy,
          }));

          // Map workflow policies for dropdown
          this.workflowPolicies = items.map((d: any) => ({
            CODE: d.Id,
            NAME: d.Name,
          }));
        } else {
          this.workflowPoliciesData = [];
          this.workflowPolicies = [];
        }
      });
    // this._workflowPolicyService.GetWorkflowPoliciesByEntityType(entityTypeStr).subscribe((res) => {
    //   if (res?.Data) {
    //     this.workflowPolicies = (res.Data ?? []).map((d: any) => ({
    //       CODE: d.Id,
    //       NAME: d.Value,
    //     }));
    //   } else {
    //     this.workflowPolicies = [];
    //   }
    //   //this.cdr.detectChanges(); // force update
    // });
  };
}
