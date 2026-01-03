import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { BehaviorSubject } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { DivisionList } from '@app/shared/Dropdowns/division-list/division-list';
import { SubDepartmentList } from '@app/shared/Dropdowns/sub-department-list/sub-department-list';
import { DepartmentList } from '@app/shared/Dropdowns/department-list/department-list';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';

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
    DivisionList,
    SubDepartmentList,
    DepartmentList,
    DocumentTypeList,
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
  selectedDocumentType?: string = '';

  authorityTypes: SelectList[] = [
    { CODE: '1', NAME: 'Reporting to Levels' },
    { CODE: '2', NAME: 'Employee' },
    { CODE: '3', NAME: 'Role' },
    { CODE: '4', NAME: 'Designation' },
    { CODE: '5', NAME: 'Head of Division' },
    { CODE: '6', NAME: 'Head of Department' },
    { CODE: '7', NAME: 'Head of Sub-Department' },
  ];
  employees: SelectList[] = [
    { CODE: '1', NAME: 'John Doe' },
    { CODE: '2', NAME: 'Jane Smith' },
    { CODE: '3', NAME: 'Alice Johnson' },
  ];

  workflowExclude: SelectList[] = [
    { CODE: '1', NAME: 'Designation' },
    { CODE: '2', NAME: 'Role' },
    { CODE: '3', NAME: 'Specific Employee' },
  ];

  selectedAuthorityType: number | null = null;

  constructor() {}

  ngOnInit() {
    //this.loadData(this.pageSize);
  }

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
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

   addExclusion() {
    this.showExclusionTable = this.showExclusionTable == true ? false : true;
  }

}
