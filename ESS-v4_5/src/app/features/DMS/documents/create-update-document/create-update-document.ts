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
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { DocumentRequestTypeService } from '@app/shared/services/document-request-type.service';
import { NotificationService } from '@app/shared/notification/notification.service';
import { DocumentService } from '@app/shared/services/document.service';
import { TemplateService } from '@app/shared/services/template.service';

// Define interface for request types
interface RequestType {
  id: string;
  text: string;
}
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
  showTrainingUserTable = false;
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
  documentId: string = '';

  selectedRequestType: string = '';
  cabinetHierarchy: CabinetSelection[] = [];

  approvalSequenceData: any[] = [];
  trainingUsersData: any[] = [];

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

  requestTypes: any[] = [];
  requestIds: any[] = [];
  // Map to store the display values
  requestTypeMap: Map<string, string> = new Map();

  constructor(
    private _documentAttributeService: DocumentAttributeService,
    private _workflowStepService: WorkflowStepService,
    private _notification: NotificationService,
    private _documentRequestTypeService: DocumentRequestTypeService,
    private _documentService: DocumentService,
    private documentTemplateService: TemplateService,
  ) {}

  ngOnInit() {
    // this.getAllDocumentRequestTypes();
    this.loadRequestTypes();
  }

  loadRequestTypes() {
    // Assuming you have a service that fetches this data
    this._documentRequestTypeService.getDocumentTypeList().subscribe((res) => {
      if (res) {
        this.requestTypes = (res.Data ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Value,
        }));

        // Create a map for easy lookup of display values
        this.requestTypeMap = new Map(res.Data.map((item: any) => [item.Code, item.Value]));
      } else {
        this.requestTypes = [];
      }
    });
  }

  onRequestTypeChange(code: string): void {
    // this.selectedRequestType = value;
    this.selectedRequestType = code;

    // Control visibility of conditional sections based on request type
    switch (code) {
      case 'DRT-0001': // Creation of new document
        this.trainingContent = true;
        this.showExclusionTable = true;
        break;
      case 'DRT-0002': // Revision of existing document
        this.trainingContent = false;
        this.showExclusionTable = false;
        break;
      case 'DRT-0003': // Obsoletion of existing document
        this.trainingContent = false;
        this.showExclusionTable = true;
        break;
      default:
        this.trainingContent = false;
        this.showExclusionTable = false;
        break;
    }

    // Trigger any other necessary actions
    this.loadRequestSpecificData(code);
  }

  loadRequestSpecificData(code: string) {
    // Load data specific to the selected request type
    switch (code) {
      case 'DRT-0001':
        this.loadCreationData();
        break;
      case 'DRT-0002':
        this.loadRevisionData();
        break;
      case 'DRT-0003':
        this.loadObsoletionData();
        break;
    }
  }

  loadCreationData() {
    // Load data for creation (e.g., request IDs dropdown)
    //this.loadRequestIds();
    // Reset any creation-specific data
  }

  loadRevisionData() {
    // Load data for revision (e.g., pending requests)
    //this.loadPendingRequests();
  }

  loadObsoletionData() {
    // Load data for obsoletion (e.g., documents grid)
    //this.loadDocumentsForObsoletion();
  }

  // Helper method to get display text
  getRequestTypeDisplayText(code: string): string {
    return this.requestTypeMap.get(code) || code;
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
    if (value === 'SOP') {
      this.trainingContent = true;
    }
    else{
      this.trainingContent = false;
    }
    //Get the Document Type's template
    this.GetDocumentAttributes(value);
    this.GetAllApprovedRequests();
    this.GetDocumentTemplate();

    const payLoad = {
      companyId: MASTER_DEFAULT_KEYS.COMPANYID,
      EntityType: 'Document',
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

  GetDocumentAttributes(value: string) {
    this._documentAttributeService.getDocumentAttributeByDocumentType(value).subscribe((res) => {
      if (res) {
        if (!res?.Data) return;

        this.attributes = res.Data;
      } else {
        this.attributes = [];
      }
    });
  }

  GetAllApprovedRequests() {
    if (this.selectedDocumentType == '' || this.selectedDocumentType == null) {
      return;
    }
    const companyId = MASTER_DEFAULT_KEYS.COMPANYID;
    this._documentService
      .GetRequestIdsFinalization(companyId, this.selectedDocumentType)
      .subscribe((res) => {
        if (res) {
          this.requestIds = (res.Data ?? []).map((d: any) => ({
            id: d.id,
            text: d.requestnumber,
          }));
        } else {
          this.requestIds = [];
        }
      });
  }

  onRequestIdChange(value: string): void {
    // this.loading = true;
    const requestId = value;
    const companyId = MASTER_DEFAULT_KEYS.COMPANYID;
    this._documentService.GerFinalizedDocumentByRequestId(companyId, requestId).subscribe((res) => {
      if (res) {
        if (!res?.Data) return;
        this.documentId = res.Data[0].documentid;
        this.templateHtml = res.Data[0].content;
      } else {
        this.templateHtml = '';
      }
    });
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

    // switch (gridId) {
    //   case 'distributionListGrid':
    //     this.divisionPageSize = pageSize;
    //     this.GetAllDistribution({
    //       pageNumber: 1,
    //       pageSize: this.selectedPageSize,
    //       sortModel: [], // or your current sort/filter model
    //       filterModel: {},
    //     });
    //     break;
    //   case 'document2Grid':
    //     this.employeePageSize = pageSize;
    //     this.GetAllDistribution({
    //       pageNumber: 1,
    //       pageSize: this.selectedPageSize,
    //       sortModel: [], // or your current sort/filter model
    //       filterModel: {},
    //     });
    //     break;
    //   case 'documentGrid':
    //     this.employeePageSize = pageSize;
    //     this.GetAllDistribution({
    //       pageNumber: 1,
    //       pageSize: this.selectedPageSize,
    //       sortModel: [], // or your current sort/filter model
    //       filterModel: {},
    //     });
    //     break;
    //   case 'userListGrid':
    //     this.employeePageSize = pageSize;
    //     this.GetAllDistribution({
    //       pageNumber: 1,
    //       pageSize: this.selectedPageSize,
    //       sortModel: [], // or your current sort/filter model
    //       filterModel: {},
    //     });
    //     break;
    //   // handle other grids...

    //   default:
    //     break;
    // }
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.cabinetHierarchy = values ?? [];
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  setCabinetHierarchyFromParent(): void {
    this.cabinetHierarchy = [
      { level: 1, title: 'Division', value: this.selectedDivisions },
      { level: 2, title: 'Department', value: this.selectedDepartment },
      { level: 3, title: 'Sub-Department', value: this.selectedSubDepartment },
      { level: 4, title: 'Business Domain', value: this.selectedBusinessDomain },
    ].filter((x) => x.value !== null && x.value !== undefined && x.value !== '');
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

  AddTrainingUsers() {
    debugger;
    this.showTrainingUserTable = this.showTrainingUserTable == true ? false : true;
    // if (!this.approvalPolicy) {
    //   this._notification.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select an approval policy.',
    //   );
    //   return;
    // }

    // const payLoad = {
    //   companyId: MASTER_DEFAULT_KEYS.COMPANYID,
    //   // EntityType: this.selectedPolicyId == PolicyId.RequestForDocumentCreation
    //   //             ? 'Request'
    //   //             : this.selectedPolicyId == PolicyId.DocumentCreation
    //   //               ? 'Document'
    //   //               : 'Revision',
    //   StepType: 'Review', // this will be discussed and sent from frontend, for now we are hardcoding it
    //   documentTypeCode: this.selectedDocumentType,
    //   divisionCode: this.selectedDivisions,
    //   departmentCode: this.selectedDepartment,
    //   subDepartmentCode: this.selectedSubDepartment,
    //   businessDomainCode: this.selectedBusinessDomain,
    //   // designationCodes: this.getDesignationCodes(),
    //   // roles: this.getRoleCodes(),
    //   // employeeCodes: this.getEmployeeCodes(),
    //   // CanEdit: this.approvalPolicy === ApprovalPolicy.CanEdit,
    //   RequireCrossFunctionalHead: false,
    //   IsParallelApproval: false,
    // };

    // this._workflowStepService.create(payLoad).subscribe({
    //   next: (response) => {
    //     if (response?.Success) {
    //       this.trainingUsersData = [...response.Data];

    //       this._notification.createNotification('success', 'Workflow', response.Message);
    //     }
    //   },
    //   error: (err) => {
    //     this._notification.createNotification('error', 'Error', 'Failed to create workflow step.');
    //   },
    // });
  }

  SubmiteDocumentRequests() {
    debugger;
    const payLoad = {
      companyId: MASTER_DEFAULT_KEYS.COMPANYID,
      documentid: this.documentId,
      userid: 1,
    };

    this._documentService.submitDocument(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notification.createNotification('success', 'Document', response.Message);
        }
      },
      error: (err) => {
        this._notification.createNotification('error', 'Error', 'Failed to approve document.');
      },
    });
  }
  GetDocumentTemplate() {
    this.documentTemplateService.getTemplateByDocumentTypeCode(this.selectedDocumentType).subscribe({
      next: (response) => {
        this.templateHtml = response.Data.TemplateContent;
        // Promise.resolve().then(() => {
        //   this.templateHtml = response.Data.TemplateContent;
        // });
      },
      error: (err) => console.error(err),
    });
  }
}
