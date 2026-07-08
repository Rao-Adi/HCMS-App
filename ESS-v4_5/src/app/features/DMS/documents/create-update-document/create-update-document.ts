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
import {
  CabinetSelection,
  ControlTypes,
  DocumentAttribute,
  SelectList,
} from '@app/shared/interfaces/interfaces';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { CompanyList } from '@app/shared/Dropdowns/company-list/company-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { DynamicFormByDocumentAttribute } from '@app/shared/dynamic-forms/dynamic-form-by-document-attribute/dynamic-form-by-document-attribute';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { DocumentRequestTypeService } from '@app/shared/services/document-request-type.service';
import { DocumentService } from '@app/shared/services/document.service';
import { TemplateService } from '@app/shared/services/template.service';
import { RevisionHistoryModal } from '../revision-history-modal/revision-history-modal';
import { LinkRenderer } from '@app/shared/ag-grid-renderers/link-renderer/link-renderer';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { PermissionService } from '@app/shared/services/permission.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { TrainingPolicyService } from '@app/shared/services/training-policy-service';
import { RoleList } from '@app/shared/Dropdowns/role-list/role-list';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { DocumentReviewPolicyService } from '@app/shared/services/document-review-policy.service';

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
    CabinetStructureList,
    ReactiveFormsModule,
    DynamicFormByDocumentAttribute,
    NzModalModule,
    RoleList,
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
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'uploadorcreate';

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
  draftFileUrl: string = '';
  trainingRequired: boolean = false;
  showDocumentContent: boolean = false;
  documentId: string = '';
  documentName: string = '';
  requestId: number = 0;
  loginEmpId: string = '';
  selectedTemplateType: string = '';
  draftFile: File | null = null;
  reviewYear: number = 0;

  selectedRequestType: string = '';
  cabinetHierarchy: CabinetSelection[] = [];

  approvalSequenceData: any[] = [];
  trainingUsersData: any[] = [];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
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

  selectedRole?: string = '';
  selectedUser: string[] = [];

  trainingModes: SelectList[] = [
    { CODE: 'Classroom', NAME: 'Classroom' },
    { CODE: 'Online', NAME: 'Online' },
  ];

  trainers: SelectList[] = [];

  users: SelectList[] = [];

  requestTypes: any[] = [];
  requestIds: any[] = [];
  // Map to store the display values
  requestTypeMap: Map<string, string> = new Map();

  documentRevisionData: [] = [];
  documentRevisionColumnDefs = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },

    { field: 'requestCreatedBy', headerName: 'Request Created By' },
    { field: 'requestCreatedOn', headerName: 'Request Created On' },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By' },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On' },
    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      editable: false,
      cellRenderer: (params: any) => {
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          ${params.value ? 'View' : 'View'}
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openWorkflowDeatilsModal(event.data);
      },
    },
    {
      field: 'revisionHistory',
      headerName: 'Revision History',
      editable: false,
      cellRenderer: (params: any) => {
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          ${params.value ? 'View' : 'View'}
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openWorkflowDeatilsModal(event.data);
      },
    },
  ];

  DocumentObsoletionGridColumnDefs = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },

    { field: 'requestCreatedBy', headerName: 'Request Created By' },
    { field: 'requestCreatedOn', headerName: 'Request Created On' },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By' },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On' },

    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      cellRendererSelector: () => ({
        component: LinkRenderer,
        params: {
          label: 'View',
          onClick: (rowData: any) => {
            this.openWorkflowDeatilsModal(rowData);
          },
        },
      }),
    },
    {
      field: 'revisionHistory',
      headerName: 'Revision History',
      cellRendererSelector: () => ({
        component: LinkRenderer,
        params: {
          label: 'View',
          onClick: (rowData: any) => {
            this.openRevisionHistoryModal(rowData);
          },
        },
      }),
    },
  ];

  DocumentObseletionData: any[] = [];

  constructor(
    private modal: NzModalService,
    private _documentAttributeService: DocumentAttributeService,
    private _workflowStepService: WorkflowStepService,
    private _notificationToastService: NotificationToastService,
    private _documentRequestTypeService: DocumentRequestTypeService,
    private _documentService: DocumentService,
    private documentTemplateService: TemplateService,
    private _documentRequestService: DocumentRequestService,
    private _permissionService: PermissionService,
    private _trainingPolicyService: TrainingPolicyService,
    private _peoplePartnerService: PeoplePartnersService,
    private _documentReviewPolicyService: DocumentReviewPolicyService
  ) {}

  ngOnInit() {
    this.GetLoginEmpId();
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      // this.getAllDocumentRequestTypes();
      this.loadRequestTypes();
    });
  }

  GetLoginEmpId() {
    this.loginEmpId = localStorage.getItem('HRISEmpId') || '';
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

  get isSubmitDisabled(): boolean {
    if (!this.selectedRequestType || !this.selectedDocumentType) {
      return true;
    }

    if (this.selectedRequestType === 'DRT-0001') {
      if (!this.selectedRequestId) {
        return true;
      }

      if (this.attributes && this.attributes.length > 0) {
        if (!this.dynamicForm || this.dynamicForm.invalid) {
          return true;
        }
      }

      if (this.trainingRequired && !this.selectedTrainingMode) {
        return true;
      }
    }
    return false;
  }

  onRequestTypeChange(code: string): void {
    // this.selectedRequestType = value;
    this.selectedRequestType = code;
    this.emptyFields();

    // Control visibility of conditional sections based on request type
    switch (code) {
      case 'DRT-0001': // Creation of new document
        //this.trainingRequired = false;
        this.showExclusionTable = true;
        break;
      case 'DRT-0002': // Revision of existing document
        //this.trainingRequired = false;
        this.showExclusionTable = false;
        this.GetEffectiveDocumentsForRevision('');
        break;
      case 'DRT-0003': // Obsoletion of existing document
        //this.trainingRequired = false;
        this.showExclusionTable = true;
        break;
      default:
        //this.trainingRequired = false;
        this.showExclusionTable = false;
        break;
    }

    // Trigger any other necessary actions
    this.loadRequestSpecificData(code);
  }

  onCellClicked(event: any): void {
    this.templateHtml = event.data?.proposedContent || '';
    this.draftFileUrl = event.data?.draftFileUrl || '';
    this.requestId = event.data?.requestId || event.data?.Id || event.data?.id || 0;
    this.documentName = event.data?.documentName || '';
    this.showDocumentContent = true;
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

    this.CheckTrainingPolicy(value);
    //Get the Document Type's template
    this.GetDocumentAttributes(value);

    this.GetAllApprovedRequests();
    this.GetDocumentTemplate();
    this.loadWorkflowAuthorities(this.selectedDocumentType);
    this.GetDocumentReviewPolicy();
    this.GetTemplate(this.selectedDocumentType);
    // const payLoad = {
    //   EntityType: 'Document',
    //   documentTypeCode: this.selectedDocumentType,
    //   divisionCode: this.selectedDivisions,
    //   departmentCode: this.selectedDepartment,
    //   subDepartmentCode: this.selectedSubDepartment,
    //   businessDomainCode: this.selectedBusinessDomain,
    // };

    // this._workflowStepService
    //   .getWorkflowStepByDocumentTypeCode(
    //     payLoad,
    //     // value,
    //     // this.selectedRequestType === '1' ? 1 : this.selectedRequestType === '2' ? 2 : 3,
    //   )
    //   .subscribe((res) => {
    //     // console.log('User Details:', res);
    //     this.showExclusionTable = true;
    //     // this.totalDistribution = res?.Data ? res.Data.length : 0;
    //     this.approvalSequenceData = res?.Data ? res.Data : [];
    //   });
  }

  loadWorkflowAuthorities(documentType: string) {
    if (!documentType) {
      this.approvalSequenceData = [];
      this.showExclusionTable = false;
      return;
    }

    const payLoad = {
      EntityType: 'Document',
      documentTypeCode: documentType,
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

  GetDocumentAttributes(value: string) {
    this._documentAttributeService.getDocumentAttributeByDocumentType(value).subscribe((res) => {
      if (res) {
        if (!res?.Data) return;
        this.attributes = res.Data.map((attr: any) => ({
          ...attr,
          ControlType: attr.ControlType.toLowerCase() as ControlTypes,
          options: attr.ListValues ? attr.ListValues.split(',').map((v: string) => v.trim()) : [],
        }));
        //this.attributes = res.Data;
      } else {
        this.attributes = [];
      }
    });
  }

  GetTemplate(value: string) {
    this.documentTemplateService.getTemplateByDocumentTypeCode(value).subscribe({
      next: (response: any) => {
        if (!response?.Data) {
          this.selectedTemplateType = '';
          this._notificationToastService.createNotification(
            'warning',
            'Template Missing',
            'Please first upload the template against this Document Type. Document request cannot be created.'
          );
          return;
        }

        this.selectedTemplateType =
          response.Data?.TemplateType?.toString() || response.Data?.templateType?.toString() || '';
      },
      error: (err) => {
        this.selectedTemplateType = '';
        console.error(err);
      },
    });
  }
  CheckTrainingPolicy(value: string) {
    this._trainingPolicyService.GetTrainingPolicyByDocumentType(value).subscribe((res) => {
      if (res && res.Data) {
        const data = res.Data;

        // 1. Assign the TrainingRequired value safely
        this.trainingRequired = !!data.TrainingRequired;

        // 2. Handle object mapping safely (if attributes expects an array)
        this.attributes = [
          {
            ...data,
            ControlType: data.ControlType?.toLowerCase() as ControlTypes,
            options: data.ListValues ? data.ListValues.split(',').map((v: string) => v.trim()) : [],
          },
        ];
      } else {
        this.attributes = [];
        this.trainingRequired = false;
      }
    });
  }

  GetAllApprovedRequests() {
    if (this.selectedDocumentType == '' || this.selectedDocumentType == null) {
      return;
    }
    const payLoad = {
      documentTypeCode: this.selectedDocumentType,
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
    };
    this._documentService.GetApprovedRequestForDocumentCreation(payLoad).subscribe((res) => {
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
    this._documentService.GerFinalizedDocumentByRequestId(requestId).subscribe((res) => {
      if (res) {
        if (!res?.Data) return;
        this.documentId = res.Data[0].documentid;
        this.templateHtml = res.Data[0].content || '';
        this.draftFileUrl = res.Data[0].draftfileurl || res.Data[0].draftFileUrl || '';
        this.documentName = res.Data[0].title || '';
      } else {
        this.templateHtml = '';
        this.draftFileUrl = '';
        this.documentName = '';
      }
    });
  }

  onTrainingModeChange(value: string): void {
    // this.loading = true;
    this.selectedTrainingMode = value;
  }

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
    this.GetAllApprovedRequests();

    if (this.selectedDocumentType) {
      this.loadWorkflowAuthorities(this.selectedDocumentType);
    }
  }

  submitDynamicForm() {
    if (!this.dynamicForm) return;

    if (this.dynamicForm.invalid) {
      this.dynamicForm.markAllAsTouched();
      return;
    }
    const payload = this.buildPayload();

    //console.log(this.dynamicForm.value);
  }

  buildPayload() {
    return this.attributes.map((attr) => ({
      attributeId: attr.Id,

      controlLabel: attr.ControlLabel,

      value: this.dynamicForm.get('ctrl_' + attr.Id)?.value,
    }));
  }

  AddTrainingUsers() {
    if (!this.selectedTrainingMode) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Training Mode.',
      );
      return;
    }
    if (!this.selectedRole) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Trainer.',
      );
      return;
    }
    if (!this.selectedUser || this.selectedUser.length === 0) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select at least one User.',
      );
      return;
    }

    this.showTrainingUserTable = true;

    const mode = this.trainingModes.find((m) => m.CODE === this.selectedTrainingMode);

    this.selectedUser.forEach((userCode) => {
      const user = this.users.find((u) => u.CODE === userCode);
      this.trainingUsersData.push({
        TrainingMode: mode?.NAME,
        TrainerName: this.selectedRole, // valueKey="NAME" bounds the actual role name
        UserName: user?.NAME,
        TrainerCode: this.selectedRole,
        UserCode: user?.CODE,
      });
    });

    this.selectedRole = '';
    this.selectedUser = [];
  }

  SubmiteDocument() {
    const attributeValues = this.buildAttributePayload();
    // console.log(JSON.stringify(attributeValues));
    const trainingMode = this.trainingModes.find((m) => m.CODE === this.selectedTrainingMode);
    const payLoad = {
      documentid: this.documentId,
      userid: this.loginEmpId,
      attributes: attributeValues,
      TrainingMode: trainingMode?.NAME == 'Classroom' ? 1 : 0, // Assuming 1 for Classroom and 0 for Online, adjust as needed
      traininguserids: this.trainingUsersData.map((user) => user.UserCode), // Included in Payload as requested
    };

  // Append the new draft file if it exists
  const formData = new FormData();
  Object.keys(payLoad).forEach((key) => {
    formData.append(key, (payLoad as any)[key]);
  });
  if (this.draftFile) {
    formData.append('DraftFile', this.draftFile, this.draftFile.name);
  }

    this._documentService.submitDocument(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notificationToastService.createNotification(
            'success',
            'Document',
            response.Message,
          );
          this.emptyFields();
          this.selectedRequestType = '';
          this.attributes = [];
          if (this.dynamicForm) {
            this.dynamicForm.reset();
          }
        }
      },
      error: (err) => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          'Failed to approve document.',
        );
      },
    });
  }

  onDraftFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.draftFile = input.files[0];
    } else {
      this.draftFile = null;
    }
  }

  private buildAttributePayload(): any[] {
    const result: any[] = [];
    const formValues = this.dynamicForm.value;

    this.attributes.forEach((attr) => {
      const controlName = 'ctrl_' + attr.Id;
      const value = formValues[controlName];

      // ✅ Skip truly empty values
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '');

      if (isEmpty) return;

      const dto: any = {
        companyId: MASTER_DEFAULT_KEYS.COMPANYID, // ✅ force number
        documentAttributeId: attr.Id,
        valueText: null,
        valueNumber: null,
        valueDate: null,
        valueBoolean: null,
      };

      switch (attr.ControlType) {
        case 'textbox':
        case 'textarea':
        case 'list':
          dto.valueText = value;
          break;

        case 'numeric':
          dto.valueNumber = Number(value);
          break;

        case 'date':
          dto.valueDate = value instanceof Date ? value : new Date(value);
          break;

        case 'checkbox':
          dto.valueBoolean = !!value;
          break;
      }

      result.push(dto);
    });

    return result;
  }

  GetDocumentTemplate() {
    this.documentTemplateService
      .getTemplateByDocumentTypeCode(this.selectedDocumentType)
      .subscribe({
        next: (response) => {
          this.templateHtml = response.Data.TemplateContent;
          // Promise.resolve().then(() => {
          //   this.templateHtml = response.Data.TemplateContent;
          // });
        },
        error: (err) => console.error(err),
      });
  }

  GetDocumentReviewPolicy() {
    const DocTypeCode = this.selectedDocumentType;
    this._documentReviewPolicyService
      .getDocumentReviewPolicyByDocumentTypeCode(DocTypeCode)
      .subscribe({
        next: (response) => {
          this.reviewYear = response?.ReviewPeriodYears;
        },
        error: (err) => console.error(err),
      });
  }

  openRevisionHistoryModal(row: any): void {
    this.modal.create({
      nzTitle: 'Revision History',
      nzContent: RevisionHistoryModal,
      nzData: {
        data: row, // 👈 this is what we’ll read inside modal
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });
  }

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Approval History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.Id,
        entityType: 'Document',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1000,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  GetEffectiveDocumentsForRevision(query?: any) {
    const searchText = query?.searchText || query?.filterModel?.fname?.filter || '';

    if (query && typeof query === 'object') {
      this.currentGridQuery = query;
    } else {
      this.currentGridQuery.pageNumber = 1;
    }

    const sortModel = this.currentGridQuery.sortModel || [];
    let sortBy = 'DESC'; // Default sort order
    let sortColumn = 'Id'; // Default sort column (adjust if you have a different default column)
    if (sortModel.length > 0) {
      sortColumn = sortModel[0].colId;
      sortBy = sortModel[0].sort === 'asc' ? 'ASC' : 'DESC';
    }

    const payload = {
      status: 0, // 0 = Draft
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: searchText || '',
    };

    this._documentRequestService.GetEffectiveDocumentsForRevision(payload).subscribe({
      next: (response) => {
        if (response?.Success || response?.Data) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.documentRevisionData = items.map((item: any) => ({
            Id: item.id || item.Id,
            companyId: item.companyId || item.CompanyId,
            requestNumber: item.RequestNumber || item.requestNumber,
            documentType: item.DocumentType || item.documentType,
            proposedDocumentNumber: item.RequestNumber || item.requestNumber,
            stepId: item.StepId || item.stepId,
            stepOrder: item.StepOrder || item.stepOrder,
            startedAt: item.StartedAt || item.startedAt,
            division: item.Division,
            documentId: item.DocumentNumber,
            documentName: item.DocumentName,
            proposedContent: item.ProposedContent,
            department: item.Department,
            departmentId: item.DepartmentCode,
            subdepartment: item.SubDepartment,
            justification: item.Justification,
            businessdomainId: item.BusinessDomainCode,
            documentTypeCode: item.DocumentTypeCode || item.documentTypeCode,
            pendingWith: item.CurrentAssignedUser,
            sumbittedby: item.CreatedBy,
            status: item.IsReworked ? 'Reworked' : 'Draft',
            createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.CreatedAt || ''),
            requestCreatedOn: new CustomDateFormatPipe().transform(
              item.createdAt || item.CreatedAt || '',
            ),
            previousVersionCreatedOn:
              item.draftContentLastModifiedAt || item.DraftContentLastModifiedAt || '',
            proposedVersionNumber: item.RowVersion || item.rowVersion,
            templateType: item.TemplateType || item.templateType,
            templateFileUrl: item.TemplateFileURL || item.templateFileUrl,
            draftFileUrl:
              item.DraftFileUrl ||
              item.draftFileUrl ||
              (String(item.TemplateType || item.templateType) === '1' ||
              String(item.TemplateType || item.templateType) === '2'
                ? item.ProposedContent
                : ''),
            // Map backend fields back to the frontend keys expected by the component
            distributionListPayload: (item.DistributionList || []).map((x: any) => ({
              ...x,
              level1Id: x.divisionCode || x.DivisionCode || x.level1Id,
              level2Id: x.departmentCode || x.DepartmentCode || x.level2Id,
              level3Id: x.subDepartmentCode || x.SubDepartmentCode || x.level3Id,
              level4Id: x.businessDomainCode || x.BusinessDomainCode || x.level4Id,
              roleId: x.roleId || x.RoleId,
              distributiontypeId:
                x.distributionTypeId || x.DistributionTypeId || x.distributiontypeId,
            })),
            distributionUserList: item.UserList,
          }));
        } else {
          this.documentRevisionData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this.documentRevisionData = [];
        this.totalRows = 0;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.Message || 'Failed to fetch draft documents.',
        );
      },
    });
  }

  GetAllApprovedDocuments(query: any) {
    const payLoad = {
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      documentTypeCode: this.selectedDocumentType,
      employeeCode: 'EMP-0001',
      RequestStatus: 'Approved',

      // pageNumber: this.currentGridQuery.pageNumber,
      // pageSize: this.currentGridQuery.pageSize,
      // sortModel: this.currentGridQuery.sortModel || [],
      // filterModel: this.currentGridQuery.filterModel || {},
      // searchTerm: this.currentGridQuery.searchTerm || '',
      // // Map to satisfy backend validation
      // sortBy: sortBy,
      // sortColumn: sortColumn,
      // searchText: this.currentGridQuery.searchTerm || '',
      empid: this.loginEmpId,
    };

    this._documentService.GetDocumentByStatus(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this.totalRows = response.Data.TotalCount;
          this.documentRevisionData = response.Data.map((item: any) => {
            // Helper to get value with case-insensitive fallback
            const get = (keys: string[], defaultValue: any = ''): any => {
              for (const key of keys) {
                if (item[key] !== undefined && item[key] !== null) return item[key];
                const lower = key.toLowerCase();
                if (item[lower] !== undefined && item[lower] !== null) return item[lower];
              }
              return defaultValue;
            };

            const createdAtRaw = get(['CreatedAt', 'createdAt', 'CreatedDate', 'createdDate']);
            const startedAtRaw = get(['StartedAt', 'startedAt']);

            return {
              // ──────────────────────────────────────────────
              // Identification & Request
              // ──────────────────────────────────────────────
              ExecutionId: get(['ExecutionId', 'executionId']),
              Id: get(['Id', 'id']),
              requestId: get(['Id', 'id']), // often same as Id
              stepId: get(['StepId', 'stepId']),
              stepOrder: get(['StepOrder', 'stepOrder']),
              ExecutionStatus: get(['ExecutionStatus', 'executionStatus'], 'Unknown'),

              // ──────────────────────────────────────────────
              // Document metadata
              // ──────────────────────────────────────────────
              documentType: get(['DocumentType', 'documentType']),
              documentTypeCode: get(['DocumentTypeCode', 'documentTypeCode']),
              documentName: get(['Title', 'title']),
              company: get(['Company', 'company'], ''),
              proposedDocumentNumber: get(['DocumentNumber', 'documentNumber']),
              proposedVersionNumber: get(['ProposedVersionNumber', 'proposedVersionNumber'], '1.0'), // fallback

              // ──────────────────────────────────────────────
              // Organizational context
              // ──────────────────────────────────────────────
              division: get(['Division']),
              department: get(['Department']),
              departmentId: get(['DepartmentCode', 'departmentCode']),
              subDepartment: get(['SubDepartment', 'SubDepartment']),
              businessdomain: get(['BusinessDomain', 'businessDomain']),
              businessdomainId: get(['BusinessDomainCode', 'businessDomainCode']),
              version: get(['ProposedVersionNumber', 'proposedVersionNumber']),
              // ──────────────────────────────────────────────
              // Content / Justification
              // ──────────────────────────────────────────────

              proposedContent: get(['VersionContent', 'ProposedContent', 'Content'], ''),
              draftFileUrl: get(['DraftFileUrl', 'draftfileurl', 'draftFileUrl'], ''),

              // ──────────────────────────────────────────────
              // Audit / History fields
              // ──────────────────────────────────────────────
              requestCreatedBy: get(['RequestCreatedBy', 'requestCreatedBy'], ''),
              dateOfCreation: this.formatDate(createdAtRaw), // ← see helper below
              requestCreatedOn: get(['RequestCreatedAt', 'requestCreatedAt']),
              startedAt: this.formatDate(startedAtRaw),

              // Previous version info (only if present in real payloads)
              previsousVersionCreatedBy: get(['RequestCreatedBy', 'requestCreatedBy'], ''),
              previousVersionCreatedOn: this.formatDate(
                get(['RequestCreatedAt', 'requestCreatedAt']),
              ),

              // ──────────────────────────────────────────────
              // Placeholder / missing fields from your original
              // (add real data source when available)
              // ──────────────────────────────────────────────
              observation: '', // ← not in sample → populate when available
              requestedBy: get(['RequestedBy', 'requestedBy'], get(['CreatedBy'])),
              dateOfApproval: '', // ← not present
              approvalHistory: '', //get(['VersionContent'], ''), // or format rich text if needed
            };
          });
        }
      },
      error: (err) => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          'Failed to submit document.',
        );
      },
    });
  }

  // Option 1: Simple custom method (no pipe dependency)
  private formatDate(value: string | null | undefined): string {
    if (!value) return '';

    // Input example: "02/21/2026 11:04:01"
    try {
      const [datePart, timePart = ''] = value.split(' ');
      const [month, day, year] = datePart.split('/');
      if (!year || !month || !day) return value;

      // Desired format example: 21-02-2026 11:04:01
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year} ${timePart.trim()}`.trim();
    } catch {
      return value; // fallback — show original if parsing fails
    }
  }

  emptyFields() {
    this.showDocumentContent = false;
    this.selectedCompany = '';
    this.selectedDocumentType = '';
    this.selectedDivisions = '';
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.selectedBusinessDomain = '';
    this.templateHtml = '';
    this.draftFileUrl = '';
    this.documentName = '';
    this.requestId = 0;
    this.draftFile = null;
    this.selectedRequestId = '';
    this.approvalSequenceData = [];
    this.trainingUsersData = [];
    this.selectedTrainingMode = '';
    this.selectedRole = '';
    this.selectedUser = [];
  }

  downloadDraft(): void {
    const idToDownload = this.selectedRequestId ? Number(this.selectedRequestId) : this.requestId;

    if (!idToDownload) {
      this._notificationToastService.createNotification(
        'warning',
        'Draft',
        'No drafted file available for download.',
      );
      return;
    }

    this._documentRequestService.DownloadDraftDocument(idToDownload).subscribe({
      next: (response: any) => {
        const body = response?.body || response;
        let blob: Blob | null = null;

        if (body instanceof Blob) {
          blob = body;
        } else if (body instanceof ArrayBuffer) {
          blob = new Blob([body]);
        }

        if (blob) {
          if (blob.type === 'application/json' || blob.type === 'application/problem+json') {
            blob.text().then((text: string) => {
              try {
                const res = JSON.parse(text);
                this._notificationToastService.createNotification(
                  'warning',
                  'Draft',
                  res.Message || 'Draft not available.',
                );
              } catch {
                this._notificationToastService.createNotification(
                  'error',
                  'Draft',
                  'Failed to read response.',
                );
              }
            });
            return;
          }

          let filename = `Draft_${this.documentName || idToDownload}`;
          const contentDisposition =
            response?.headers?.get('content-disposition') ||
            response?.headers?.get('Content-Disposition');
          if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          this._notificationToastService.createNotification(
            'warning',
            'Draft',
            'No drafted file available for download.',
          );
        }
      },
      error: (err: any) => {
        if (
          err.error instanceof Blob &&
          (err.error.type === 'application/json' || err.error.type === 'application/problem+json')
        ) {
          err.error.text().then((text: string) => {
            try {
              const res = JSON.parse(text);
              this._notificationToastService.createNotification(
                'error',
                'Draft',
                res.Message || 'Failed to download draft.',
              );
            } catch {
              this._notificationToastService.createNotification(
                'error',
                'Draft',
                'Failed to download draft.',
              );
            }
          });
        } else {
          console.error('Error downloading draft', err);
          this._notificationToastService.createNotification(
            'error',
            'Draft',
            'Failed to download draft.',
          );
        }
      },
    });
  }

  loadUsersWhenRoleIdChanges(query: any = {}) {
    const roleId = this.selectedRole;
    if (!roleId) {
      this.users = [];
      this.totalRows = 0;
      this.selectedUser = []; // Clear selected user
      return;
    }
    const sort = query.sortModel?.[0];
    const payload = {
      searchtext: query.searchTerm || query.searchText || '',
      sortby: sort?.sort?.toUpperCase() || 'ASC',
      sortcolumn: sort?.colId || 'empid', // Fallback to ensure query works smoothly
      isactive: true,
      pagenumber: Number(query.pageNumber) || 1,
      pagesize: Number(query.pageSize) || this.pageSize,
      divisionCode: null,
      departmentCode: null,
      subDepartmentCode: null,
      businessDomainCode: null,
      documentTypeCode: this.selectedDocumentType,
    };

    this._peoplePartnerService.getUserByRoleId(roleId, payload).subscribe((res) => {
      if (res?.Success && res.Data) {
        const data = res.Data;
        const users = (Array.isArray(data) ? data : data.Items || []).filter((u: any) => u != null);

        if (users.length > 0) {
          this.totalRows = data.TotalCount ?? users.length;
          this.users = users.map((u: any) => {
            // Ensure we never receive undefined codes/names by exhausting all possible API casing variants
            const code =
              u.empcode ||
              u.empCode ||
              u.EmployeeCode ||
              u.employeeCode ||
              u.empid ||
              u.empId ||
              u.EmployeeId ||
              u.id ||
              u.Id ||
              u.UserId ||
              u.userId ||
              u.UserCode ||
              u.userCode ||
              u.CODE;
            const name = u.firstname
              ? `${u.firstname} ${u.midname || ''} ${u.lastname || ''}`.trim().replace(/\s+/g, ' ')
              : u.EmployeeName ||
                u.employeeName ||
                u.empName ||
                u.EmpName ||
                u.UserName ||
                u.userName ||
                u.Name ||
                u.name ||
                u.NAME ||
                code;

            return {
              ...u,
              CODE: code,
              NAME: name,
            };
          });
        } else {
          this.users = [];
          this.totalRows = 0;
        }
      } else {
        this.users = [];
        this.totalRows = 0;
      }
    });
  }
}
