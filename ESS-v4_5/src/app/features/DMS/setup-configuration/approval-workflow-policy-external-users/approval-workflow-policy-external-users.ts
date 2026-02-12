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
import { UserService } from '@app/shared/services/user-service';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DesignationService } from '@app/shared/services/designation.service';
import { RoleService } from '@app/shared/services/role.service';

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
    CabinetStructureList,
  ],
  templateUrl: './approval-workflow-policy-external-users.html',
  styleUrl: './approval-workflow-policy-external-users.css',
})
export class ApprovalWorkflowPolicyExternalUsers {
  radioValue = '';
  showExclusionTable = false;
  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';
  selectedDesignation?: string = '';
  selectedRole?: string = '';
  selectedEmployee?: string = '';

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
  roles: any[] = [];

  workflowExclude: SelectList[] = [
    { CODE: '1', NAME: 'Designation' },
    { CODE: '2', NAME: 'Role' },
    { CODE: '3', NAME: 'Specific Employee' },
  ];

  selectedAuthorityType: number | null = null;

  constructor(
    private _userService: UserService,
    private _designationServices: DesignationService,
    private _roleService: RoleService,
  ) {}

  ngOnInit() {
    //this.loadData(this.pageSize);
    this.getAllUsersList();
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

  selectedWorkflowExclude: number | null = null;
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
  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;
  }

  onDesignationChange(value: string): void {
    this.selectedDesignation = value;
  }

  addExclusion() {
    this.showExclusionTable = this.showExclusionTable == true ? false : true;
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

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }
}
