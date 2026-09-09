import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import * as mammoth from 'mammoth';
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
import { MyDocuments } from './my-documents/my-documents';

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
    MyDocuments,
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedTab: string = 'CreateUpdate';
  myDocumentsCount: number = 0;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'uploadorcreate';
  submitting: boolean = false;

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
  templateFileUrl: string = '';
  trainingRequired: boolean = false;
  showDocumentContent: boolean = false;
  documentId: string = '';
  documentName: string = '';
  requestId: number = 0;
  loginEmpId: string = '';
  selectedTemplateType: string = '';
  draftFile: File | null = null;
  // True while mammoth.js is converting a just-uploaded .docx to HTML for the content-preview
  // rich text editor (see onDraftFileSelected).
  convertingUploadedFile: boolean = false;
  reviewYear: number = 0;

  selectedEntityType: string = 'Document';
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

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 10; // default value

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
  users: any[] = [];
  requestTypes: any[] = [];
  requestIds: any[] = [];
  // Map to store the display values
  requestTypeMap: Map<string, string> = new Map();

  documentRevisionData: [] = [];
  documentRevisionColumnDefs = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentNumber', headerName: 'Document Number' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'businessDomain', headerName: 'Business Domain' },
    { field: 'requestCreatedBy', headerName: 'Request Created By', minWidth: 150 },
    { field: 'requestCreatedOn', headerName: 'Request Created On', minWidth: 150 },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By', minWidth: 150 },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On', minWidth: 150 },
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
          ${params.value ? 'Approval History' : 'Approval History'}
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openWorkflowDetailsModal(event.data);
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
          ${params.value ? 'Revision History' : 'Revision History'}
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openRevisionHistoryModal(event.data);
      },
    },
  ];

  DocumentObsoletionGridColumnDefs = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentNumber', headerName: 'Document Number' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'businessDomain', headerName: 'Business Domain' },

    { field: 'requestCreatedBy', headerName: 'Request Created By', minWidth: 150 },
    { field: 'requestCreatedOn', headerName: 'Request Created On', minWidth: 150 },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By', minWidth: 150 },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On', minWidth: 150 },

    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      cellRendererSelector: () => ({
        component: LinkRenderer,
        params: {
          label: 'Approval History',
          onClick: (rowData: any) => {
            this.openWorkflowDetailsModal(rowData);
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
          label: 'Revision History',
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
    private _documentReviewPolicyService: DocumentReviewPolicyService,
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
    this.getMyDocumentsCount();
  }

  getMyDocumentsCount() {
    this._documentService.getMyDocumentsTotalCount().subscribe({
      next: (response) => {
        if (response && response.Success) {
          this.myDocumentsCount = response.Data ?? 0;
        }
      },
      error: (err) => console.error('Failed to get my documents count', err),
    });
  }

  // Keeps the pill-shaped tab badge from stretching wide for large counts.
  formatBadgeCount(count: number): string {
    return count > 999 ? '999+' : String(count);
  }

  GetLoginEmpId() {
    this.loginEmpId = localStorage.getItem('HRISEmpId') || '';
  }

  loadRequestTypes() {
    // Assuming you have a service that fetches this data
    this._documentRequestTypeService.getDocumentTypeList().subscribe((res) => {
      if (res) {
        this.requestTypes = (res.Data ?? [])
          .map((d: any) => ({
            id: d.Code,
            text: d.Value,
          }))
          .sort((a: any, b: any) => (a.text || '').localeCompare(b.text || ''));

        // Create a map for easy lookup of display values
        this.requestTypeMap = new Map(res.Data.map((item: any) => [item.Code, item.Value]));
      } else {
        this.requestTypes = [];
      }
    });
  }

  get isSubmitDisabled(): boolean {
    if (this.submitting) {
      return true;
    }
    if (!this.selectedRequestType || !this.selectedDocumentType) {
      return true;
    }

    if (this.selectedRequestType === 'DRT-0001') {
      if (!this.selectedRequestId) {
        return true;
      }
    }

    // Document content is mandatory for file-based templates (types 1 & 2) -- either an
    // uploaded file OR real content already in the rich text editor satisfies this (matches
    // the form's own "Upload... OR type the content manually below" wording). Previously this
    // only accepted a file, so a document that already had real content (e.g. loaded from an
    // existing document when revising, or typed with no file ever uploaded) stayed permanently
    // disabled even though there was nothing left for the user to actually do.
    if (this.selectedRequestType === 'DRT-0001' || this.selectedRequestType === 'DRT-0002') {
      if (this.selectedTemplateType !== '3') {
        if (!this.draftFileUrl && !this.draftFile && !this.hasRealContent(this.templateHtml)) {
          return true;
        }
      }
    }

    if (this.selectedRequestType === 'DRT-0001') {
      if (this.attributes && this.attributes.length > 0) {
        if (!this.dynamicForm || this.dynamicForm.invalid) {
          return true;
        }
      }

      if (this.trainingRequired) {
        if (!this.selectedTrainingMode) {
          return true;
        }
        if (!this.trainingUsersData || this.trainingUsersData.length === 0) {
          return true;
        }
      }
    }
    return false;
  }

  // A rich-text editor with no real user content can still carry Quill's empty-state markup
  // (e.g. "<p><br></p>"), which is non-empty as a raw string but shows nothing to the user --
  // stripping tags and checking for actual leftover text avoids treating that as real content.
  private hasRealContent(html: string | null | undefined): boolean {
    if (!html) return false;
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    return text.length > 0;
  }

  // The actual file extension a drafted upload must match. Derived straight from the
  // template/existing-document URL rather than the TemplateType code, since TemplateType
  // is an unreliable classification (e.g. TemplateType 1 has been seen pointing at a .docx).
  get expectedTemplateExtension(): string {
    const url = this.templateFileUrl || this.draftFileUrl || '';
    if (!url) return '';
    try {
      const clean = decodeURIComponent(url).split('?')[0].split('#')[0];
      const parts = clean.split('.');
      return parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
    } catch {
      return '';
    }
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
        this.selectedEntityType = 'Document';
        break;
      case 'DRT-0002': // Revision of existing document
        //this.trainingRequired = false;
        this.selectedEntityType = 'Revision';
        this.showExclusionTable = false;
        this.GetEffectiveDocumentsForRevision('');
        break;
      case 'DRT-0003': // Obsoletion of existing document
        //this.trainingRequired = false;
        this.selectedEntityType = 'Revision';
        this.showExclusionTable = false;
        break;
      default:
        this.selectedEntityType = 'Document';
        //this.trainingRequired = false;
        this.showExclusionTable = false;
        break;
    }

    // Trigger any other necessary actions
    this.loadRequestSpecificData(code);
  }

  onCellClicked(event: any): void {
    const data = event.data;
    this.templateHtml = data?.proposedContent || '';
    this.draftFileUrl = data?.draftFileUrl || '';
    this.requestId = data?.requestId || data?.Id || data?.id || 0;
    this.documentName = data?.documentName || '';
    this.selectedDocumentType = data?.documentTypeCode || '';
    this.selectedTemplateType = data?.templateType?.toString() || '';
    this.showDocumentContent = true;

    if (this.selectedDocumentType) {
      this.CheckTrainingPolicy(this.selectedDocumentType);
      this.GetDocumentAttributes(this.selectedDocumentType);
      this.loadWorkflowAuthorities(this.selectedDocumentType);
      this.GetDocumentReviewPolicy();
    }
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
    // This grid (like the Revision one) has no (serverQuery) binding — it's a plain
    // client-side grid that only ever shows whatever rowData it's given. Without this call,
    // DocumentObseletionData never gets assigned, AgGridWrapper's rowData input never
    // changes, and its loading spinner never clears.
    this.GetAllApprovedDocuments('');
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
    this.templateHtml = '';
    this.draftFileUrl = '';
    this.draftFile = null;
    this.templateFileUrl = '';
    this.selectedRequestId = '';
    this.showDocumentContent = false;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    if (value) {
      this.CheckTrainingPolicy(value);
      this.GetDocumentAttributes(value);
      this.GetAllApprovedRequests();
      this.loadWorkflowAuthorities(this.selectedDocumentType);
      this.GetDocumentReviewPolicy();
      this.GetTemplate(this.selectedDocumentType);
    } else {
      this.emptyFields();
    } 
  }

  loadWorkflowAuthorities(documentType: string) {
    if (!documentType) {
      this.approvalSequenceData = [];
      this.showExclusionTable = false;
      return;
    }

    const payLoad = {
      EntityType: this.selectedEntityType || 'Document',
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
    this._documentAttributeService.getDocumentAttributeByDocumentType(value).subscribe({
      next: (res) => {
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
      },
      error: () => {
        this.attributes = [];
      },
    });
  }

  GetTemplate(value: string) {
    this.documentTemplateService.getTemplateByDocumentTypeCode(value).subscribe({
      next: (response: any) => {
        if (!response?.Success || !response?.Data || Object.keys(response.Data).length === 0) {
          this.selectedTemplateType = '';
          this.templateFileUrl = '';
          this.templateHtml = '';
          this.draftFileUrl = '';
          this._notificationToastService.createNotification(
            'warning',
            'Template Missing',
            'Please first upload the template against this Document Type. Document request cannot be created.',
          );
          return;
        }

        this.selectedTemplateType =
          response.Data?.TemplateType?.toString() || response.Data?.templateType?.toString() || '';
        this.templateFileUrl =
          response.Data?.TemplateFileUrl ||
          response.Data?.TemplateFileURL ||
          response.Data?.templateFileUrl ||
          '';
      },
      error: (err) => {
        this.selectedTemplateType = '';
        this.templateFileUrl = '';
        this.templateHtml = '';
        this.draftFileUrl = '';
        console.error(err);
      },
    });
  }

  CheckTrainingPolicy(value: string) {
    this._trainingPolicyService.GetTrainingPolicyByDocumentType(value).subscribe({
      next: (res) => {
        if (res && res.Data) {
          const data = res.Data;

          // 1. Assign the TrainingRequired value safely
          this.trainingRequired = !!data.TrainingRequired;
        } else {
          this.trainingRequired = false;
        }
      },
      error: () => {
        this.trainingRequired = false;
      },
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
        this.requestIds = (res.Data ?? [])
          .map((d: any) => ({
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
        this.draftFileUrl =
          res.Data[0].draftfileurl ||
          res.Data[0].draftFileUrl ||
          '';
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
        TrainerName: user?.role, // valueKey="NAME" bounds the actual role name
        UserName: user?.NAME,
        TrainerCode: this.selectedRole,
        UserCode: user?.CODE,
      });
    });

    this.selectedRole = '';
    this.selectedUser = [];
  }

  SubmiteDocument() {
    this.submitting = true;
    const attributeValues = this.buildAttributePayload();
    // console.log(JSON.stringify(attributeValues));

    const trainingUsers = (this.trainingUsersData || []).map((user: any) => {
      const modeVal = user.TrainingMode === 'Classroom' ? 1 : (user.TrainingMode === 'Online' ? 2 : 0);
      return {
        trainingmode: modeVal,
        employeecode: user.UserCode || '',
      };
    });

    const payLoad = {
      documentid: this.documentId,
      attributes: attributeValues,
      trainingusers: trainingUsers,
    };

    // Append the new draft file if it exists
    const formData = new FormData();
    Object.keys(payLoad).forEach((key) => {
      if (key === 'trainingusers' || key === 'TrainingUsers' || key === 'attributes') {
        formData.append(key, JSON.stringify((payLoad as any)[key]));
      } else {
        formData.append(key, (payLoad as any)[key]);
      }
    });
    // Template attachment for documents that didn't get one at Document Request creation time.
    // Both can now be sent together: a Word/PDF-type upload also populates templateHtml with a
    // preview of the file's own content (see previewUploadedFileContent), which the user can
    // leave as-is or edit -- either way, ProposedContent carries whatever's currently in that
    // editor. The backend prefers ProposedContent over the raw file at download-merge time
    // (DocumentComponent.MergeDocumentTemplateAsync), so an edit actually takes effect; leaving
    // it untouched still reflects the original file's own content either way.
    if (this.draftFile) {
      formData.append('DocumentFile', this.draftFile, this.draftFile.name);
    }
    if (this.templateHtml) {
      formData.append('ProposedContent', this.templateHtml);
    }

    this._documentService.submitDocument(formData).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notificationToastService.createNotification(
            'success',
            'Document Create',
            response.Message,
          );
          this.emptyFields();
          this.selectedRequestType = '';
          this.attributes = [];
          if (this.dynamicForm) {
            this.dynamicForm.reset();
          }
          setTimeout(() => {
            this.submitting = false;
            window.location.reload();
          }, 1000);
        } else {
          this.submitting = false;
        }
      },
      error: (err) => {
        this.submitting = false;
        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notificationToastService.createNotification(
          'error',
          'Document Create/Update',
          message,
        );
      },
    });
  }

  onDraftFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.draftFile = null;
      return;
    }

    const file = input.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const expectedExt = this.expectedTemplateExtension;

    if (expectedExt && ext !== expectedExt) {
      this._notificationToastService.createNotification(
        'warning',
        'Invalid File',
        `The document template is a .${expectedExt} file. Please upload a matching .${expectedExt} file.`,
      );
      input.value = '';
      this.draftFile = null;
      return;
    }

    this.draftFile = file;
    this.previewUploadedFileContent(file);
  }

  // Converts the uploaded .docx to HTML client-side (mammoth.js) so its formatted content shows
  // up in the rich text editor for review/editing -- see the template's "Content Preview"
  // section. Only .docx is supported (mammoth doesn't read legacy .doc); anything else just
  // leaves templateHtml empty, so only the original file participates in the download-time merge
  // for those, exactly as before this feature. Never blocks the actual upload/submit on failure --
  // this only affects the in-form preview.
  private previewUploadedFileContent(file: File): void {
    this.templateHtml = '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'docx') return;

    this.convertingUploadedFile = true;
    file
      .arrayBuffer()
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        this.templateHtml = result.value;
      })
      .catch(() => {
        // Leave templateHtml empty -- the uploaded file is still fully valid for submission.
      })
      .finally(() => {
        this.convertingUploadedFile = false;
      });
  }

  reviewDraftedFile(): void {
    if (this.draftFile) {
      const fileURL = URL.createObjectURL(this.draftFile);
      window.open(fileURL, '_blank');
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    }
  }

  getDraftFileName(): string {
    if (this.draftFile) {
      return this.draftFile.name;
    }
    if (this.draftFileUrl) {
      try {
        const decoded = decodeURIComponent(this.draftFileUrl);
        const parts = decoded.split('/');
        return parts[parts.length - 1].split('?')[0];
      } catch (e) {
        const parts = this.draftFileUrl.split('/');
        return parts[parts.length - 1];
      }
    }
    return '';
  }

  removeDraftedFile(): void {
    this.draftFile = null;
    this.draftFileUrl = '';
    // Only reachable from the Word/PDF file-upload branch (see the template) -- templateHtml
    // there only ever holds this file's converted preview, never independently-typed HTML
    // template content (that's the selectedTemplateType === '3' branch, which has no file
    // upload UI at all), so clearing it here is safe.
    this.templateHtml = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
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

  GetDocumentReviewPolicy() {
    const DocTypeCode = this.selectedDocumentType;
    this._documentReviewPolicyService
      .getDocumentReviewPolicyByDocumentTypeCode(DocTypeCode)
      .subscribe({
        next: (response) => {
          if (response?.Success || response?.Data) {
            this.reviewYear = response?.Data.ReviewPeriodYears;
          } else {
            this.reviewYear = 0;
          }
        },
        error: (err) => {
          this.reviewYear = 0;
          console.error(err);
        },
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
      nzWidth: '70%',
    });
  }

  openWorkflowDetailsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Approval History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.Id,
        entityType: this.selectedEntityType || 'Document',
        decision:'Approved'
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
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

    this._documentService.GetEffectiveDocumentsForRevision(payload).subscribe({
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
            version: item.Version,
            division: item.Division,
            documentId: item.Id || item.id,
            documentNumber: item.documentNumber || item.DocumentNumber,
            documentName: item.DocumentName,
            proposedContent: item.ProposedContent,
            department: item.Department,
            departmentId: item.DepartmentCode,
            subdepartment: item.SubDepartment,
            justification: item.Justification,
            businessdomain: item.BusinessDomain,
            businessDomainCode: item.BusinessDomainCode,
            documentTypeCode: item.DocumentTypeCode || item.documentTypeCode,
            pendingWith: item.CurrentAssignedUser,
            requestCreatedBy: item.LastModifiedByName,
            status: item.IsReworked ? 'Reverted' : 'Draft',
            requestCreatedOn: new CustomDateFormatPipe().transform(
              item.CreatedAt || item.CreatedAt || '',
            ),
            // previousVersionCreatedOn: new CustomDateFormatPipe().transform(
            //   item.createdAt || item.CreatedAt || '',
            // ),
            // previousVersionCreatedOn:
            //   item.draftContentLastModifiedAt || item.DraftContentLastModifiedAt || '', 
            templateType: item.TemplateType || item.templateType,
            templateFileUrl:
              item.TemplateFileUrl || item.TemplateFileURL || item.templateFileUrl || '',
            draftFileUrl:
              item.DraftFileUrl ||
              item.draftfileurl ||
              item.draftFileUrl ||
              '',
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
    const sortModel = this.currentGridQuery.sortModel || [];
    let sortBy = 'DESC'; // Default sort order
    let sortColumn = 'Id'; // Default sort column (adjust if you have a different default column)
    if (sortModel.length > 0) {
      sortColumn = sortModel[0].colId;
      sortBy = sortModel[0].sort === 'asc' ? 'ASC' : 'DESC';
    }

    const payLoad = {
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      documentTypeCode: this.selectedDocumentType,
      RequestStatus: 'Approved',

      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize || this.selectedPageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      searchTerm: this.currentGridQuery.searchTerm || '',
      // Map to satisfy backend validation
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: this.currentGridQuery.searchTerm || '',
      empid: this.loginEmpId,
    };

    this._documentService.GetDocumentByStatus(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          // response.Data is { Items: [...], TotalCount } like every other list endpoint in
          // this app — it is NOT itself an array. Calling .map() on it directly (as this used
          // to) throws a TypeError before DocumentObseletionData is ever reassigned, which
          // RxJS routes to the error handler below and leaves the grid's rowData untouched —
          // so AgGridWrapper's loading spinner never clears.
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);
          this.totalRows = data?.TotalCount ?? items.length;
          this.DocumentObseletionData = items.map((item: any) => {
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
              documentNumber: get(['DocumentNumber', 'documentNumber','documentnumber']),
              documentName: get(['Title', 'title']),
              company: get(['Company', 'company'], ''),  

              // ──────────────────────────────────────────────
              // Organizational context
              // ──────────────────────────────────────────────
              division: get(['Division']),
              department: get(['Department']),
              departmentId: get(['DepartmentCode', 'departmentCode']),
              subDepartment: get(['SubDepartment', 'SubDepartment']),
              businessDomain: get(['BusinessDomain', 'businessDomain']),
              businessDomainCode: get(['BusinessDomainCode', 'businessDomainCode']),
              version: get(['Version', 'version']),
              // ──────────────────────────────────────────────
              // Content / Justification
              // ──────────────────────────────────────────────

              proposedContent: get(['VersionContent', 'ProposedContent', 'Content'], ''),
              draftFileUrl: get(['DraftFileUrl', 'draftfileurl', 'draftFileUrl'], ''),

              // ──────────────────────────────────────────────
              // Audit / History fields
              // ──────────────────────────────────────────────
              requestCreatedBy: get(['LastModifiedByName', 'lastModifiedByName'], ''),
              dateOfCreation: this.formatDate(createdAtRaw), // ← see helper below
              requestCreatedOn: get(['RequestCreatedAt', 'requestCreatedAt']),
              startedAt: this.formatDate(startedAtRaw),

              // Previous version info -- was commented out (and, before that, misspelled and
              // reading the wrong source fields: RequestCreatedBy/At instead of
              // PreviousVersionCreatedBy/On), which is why Obsoletion's grid never showed it
              // even though GetDocumentByStatus already returns it (same fields the sibling
              // grids, e.g. my-approval-document.ts, read successfully).
              previousVersionCreatedBy: get(['PreviousVersionCreatedBy', 'previousVersionCreatedBy'], ''),
              previousVersionCreatedOn: this.formatDate(
                get(['PreviousVersionCreatedOn', 'previousVersionCreatedOn']),
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
        } else {
          // A falsy Success must still clear the grid's rowData — otherwise it's left
          // showing stale data (or none) while the loading spinner never turns off.
          this.DocumentObseletionData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this.DocumentObseletionData = [];
        this.totalRows = 0;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to fetch documents for obsoletion.',
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
    this.templateFileUrl = '';
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

  getFileIconClass(filename: string | null | undefined): string {
    if (!filename) return 'bi-file-earmark-text text-primary';
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'bi-file-earmark-pdf text-danger';
      case 'doc':
      case 'docx':
        return 'bi-file-earmark-word text-primary';
      case 'xls':
      case 'xlsx':
        return 'bi-file-earmark-excel text-success';
      case 'ppt':
      case 'pptx':
        return 'bi-file-earmark-ppt text-warning';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'bi-file-earmark-image text-info';
      case 'zip':
      case 'rar':
        return 'bi-file-earmark-zip text-warning';
      default:
        return 'bi-file-earmark-text text-secondary';
    }
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
              NAME: '(' + code + ') ' + name,
              RAW_NAME: name,
            };
          }).sort((a: any, b: any) => (a.RAW_NAME || '').localeCompare(b.RAW_NAME || ''));
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
