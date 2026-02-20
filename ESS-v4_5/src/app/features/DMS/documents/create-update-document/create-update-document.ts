import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, DocumentAttribute, SelectList } from '@app/shared/interfaces/interfaces';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { DivisionService } from '@app/shared/services/division.services';
import { DepartmentService } from '@app/shared/services/department.service';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { CompanyList } from '@app/shared/Dropdowns/company-list/company-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { MyPendingRequestForApproval } from '../my-approval-request/my-pending-request-for-approval/my-pending-request-for-approval';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { DynamicFormByDocumentAttribute } from '@app/shared/dynamic-forms/dynamic-form-by-document-attribute/dynamic-form-by-document-attribute';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';

@Component({
  selector: 'app-create-update-document',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    AgGridWrapper,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    NzDatePickerModule,
    DocumentTypeList,
    CompanyList,
    DMSRichTextEdit,
    MyPendingRequestForApproval,
    CabinetStructureList,
    ReactiveFormsModule,
    DynamicFormByDocumentAttribute,
  ],
  templateUrl: './create-update-document.html',
  styleUrl: './create-update-document.css',
  styles: [
    `
      nz-date-picker,
      nz-range-picker {
        margin: 0 8px 12px 0;
      }
    `,
  ],
})
export class CreateUpdateDocument {
  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';

  plainFooter = 'plain extra footer';
  footerRender = (): string => 'extra footer';
  showExclusionTable = false;
  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';
  selectedTrainingMode?: string = '';
  selectedCompany?: string = '';
  selectedRequestId: string = '';
  templateHtml: string = '';
  trainingContent: boolean = false;

  selectedRequestType: string = '';

  approvalSequenceData: any[] = [];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: true,
  };

  pageSize = 10;
  totalRows = 0;
  rowData: any[] = [];
  totalWorkflowAuthorities = 0;
  totalDistribution = 0;
  totalDocuments = 0;

  public noRowsOverlay: string = '';

  attributes: DocumentAttribute[] = [];
  dynamicForm!: FormGroup;

  distributionListGridColumnDefs = [
    {
      field: 'division',
      headerName: 'Division',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing Division', 'Software Division'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['HR', 'IT', 'Finance', 'Legal'],
      },
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          'Territory Sales Manager(TSM)',
          'District Sales Manager(DSM)',
          'Regional Sales Manager(RSM)',
        ],
      },
    },
    {
      field: 'distributionType',
      headerName: 'Distribution Type',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Physical', 'Digital'],
      },
    },
  ];

  workflowAuthoritiesColumnDefs = [
    // { field: 'approvalSequence', headerName: 'Approval Sequence', flex: 1 },
    // { field: 'employeeCode', headerName: 'Employee Code', flex: 1 },
    // { field: 'employeeName', headerName: 'Employee Name', flex: 1 },
    // { field: 'division', headerName: 'Division', flex: 1 },
    // { field: 'department', headerName: 'Department', flex: 1 },
    // { field: 'subDepartment', headerName: 'Sub-Department', flex: 1 },

    { field: 'sequence', headerName: 'Approval Sequence', flex: 1 },
    { field: 'employeeCode', headerName: 'Employee Code', flex: 1 },
    { field: 'employeeName', headerName: 'Employee Name', flex: 1 },
    { field: 'designation', headerName: 'Designation', flex: 1 },
    { field: 'Department', headerName: 'Department', flex: 1 },
    { field: 'SubDepartment', headerName: 'Sub-Department', flex: 1 },
  ];

  workflowAuthoritiesData: any[] = [
    {
      approvalSequence: 1,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
    {
      approvalSequence: 2,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
    {
      approvalSequence: 3,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
  ];

  trainers: SelectList[] = [];

  users: SelectList[] = [
    { CODE: '1', NAME: 'Digital Marketing' },
    { CODE: '2', NAME: 'Software Marketing' },
  ];

  requestTypes: SelectList[] = [
    { CODE: '1', NAME: 'Creation of new document' },
    { CODE: '2', NAME: 'Revision of existing document' },
    { CODE: '3', NAME: 'Obsoletion of existing document' },
  ];

  constructor(
    private _documentAttributeService: DocumentAttributeService,
    private _workflowStepService: WorkflowStepService,
  ) {}

  ngOnInit() {
    //this.getAllDivisions();
  }

  onAuthorityTypeChange(value: string): void {
    this.selectedRequestType = value;
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

  onCompanyChange(value: string): void {
    this.selectedCompany = value;
  }

  onDocumentTypeChange(value: string): void {
    this.selectedDocumentType = value;

    if (value === 'Select') {
      this.trainingContent = true;
    }
    //Get the Document Type's template
    this.GetTemplate(value);

    const payLoad = {
      companyId: MASTER_DEFAULT_KEYS.COMPANYID,
      EntityType: 'Request',
      documentTypeCode: this.selectedDocumentType,
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
    };
    
    this._workflowStepService
      .getWorkflowStepByDocumentTypeCode(
        payLoad,
        // value,
        // this.selectedRequestType === '1' ? 1 : this.selectedRequestType === '2' ? 2 : 3,
      )
      .subscribe((res) => {
        // console.log('User Details:', res);
        this.showExclusionTable = true;
        // this.totalDistribution = res?.Data ? res.Data.length : 0;
        this.approvalSequenceData = res?.Data ? res.Data : [];
      });
  }

  GetTemplate(value: string) {
    this._documentAttributeService.getDocumentAttributeByDocumentType(value).subscribe((res) => {
      if (res) {
        if (!res?.Data) return;

        this.attributes = res.Data;
      } else {
        this.requestTypes = [];
      }
    });
  }
  onRequestIdChange(value: string): void {
    // this.loading = true;
    this.selectedRequestId = value;
  }

  onTrainingModeChange(value: string): void {
    // this.loading = true;
    this.selectedTrainingMode = value;
  }
  GetAllWorkflowAuthorities(query: any) {}

  GetAllDistribution(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'distributionListGrid':
        this.divisionPageSize = pageSize;
        this.GetAllDistribution({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'document2Grid':
        this.employeePageSize = pageSize;
        this.GetAllDistribution({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'documentGrid':
        this.employeePageSize = pageSize;
        this.GetAllDistribution({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'userListGrid':
        this.employeePageSize = pageSize;
        this.GetAllDistribution({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      // handle other grids...

      default:
        break;
    }
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  submitDynamicForm() {
    debugger;
    if (!this.dynamicForm) return;

    if (this.dynamicForm.invalid) {
      this.dynamicForm.markAllAsTouched();
      return;
    }
    const payload = this.buildPayload();

    console.log(this.dynamicForm.value);
  }

  buildPayload() {
    return this.attributes.map((attr) => ({
      attributeId: attr.Id,

      controlLabel: attr.ControlLabel,

      value: this.dynamicForm.get('ctrl_' + attr.Id)?.value,
    }));
  }
}
