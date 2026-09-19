import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
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
import { EmployeeList } from '@app/shared/Dropdowns/employee-list/employee-list';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { DocumentReviewPolicyService } from '@app/shared/services/document-review-policy.service';
import { MyDocuments } from './my-documents/my-documents';
import { DraftDocumentList } from './draft-document-list/draft-document-list';
import { DRUsersComponent } from '../document-request-management/drusers-component/drusers-component';
import { DRDistributionList } from '../document-request-management/drdistribution-list/drdistribution-list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';


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
    EmployeeList,
    MyDocuments,
    DraftDocumentList,
    DRUsersComponent,
    DRDistributionList,
    NzInputModule
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
export class CreateUpdateDocument implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedTab: string = 'CreateUpdate';
  myDocumentsCount: number = 0;
  draftDocumentsCount: number = 0;

  savingDraft: boolean = false;

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

  // Backed by a get/set pair (not a plain field) so hasRealContent's regex work over
  // potentially very large HTML (a converted .docx can easily carry a large embedded base64
  // image -- see hasRealContent's own comment, a confirmed ~230KB case) runs once per actual
  // content change instead of on every change-detection cycle. submitDisabledReason reads
  // _hasRealContentCache directly; it used to call hasRealContent(this.templateHtml) itself,
  // and since it's bound in the template from 3+ places (isSubmitDisabled, the disabled-reason
  // banner, the button's title), a single click ANYWHERE on the page -- Angular's default
  // change detection re-checks the whole component tree on every event -- re-ran that regex
  // work 3-4 times per click, which is what made every dropdown feel like it hung for seconds.
  private _templateHtml: string = '';
  private _hasRealContentCache: boolean = false;
  get templateHtml(): string {
    return this._templateHtml;
  }
  set templateHtml(value: string) {
    this._templateHtml = value;
    this._hasRealContentCache = this.hasRealContent(value);
  }

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

  // "Use an Approved Request" vs "Create Document Directly" (DRT-0001 only) -- defaults to
  // 'request' so existing users see no change in default behavior. See isSubmitDisabled and
  // SubmiteDocument() for how each mode is gated/submitted differently.
  creationMode: 'request' | 'direct' = 'request';

  // Justification / Document Users / Distribution List -- only used in 'direct' mode. The
  // 'request' path never needs these here: they were already captured when the Request itself
  // was created, and CreateDocumentFromApprovedRequestAsync's own promotion step already carried
  // them onto the Document at approval time (Documents.Justification, DocumentRoleDistributions,
  // DocumentUserDistributions) before this screen ever saw that Request ID.
  justification: string = '';
  distributionListPayload: any[] = [];
  distributionUserList: any[] = [];

  // This-document-only approver, appended after the policy-resolved workflow sequence at submit
  // time (never persisted to the reusable WorkflowPolicies/WorkflowStepDefinitions config).
  // Capped at exactly one entry -- see AddAdHocApprover.
  selectedAdHocApprover: string = '';
  adHocApprovers: { EmployeeCode: string; EmployeeName: string; Role: string }[] = [];
  // Reads its label from adHocEmployeeListRef.options (the SAME data app-employee-list already
  // fetched for its own dropdown) instead of this component doing its own separate
  // GetEmployeeList() call -- an earlier version did that, and doing the full employee-list
  // fetch+sort a second time on top of app-employee-list's own internal one was the actual cause
  // of the reported UI hang when opening this picker.
  @ViewChild('adHocEmployeeList') adHocEmployeeListRef?: EmployeeList;

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
  // Populated only for Revision/Obsoletion (onCellClicked) -- the picked document's OWN
  // currently-saved attribute values, prefilled into the (still-editable) Document Attributes
  // form as a starting point. DRT-0001 create never has a prior document to read these from.
  attributeValues: any[] = [];
  // Tracks which Document Type CheckTrainingPolicy/GetDocumentAttributes/GetDocumentReviewPolicy
  // were last fetched for -- see onCellClicked, which skips re-fetching these 3 when clicking
  // between rows of the same type in the Revision/Obsoletion grid (they're Document-Type-scoped,
  // not per-row).
  private lastLoadedAttributesDocumentType: string = '';
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
    // Business Domain removed -- this cabinet level is configured inactive for this company
    // (CabinetHierarchyService's active-levels list), so the column always showed empty/
    // irrelevant data. Scoped to just these two grids, not a general "hide inactive cabinet
    // levels everywhere" fix -- a company that DOES have Business Domain active would still
    // want to see it, which would need the column list to read the active-levels config
    // dynamically rather than being hardcoded like this.
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
    // Business Domain removed -- see documentRevisionColumnDefs' comment above.

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
    private _navigationCountsService: NavigationCountsService,
  ) {}

  ngOnInit() {
    // Both tab badges read the shared count state rather than fetching their own. Whoever
    // triggers a refresh -- this page on load, any action through refreshAfterAction, or
    // main-layout on navigation -- every subscriber sees the same number.
    this.subscriptions.push(
      this._navigationCountsService.myDocumentsTotalCount$.subscribe((count) => {
        this.myDocumentsCount = count;
      }),
      this._navigationCountsService.myDraftDocumentsCount$.subscribe((count) => {
        this.draftDocumentsCount = count;
      }),
    );

    this.GetLoginEmpId();
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      // this.getAllDocumentRequestTypes();
      this.loadRequestTypes();
    });
    this.getMyDocumentsCount();
    this.getMyDraftDocumentsCount();
  }

  getMyDocumentsCount() {
    this._navigationCountsService.refreshMyDocumentsTotalCount();
  }

  getMyDraftDocumentsCount() {
    this._navigationCountsService.refreshMyDraftDocumentsCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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
    return this.submitting || !!this.submitDisabledReason;
  }

  // DRT-0002 (Revision) and DRT-0003 (Obsoletion) share the same "direct" treatment as DRT-0001
  // "Create Document Directly" once a document row is picked from their grid -- see onCellClicked,
  // SubmiteDocument, submitDisabledReason, and the shared card block in the template.
  get isRevisionOrObsoletion(): boolean {
    return this.selectedRequestType === 'DRT-0002' || this.selectedRequestType === 'DRT-0003';
  }

  // Single source of truth for both isSubmitDisabled and the message shown next to the Submit
  // button (see create-update-document.html) -- previously the button just went disabled with
  // no way for the user to tell WHICH of several possible requirements was still unmet (e.g.
  // Document Training being required for this Document Type, easy to miss since it's a whole
  // separate card above this one with no visual "required" marking of its own).
  get submitDisabledReason(): string | null {
    if (!this.selectedRequestType) return 'Please select an Activity Type.';
    if (!this.selectedDocumentType) return 'Please select a Document Type.';

    if (this.selectedRequestType === 'DRT-0001') {
      if (this.creationMode === 'request') {
        if (!this.selectedRequestId) return 'Please select a Request ID.';
      } else {
        // "Create Document Directly" -- no Request was ever selected, so Document Name has to
        // come from the user directly instead of being prefilled by onRequestIdChange.
        if (!this.documentName || !this.documentName.trim()) return 'Please enter a Document Name.';
        // Same "Please enter Justification" requirement the Document Request form enforces --
        // this mode is the direct-create equivalent of that form, so it carries the same one.
        if (!this.justification || !this.justification.trim()) return 'Please enter Justification.';
      }
    } else if (this.isRevisionOrObsoletion) {
      // Mirrors DRT-0001 "Create Document Directly" above -- picking a grid row (onCellClicked)
      // stands in for both the Request-ID selection and the typed Document Name, so only
      // Justification (a fresh reason for THIS revision/obsoletion) needs to be re-entered.
      if (!this.documentId) return 'Please select a document from the grid above.';
      if (!this.justification || !this.justification.trim()) return 'Please enter Justification.';
    }

    // Document content is mandatory for file-based templates (types 1 & 2) -- either an
    // uploaded file OR real content already in the rich text editor satisfies this (matches
    // the form's own "Upload... OR type the content manually below" wording). Previously this
    // only accepted a file, so a document that already had real content (e.g. loaded from an
    // existing document when revising, or typed with no file ever uploaded) stayed permanently
    // disabled even though there was nothing left for the user to actually do. Applies uniformly
    // to DRT-0003 too -- CreateBareDocumentForSubmissionAsync/AttachOrUpdateTemplateAsync treat
    // Obsoletion identically to Revision (a fresh child Document with its own content either way).
    if (this.selectedRequestType === 'DRT-0001' || this.isRevisionOrObsoletion) {
      if (this.selectedTemplateType !== '3') {
        if (!this.draftFileUrl && !this.draftFile && !this._hasRealContentCache) {
          return 'Please upload a document file, or add content in Document Content below.';
        }
      }
    }

    // Checked for Revision/Obsoletion as well, now that the Document Attributes card is shown
    // there. It used to be DRT-0001 only because that card was hidden for a revision, so
    // dynamicForm never got set and this check would have blocked Submit forever. With the card
    // mounted the same rule applies: the backend enforces mandatory attributes either way, and
    // catching it here tells the author which field is missing instead of failing on submit.
    if (this.selectedRequestType === 'DRT-0001' || this.isRevisionOrObsoletion) {
      if (this.attributes && this.attributes.length > 0) {
        if (!this.dynamicForm || this.dynamicForm.invalid) {
          return 'Please fill all required fields in Document Attributes.';
        }
      }
    }

    if (this.selectedRequestType === 'DRT-0001' || this.isRevisionOrObsoletion) {
      if (this.trainingRequired) {
        // The real requirement is just "at least one trainee assigned" -- selectedTrainingMode
        // is only the transient picker state AddTrainingUsers() uses to add ONE MORE row; it has
        // nothing to do with whether training is already satisfied. Checking it directly used to
        // work by coincidence (AddTrainingUsers() never clears it after a successful add, so it
        // stayed populated once anything had been added through that form). It broke as soon as
        // onCellClicked started prefilling trainingUsersData directly from the picked document's
        // existing assignment (see GetDocumentTrainingAssignments) -- that path never touches
        // selectedTrainingMode at all, so Submit stayed blocked even with real, already-assigned
        // trainees showing in the table.
        if (!this.trainingUsersData || this.trainingUsersData.length === 0) {
          return 'Training is required for this Document Type -- please select a Trainer/User and click + to add them.';
        }
      }
    }
    return null;
  }

  // "Workflow Authorities" preview merged with the this-document-only ad-hoc approver(s), so the
  // sequence shown here matches what SubmitDocumentAsync will actually build (policy-defined
  // steps first, ad-hoc appended after -- see EnsureAdHocApproverStepDefinitionAsync). Built as a
  // getter (not copied into a stored field) so it re-evaluates automatically whenever
  // approvalSequenceData is re-fetched or adHocApprovers changes, with no extra wiring needed.
  // Policy steps plus any ad-hoc approvers, as one list for the Workflow Authorities table.
  //
  // This is a plain field, rebuilt only when one of its two inputs changes -- deliberately NOT a
  // getter. As a getter it returned a freshly spread array on every call, and the template binds
  // it twice (the *ngIf and the @for). Every change-detection pass therefore built new arrays and
  // made @for re-diff a collection it had no way to recognise as unchanged -- doubled again by
  // dev mode running each pass twice to verify stability. With a keystroke in any field on this
  // page triggering that cycle, typing had become unusable (measured ~5s per keystroke).
  combinedWorkflowAuthorities: any[] = [];

  private rebuildCombinedWorkflowAuthorities(): void {
    const policySteps = this.approvalSequenceData || [];
    const adHocSteps = (this.adHocApprovers || []).map((a, idx) => ({
      StepOrder: policySteps.length + idx + 1,
      EmployeeCode: a.EmployeeCode,
      EmployeeName: a.EmployeeName,
      // The approver's actual job Role, resolved in AddAdHocApprover -- matches what this same
      // person's Role will show once the document is submitted (backend resolves it identically
      // in EnsureAdHocApproverStepDefinitionAsync), instead of a generic "Ad-hoc Approver" label
      // that said nothing about who they actually are.
      UserRole: a.Role,
    }));
    this.combinedWorkflowAuthorities = [...policySteps, ...adHocSteps];
  }

  // A rich-text editor with no real user content can still carry Quill's empty-state markup
  // (e.g. "<p><br></p>"), which is non-empty as a raw string but shows nothing to the user --
  // stripping tags and checking for actual leftover text avoids treating that as real content.
  private hasRealContent(html: string | null | undefined): boolean {
    if (!html) return false;
    // A document can legitimately be image-only (e.g. a scanned page, or content pasted into
    // the editor as a screenshot rather than typed) -- an <img> tag has no text of its own, so
    // stripping ALL tags before checking for leftover text incorrectly reported that as empty.
    // Confirmed against a real case: an approved Request's saved content was a single <img>
    // with a ~230KB base64 image and zero surrounding text, which this treated as "no content"
    // and kept Submit disabled even though real content already existed.
    if (/<img[\s>]/i.test(html)) return true;
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
    const newDocId = String(data?.documentId || data?.Id || data?.id || '');

    // AG-Grid's cellClicked fires once per cell, not once per row -- re-clicking within an
    // already-loaded row (or a stray second event for the same click) previously re-ran every
    // fetch below from scratch. Skip entirely when this row is already the one loaded.
    if (newDocId && newDocId === this.documentId && this.showDocumentContent) {
      return;
    }

    this.templateHtml = data?.proposedContent || '';
    this.draftFileUrl = data?.draftFileUrl || '';
    this.requestId = data?.requestId || data?.Id || data?.id || 0;
    this.documentName = data?.documentName || '';
    this.selectedDocumentType = data?.documentTypeCode || '';
    this.selectedTemplateType = data?.templateType?.toString() || '';
    this.showDocumentContent = true;

    // Full field parity with DRT-0001 "Create Document Directly": the document actually being
    // revised/obsoleted (ParentDocumentId for SubmiteDocument -- distinct from requestId above,
    // which historically doubled for this but is misleadingly named for this purpose), a fresh
    // Justification (a Revision/Obsoletion needs its own reason, not the original document's),
    // its Cabinet location (shown disabled/prefilled in the relocated Cabinet Filters card -- see
    // onHierarchyChange/[disabled]="isRevisionOrObsoletion" in the template), and its current
    // Distribution List / Document Users, prefilled from the same fields DRT-0001 direct-create
    // already uses so app-drusers-component/app-drdistribution-list need no changes.
    this.documentId = newDocId;
    this.justification = '';
    this.selectedDivisions = data?.divisionCode || '';
    this.selectedDepartment = data?.departmentId || data?.departmentCode || '';
    this.selectedSubDepartment = data?.subDepartmentCode || '';
    this.selectedBusinessDomain = data?.businessDomainCode || '';
    this.cabinetHierarchy = [
      { level: 1, title: '', value: this.selectedDivisions },
      { level: 2, title: '', value: this.selectedDepartment },
      { level: 3, title: '', value: this.selectedSubDepartment },
      { level: 4, title: '', value: this.selectedBusinessDomain },
    ].filter((c) => !!c.value) as CabinetSelection[];
    this.distributionListPayload = data?.distributionListPayload || [];
    this.distributionUserList = data?.distributionUserList || [];

    // Same "start from what's already there, let the user adjust" treatment for Document
    // Attributes and Training Users -- these were previously left blank on Revision/Obsoletion
    // even though the document being revised already has its own saved values/assignments.
    this.attributeValues = [];
    this.trainingUsersData = [];
    this.showTrainingUserTable = false;
    const docId = Number(this.documentId);
    if (docId) {
      this._documentAttributeService.getDocumentAttributeByDocumentId(docId).subscribe({
        next: (res) => {
          this.attributeValues = res?.Data || [];
        },
        error: () => {
          this.attributeValues = [];
        },
      });

      this._documentService.GetDocumentTrainingAssignments(docId).subscribe({
        next: (res) => {
          const modeName = (m: number) => (m === 1 ? 'Classroom' : m === 2 ? 'Online' : '');
          this.trainingUsersData = (res?.Data || []).map((t: any) => ({
            TrainingMode: modeName(t.TrainingMode),
            TrainerName: t.Role || '',
            UserName: t.EmployeeName?.trim() || t.EmployeeCode,
            TrainerCode: '',
            UserCode: t.EmployeeCode,
          }));
          this.showTrainingUserTable = this.trainingUsersData.length > 0;
        },
        error: () => {
          this.trainingUsersData = [];
          this.showTrainingUserTable = false;
        },
      });
    }

    if (this.selectedDocumentType) {
      // Training Policy / Attribute *definitions* / Review Policy are scoped to the Document
      // Type alone (unlike everything above, which is scoped to the specific document/row) --
      // the Revision/Obsoletion grids are usually filtered to one Document Type already, so
      // clicking between rows of that same type repeated these 3 network round trips for data
      // that couldn't have changed. Re-fetched only when the type actually differs from the last
      // row clicked. loadWorkflowAuthorities is NOT skipped -- it also depends on this row's own
      // Cabinet (just set above), which can differ between documents of the same type.
      if (this.selectedDocumentType !== this.lastLoadedAttributesDocumentType) {
        this.lastLoadedAttributesDocumentType = this.selectedDocumentType;
        this.CheckTrainingPolicy(this.selectedDocumentType);
        this.GetDocumentAttributes(this.selectedDocumentType);
        this.GetDocumentReviewPolicy();
      }
      this.loadWorkflowAuthorities(this.selectedDocumentType);
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
    // Same source as Revision. Obsoleting a document and revising one both act on a document
    // that is actually in force, so both grids ask the same question -- and their column
    // definitions are already identical, field for field.
    //
    // This used to call GetAllApprovedDocuments(), which asks get-document-by-status for
    // RequestStatus 'Approved'. APPROVED is a transient state on the way to EFFECTIVE, so the
    // grid was empty in practice: against the live data that query returns 0 documents while
    // this one returns 12.
    //
    // Like the Revision grid, this one has no (serverQuery) binding -- it is a plain
    // client-side grid that shows whatever rowData it is given, so the fetch has to be made
    // here or the loading spinner never clears.
    this.GetEffectiveDocumentsForRevision('');
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
      this.lastLoadedAttributesDocumentType = value;
      this.CheckTrainingPolicy(value);
      this.GetDocumentAttributes(value);
      this.GetAllApprovedRequests();
      this.loadWorkflowAuthorities(this.selectedDocumentType);
      this.GetDocumentReviewPolicy();
      this.GetTemplate(this.selectedDocumentType);
    } else {
      this.lastLoadedAttributesDocumentType = '';
      this.emptyFields();
    }
  }

  // Switching between "Use an Approved Request" and "Create Document Directly" changes what
  // identifies the document being worked on (an existing Request vs. a name the user types), so
  // anything resolved from the previous mode has to be cleared -- mirrors what
  // onDocumentTypeChange already does when the document type itself changes.
  onCreationModeChange(): void {
    this.selectedRequestId = '';
    this.documentId = '';
    this.documentName = '';
    this.templateHtml = '';
    this.draftFileUrl = '';
    this.draftFile = null;
    this.justification = '';
    this.distributionListPayload = [];
    this.distributionUserList = [];
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onDistributionChanged(list: any[]): void {
    this.distributionListPayload = list;
  }

  // Mirrors document-request-form.ts's appendUserIdsToFormData field resolution (DRUsersComponent
  // emits users tagged with whichever casing/shape the cabinet row they were picked under used).
  private buildUserIdsPayload(users: any[]): any[] {
    const getCode = (u: any) =>
      u.employeeCode || u.EmployeeCode || u.empcode || u.empid || u.userId || u.UserId || u.id || u.Id;

    return (users || [])
      .filter((u: any) => {
        const code = getCode(u);
        return code != null && code !== '';
      })
      .map((u: any) => ({
        employeeCode: String(getCode(u)),
        roleId: u.roleId ?? u.RoleId,
        divisionCode: u.divisionCode ?? u.DivisionCode,
        departmentCode: u.departmentCode ?? u.DepartmentCode,
        subDepartmentCode: u.subDepartmentCode ?? u.SubDepartmentCode,
        businessDomainCode: u.businessDomainCode ?? u.BusinessDomainCode,
      }));
  }

  loadWorkflowAuthorities(documentType: string) {
    if (!documentType) {
      this.approvalSequenceData = [];
      this.rebuildCombinedWorkflowAuthorities();
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
      this.rebuildCombinedWorkflowAuthorities();
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

      // No approved requests to pick from -- "Use an Approved Request" is disabled in the
      // template ([nzDisabled]="requestIds.length === 0") so the user can't click into an
      // empty dropdown, and this mirrors that by defaulting the mode to the only option that's
      // actually usable. Only forces the switch when currently on 'request': a user who already
      // chose 'direct' (e.g. for a prior Document Type with no requests either) keeps that
      // choice rather than being silently reset by every DocumentType change.
      if (this.requestIds.length === 0 && this.creationMode === 'request') {
        this.creationMode = 'direct';
        this.onCreationModeChange();
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

  // This-document-only approver, appended after the policy-resolved workflow sequence at submit
  // time -- see SubmiteDocument()'s adhocapprovers payload. Capped at exactly one entry (per
  // confirmed scope); the Add button is disabled once one exists (see the template), and
  // RemoveAdHocApprover exists specifically so a mis-pick doesn't trap the user under that cap.
  AddAdHocApprover(): void {
    if (!this.selectedAdHocApprover) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select an approver.',
      );
      return;
    }
    if (this.adHocApprovers.length > 0) {
      return;
    }

    // options labels are "Name (Code)" (see EmployeeList.getAllUsersList) -- strip the trailing
    // " (Code)" back off for a clean display name.
    const opt = this.adHocEmployeeListRef?.options.find((o) => o.value === this.selectedAdHocApprover);
    const name = opt?.label ? opt.label.replace(/\s*\([^)]*\)\s*$/, '') : this.selectedAdHocApprover;
    const employeeCode = this.selectedAdHocApprover;
    this.adHocApprovers.push({
      EmployeeCode: employeeCode,
      EmployeeName: name,
      // Placeholder until the actual lookup below resolves.
      Role: 'Ad-hoc Approver',
    });
    this.rebuildCombinedWorkflowAuthorities();
    this.selectedAdHocApprover = '';

    // Resolved separately (not blocking the Add click) so the Workflow Authorities preview
    // shows this person's actual job Role -- matches what the backend resolves identically at
    // submit time (DocumentComponent.EnsureAdHocApproverStepDefinitionAsync), instead of the
    // generic "Ad-hoc Approver" label that said nothing about who they actually are.
    this._peoplePartnerService.GetEmployeeRoleByCode(employeeCode).subscribe({
      next: (res) => {
        const role = res?.Data;
        if (!role) return;
        const entry = this.adHocApprovers.find((a) => a.EmployeeCode === employeeCode);
        if (entry) {
          entry.Role = role;
          this.adHocApprovers = [...this.adHocApprovers];
          this.rebuildCombinedWorkflowAuthorities();
        }
      },
      // Leave the placeholder Role in place on failure -- this preview cell just stays less
      // precise; nothing about actually submitting the document depends on this lookup.
      error: () => {},
    });
  }

  RemoveAdHocApprover(index: number): void {
    this.adHocApprovers.splice(index, 1);
    this.rebuildCombinedWorkflowAuthorities();
  }

  // Shared by SubmiteDocument and SaveAsDraft -- both send the exact same multipart payload and
  // differ only in which endpoint receives it (submit-document kicks off the approval workflow,
  // save-document-as-draft doesn't).
  private buildDocumentFormData(): FormData {
    const attributeValues = this.buildAttributePayload();
    // console.log(JSON.stringify(attributeValues));

    const trainingUsers = (this.trainingUsersData || []).map((user: any) => {
      const modeVal = user.TrainingMode === 'Classroom' ? 1 : (user.TrainingMode === 'Online' ? 2 : 0);
      return {
        trainingmode: modeVal,
        employeecode: user.UserCode || '',
      };
    });

    const adHocApprovers = (this.adHocApprovers || []).map((a) => ({
      employeecode: a.EmployeeCode,
    }));

    const payLoad: any = {
      attributes: attributeValues,
      trainingusers: trainingUsers,
      adhocapprovers: adHocApprovers,
    };

    // "Create Document Directly" (creationMode === 'direct', DRT-0001) and a direct
    // Revision/Obsoletion (DRT-0002/DRT-0003, picked straight from the grid -- no Request/
    // approval-to-create stage) both have no existing DocumentId to send: the backend creates a
    // Document itself when documentid is omitted (see DocumentComponent.SubmitDocumentAsync /
    // CreateBareDocumentForSubmissionAsync). Only the legacy request-driven DRT-0001 "Use an
    // Approved Request" path keeps sending documentid, exactly as it always has.
    const isDirectCreate = this.selectedRequestType === 'DRT-0001' && this.creationMode === 'direct';

    if (isDirectCreate || this.isRevisionOrObsoletion) {
      payLoad.documenttypecode = this.selectedDocumentType;
      payLoad.documentname = this.documentName;
      payLoad.divisioncode = this.selectedDivisions;
      payLoad.departmentcode = this.selectedDepartment;
      payLoad.subdepartmentcode = this.selectedSubDepartment;
      payLoad.businessdomaincode = this.selectedBusinessDomain;

      // Justification / Document Users / Distribution List -- parity with the Document Request
      // form (document-request-form.ts), only relevant here since 'request' mode already got
      // these promoted onto the Document when its Request was approved (see the property
      // comment on `justification` above).
      payLoad.justification = this.justification;
      payLoad.distributionlist = (this.distributionListPayload || []).map((x: any) => ({
        divisionCode: x.level1Id || x.divisionCode,
        departmentCode: x.level2Id || x.departmentCode,
        subDepartmentCode: x.level3Id || x.subDepartmentCode,
        businessDomainCode: x.level4Id || x.businessDomainCode,
        roleId: x.roleId,
        distributionTypeId: x.distributiontypeId || x.distributionTypeId,
      }));
      payLoad.userids = this.buildUserIdsPayload(this.distributionUserList);

      // Identifies which document is being revised/obsoleted -- see onCellClicked. The backend
      // creates a new child Document (ParentDocumentId = this) and transitions the parent's own
      // state to REVISED/OBSOLETE (CreateBareDocumentForSubmissionAsync /
      // TransitionParentDocumentStateAsync).
      if (this.isRevisionOrObsoletion) {
        payLoad.parentdocumentid = this.documentId;
        payLoad.activitytypecode = this.selectedRequestType;
      }

    } else {
      payLoad.documentid = this.documentId;
    }

    // Append the new draft file if it exists
    const formData = new FormData();
    Object.keys(payLoad).forEach((key) => {
      if (
        key === 'trainingusers' ||
        key === 'TrainingUsers' ||
        key === 'attributes' ||
        key === 'adhocapprovers' ||
        key === 'distributionlist' ||
        key === 'userids'
      ) {
        formData.append(key, JSON.stringify((payLoad as any)[key]));
      } else if ((payLoad as any)[key] !== undefined && (payLoad as any)[key] !== null) {
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

    return formData;
  }

  SubmiteDocument() {
    this.submitting = true;
    const formData = this.buildDocumentFormData();

    this._documentService.submitDocument(formData).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notificationToastService.createNotification(
            'success',
            'Document Create',
            response.Message,
          );
          // Every badge, not just this screen's: a workflow transition can empty one inbox and
          // fill a queue on a screen the user is not looking at.
          this._navigationCountsService.refreshAfterAction('Document Submitted');
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

  // Saves whatever has been filled in so far without starting the approval workflow, so the user
  // can come back to it from the "Document Draft" tab. Only the three fields the backend itself
  // requires to create the Document row at all (see CreateBareDocumentForSubmissionAsync) are
  // enforced here -- everything else is exactly what a draft is allowed to still be missing.
  // Mirrors the Document Request form's own DraftDocumentRequests() bar.
  SaveAsDraft(): void {
    if (!this.selectedDocumentType) {
      this._notificationToastService.createNotification(
        'warning',
        'Save as Draft',
        'Please select a Document Type.',
      );
      return;
    }
    if (!this.documentName?.trim()) {
      this._notificationToastService.createNotification(
        'warning',
        'Save as Draft',
        'Please enter a Document Name.',
      );
      return;
    }
    if (!this.justification?.trim()) {
      this._notificationToastService.createNotification(
        'warning',
        'Save as Draft',
        'Please enter a Justification.',
      );
      return;
    }

    this.savingDraft = true;
    const formData = this.buildDocumentFormData();

    this._documentService.saveDocumentAsDraft(formData).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notificationToastService.createNotification(
            'success',
            'Save as Draft',
            response.Message || 'Document saved as draft.',
          );
          // Every badge, not just this screen's: a workflow transition can empty one inbox and
          // fill a queue on a screen the user is not looking at.
          this._navigationCountsService.refreshAfterAction('Document Saved as Draft');
          // Same finish as SubmiteDocument: wipe the form, then reload so the page comes back in
          // a clean state with the Document Draft tab's badge count refreshed. Resuming a draft
          // is done from that tab, which repopulates every field.
          this.emptyFields();
          this.selectedRequestType = '';
          this.attributes = [];
          if (this.dynamicForm) {
            this.dynamicForm.reset();
          }
          setTimeout(() => {
            this.savingDraft = false;
            window.location.reload();
          }, 1000);
        } else {
          this.savingDraft = false;
        }
      },
      error: (err) => {
        this.savingDraft = false;
        let message = 'Something went wrong. Please try again.';
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }
        this._notificationToastService.createNotification('error', 'Save as Draft', message);
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
    if (ext !== 'docx') {
      this.convertingUploadedFile = false;
      return;
    }

    this.convertingUploadedFile = true;
    file
      .arrayBuffer()
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        this.templateHtml = result.value;
      })
      .catch((err) => {
        // Leave templateHtml empty -- the uploaded file is still fully valid for submission.
        // Previously silent, which made a failed preview look identical to "nothing to show".
        console.error('Failed to preview uploaded document content:', err);
        this._notificationToastService.createNotification(
          'warning',
          'Preview Unavailable',
          'Could not generate an in-form preview of the uploaded document. The file itself is still fine to submit.',
        );
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
    // dynamicForm is only ever set via app-dynamic-form-by-document-attribute's formReady. The
    // card now mounts for Revision/Obsoletion too, so this is no longer the normal path for a
    // revision -- but it stays as a guard for the moment before formReady fires, and for a
    // document type with no attributes configured at all. Without it, Submit threw outright.
    if (!this.dynamicForm) return result;
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
        // 'Document', not selectedEntityType. That field holds the workflow POLICY's entity type
        // ('Revision' while the Revision/Obsoletion grid is up), which is the right thing to send
        // to getWorkflowStepByDocumentTypeCode but not here: WorkflowExecutions.EntityType only
        // ever holds 'Document' or 'Request', so asking for 'Revision' matched no execution and
        // the modal came up empty every time.
        entityType: 'Document', // Sending Document because User needs to see the approval History of Document
        // Empty means every decision, which is what an approval HISTORY is. 'Approved' hid the
        // rejections and reworks -- the part of the history people usually open this to read.
        decision: '',
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
            divisionCode: item.DivisionCode,
            documentId: item.Id || item.id,
            documentNumber: item.documentNumber || item.DocumentNumber,
            documentName: item.DocumentName,
            proposedContent: item.ProposedContent,
            department: item.Department,
            departmentId: item.DepartmentCode,
            subdepartment: item.SubDepartment,
            subDepartmentCode: item.SubDepartmentCode,
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
    this.documentId = '';
    this.requestId = 0;
    this.draftFile = null;
    this.selectedRequestId = '';
    this.approvalSequenceData = [];
    this.rebuildCombinedWorkflowAuthorities();
    this.trainingUsersData = [];
    this.selectedTrainingMode = '';
    this.selectedRole = '';
    this.selectedUser = [];
    this.creationMode = 'request';
    this.adHocApprovers = [];
    this.rebuildCombinedWorkflowAuthorities();
    this.selectedAdHocApprover = '';
    this.justification = '';
    this.distributionListPayload = [];
    this.distributionUserList = [];
    this.attributeValues = [];
    this.lastLoadedAttributesDocumentType = '';
    this.cabinetHierarchy = [];
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
