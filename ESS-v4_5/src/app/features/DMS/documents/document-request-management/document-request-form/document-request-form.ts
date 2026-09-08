import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import * as mammoth from 'mammoth';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { CabinetSelection, ColumnToggle, SelectList } from '@app/shared/interfaces/interfaces';
import { DocumentRequestTypeService } from '@app/shared/services/document-request-type.service';
import { CompanyService } from '@app/shared/services/company.service';
import { DRDistributionList } from '../drdistribution-list/drdistribution-list';
import { DRUsersComponent } from '../drusers-component/drusers-component';
import { TemplateService } from '@app/shared/services/template.service';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { DocumentService } from '@app/shared/services/document.service';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { RevisionHistoryModal } from '../../revision-history-modal/revision-history-modal';
import { PermissionService } from '@app/shared/services/permission.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-document-request-form',
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
    NzInputModule,
    NzModalModule,
    DocumentTypeList,
    DRDistributionList,
    DRUsersComponent,
    DMSRichTextEdit,
    CabinetStructureList,
  ],
  templateUrl: './document-request-form.html',
  styleUrl: './document-request-form.css',
})
export class DocumentRequestForm {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() draftData: any;
  @Output() requestCreated = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;
  isSubmitting = false;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'requestdocumentcreation';

  selectedEntityType: string ='Request';
  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedBusinessDomain: string = '';
  selectedDocumentType: string = '';
  inputJustificationValue?: string;
  documentName?: string = '';
  templateHtml: string = '';
  originalContentHtml: string = '';
  selectedTemplateType: string = '';
  templateFileUrl: string = '';
  draftFileUrl: string = '';
  uploadedFile: File | null = null;
  // True while mammoth.js is converting a just-uploaded .docx to HTML for the content-preview
  // rich text editor (see onDraftFileSelected).
  convertingUploadedFile: boolean = false;
  displayDocumentType: string = '';
  displayDivision: string = '';
  displayDepartment: string = '';
  displaySubDepartment: string = '';
  displayBusinessDomain: string = '';
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

  
  documentId: number = 0;
  currentDocumentName: string = ''; 
  safeDraftFileUrl?: SafeResourceUrl;
  isPdf: boolean = false;
  isDocx: boolean = false;

  pageSize = 10;
  totalRows = 0;
  trainingContent: boolean = false;
  showExclusionTable = false;

  public noRowsOverlay: string = '';
  selectedCompany: string | null = null;
  selectedDocumentRequestType: string | null = null;
  showDocumentDiv: boolean = false;
  showDocumentCreationDiv: boolean = false;

  employees: any[] = [];
  selectedEmployee?: string = '';
  documentRequestsData: any[] = [];

  distributionListPayload: any[] = [];
  distributionUserList: any[] = [];
  selectedDocumentRow: any = null;

  companies: any[] = [];
  requestTypes: any[] = [];
  approvalSequenceData: any[] = [];

  filters: SelectList[] = [
    { CODE: '1', NAME: 'Over Due' },
    { CODE: '2', NAME: 'Less than 30 days' },
  ];

  selectedPageSize = 10;
  requestId: number = 0;
  submittedby: number = 0;
  loginEmpId: string = '';
  pageNumber = 1;

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subdepartment', label: 'Sub-Department' },
    4: { field: 'businessdomain', label: 'Business Domain' },
  };

  private readonly leadingColumnDefs: ColDef[] = [
    {
      field: 'requestId',
      headerName: 'requestId',
      hide: true,
    },
    {
      field: 'documentType',
      headerName: 'Document Type',
      cellEditor: 'agSelectCellEditor',
      pinned: 'left',
    },
    {
      field: 'documentNumber',
      headerName: 'Document Number',
      cellEditor: 'agSelectCellEditor',
      pinned: 'left',
    },
    {
      field: 'documentName',
      headerName: 'Document Name',
      cellEditor: 'agSelectCellEditor',
      pinned: 'left',
    },
    {
      field: 'version',
      headerName: 'Version',
      pinned: 'left', // ✅ now correctly typed
    },
  ];

  private readonly trailingColumnDefs: ColDef[] = [
    { field: 'nextReviewDate', headerName: 'Next Review Date' },
    {
      field: 'url',
      headerName: 'Url',
      editable: false,
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        return `
          <span
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
               View
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        this.openDocumentModal(event.data);
      },
    },
    { field: 'requestCreatedBy', headerName: 'Request Created By', cellClass: 'audit-cell', minWidth: 150 },
    { field: 'requestCreatedOn', headerName: 'Request Created On', cellClass: 'audit-cell', minWidth: 150 },
    {
      field: 'previousVersionCreatedBy',
      headerName: 'Previous Version Created  By',
      cellClass: 'audit-cell',
      minWidth: 150,
    },
    {
      field: 'previousVersionCreatedOn',
      headerName: 'Previous Version Created On',
      cellClass: 'audit-cell',
      minWidth: 150,
    },
    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      editable: false,
      minWidth: 120,
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
      minWidth: 120,
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

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out showing
  // just the leading/trailing columns until we know which cabinet levels are enabled.
  documentColumnDefs: ColDef[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs];

  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentNumber', label: 'Document Number', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'version', label: 'Version', visible: true },
    { field: 'nextReviewDate', label: 'Next Review Date', visible: true },
    { field: 'url', label: 'URL', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
    { field: 'revisionHistory', label: 'Revision History', visible: true },
  ];

  documentRevisionData: [] = [];

  constructor(
    private modal: NzModalService,
    private _documentRequestTypeService: DocumentRequestTypeService,
    private _companyService: CompanyService,
    private _notificationToastService: NotificationToastService, 
    private _doumentRequestService: DocumentRequestService,
    private _documentService: DocumentService,
    private _documentTemplateService: TemplateService,
    private _workflowStepService: WorkflowStepService,
    private _permissionService: PermissionService,
    private _cabinetHierarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit() {
    this.GetLoginEmpId();

    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.getAllDocumentRequestTypes();
      this.getAllCompanies();
    });

    // Only show Division/Department/Sub-Department/Business Domain columns on the
    // Revision/Obsoletion documents grid for cabinet levels that are currently Enabled
    // (CabinetLevel.isActive), labeled with whichever title is configured for that level.
    this._cabinetHierarchyService.loadDropdownHierarchy().subscribe((levels) => {
      const activeLevelDefs = levels
        .filter((level) => level.isActive && this.cabinetLevelFields[level.level])
        .map((level) => ({
          ...this.cabinetLevelFields[level.level],
          title: level.title,
        }));

      this.documentColumnDefs = [
        ...this.leadingColumnDefs,
        ...activeLevelDefs.map((def) => ({
          field: def.field,
          headerName: def.title,
          cellEditor: 'agSelectCellEditor',
        })),
        ...this.trailingColumnDefs,
      ];

      this.columnToggles = [
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentName', label: 'Document Name', visible: true },
        { field: 'version', label: 'Version', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'nextReviewDate', label: 'Next Review Date', visible: true },
        { field: 'url', label: 'URL', visible: true },
        { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
        { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
        { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
        { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
        { field: 'approvalHistory', label: 'Approval History', visible: true },
        { field: 'revisionHistory', label: 'Revision History', visible: true },
      ];
    });
  }

  GetLoginEmpId() {
    this.loginEmpId = localStorage.getItem('HRISEmpId') || '';
  }

  onRequestTypeChange(value: string | null): void {
    const currentCompany = this.selectedCompany; // Preserve company selection if already chosen
    this.emptyFields(); // Clears out all the form fields, grids, and selections

    this.selectedDocumentRequestType = value;
    this.selectedCompany = currentCompany;
    
    if (this.selectedDocumentRequestType == '1' || this.selectedDocumentRequestType == 'DRT-0001') {
      this.showDocumentCreationDiv = true;
      this.showDocumentDiv = false;
      this.selectedEntityType ='Request';
    } else if (this.selectedDocumentRequestType == '2' || this.selectedDocumentRequestType == 'DRT-0002') {
      this.showDocumentDiv = true;
      this.selectedEntityType ='Revision';
      this.GetEffectiveDocumentsForRevision('');
      this.showDocumentCreationDiv = true;      
    } else {
      this.selectedEntityType ='Revision';
      this.showDocumentDiv = true; // show document grid on obseletion as well.
      // Without this, switching directly from a type that already shows this grid (e.g.
      // Revision) to Obsoletion never remounts <app-ag-grid-wrapper> (showDocumentDiv flips
      // false->true synchronously within emptyFields()+this branch, so Angular's *ngIf never
      // observes an intermediate unmount) — AG Grid's one-time automatic first load never
      // re-fires, rowData never gets reassigned, and the wrapper's loading spinner never clears.
      this.GetEffectiveDocumentsForRevision('');
      this.showDocumentCreationDiv = true;
    }
  }

  onCompanyChange(value: string | null) {
    this.selectedCompany = value;
  }

  loadWorkflowAuthorities(documentType: string) {
    if (!documentType) {
      this.approvalSequenceData = [];
      this.showExclusionTable = false;
      return;
    }

    const payLoad = {
      EntityType: this.selectedEntityType, //'Request',
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

  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.templateHtml = '';
    this.draftFileUrl = '';
    this.uploadedFile = null;
    this.templateFileUrl = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    if (value != null && value !== '') {
      this.selectedDocumentType = value;

      //Get Template
      this.GetTemplate(this.selectedDocumentType);

      this.loadWorkflowAuthorities(this.selectedDocumentType);
    } else {
      this.approvalSequenceData = [];
      this.selectedDocumentType = '';
      this.showExclusionTable = false;
    }
  }

  get isRevisionRequestType(): boolean {
    return (
      this.selectedDocumentRequestType == '2' || this.selectedDocumentRequestType == 'DRT-0002'
    );
  }

  get draftButtonLabel(): string {
    return this.isRevisionRequestType ? 'Submit Revision' : 'Draft';
  }

  get submitDisabledReason(): string | null {
    if (this.isSubmitting) return null;
    if (this.isRevisionRequestType && !this.selectedDocumentRow)
      return 'Please select an existing document to revise.';
    if (!this.selectedDocumentType) return 'Please select a Document Type to continue.';
    if (!this.selectedTemplateType)
      return 'No template has been uploaded for this Document Type. Please upload a template before creating a request.';
    return null;
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

  onDistributionChanged(list: any[]) {
    this.distributionListPayload = list;
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? '';
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? '';
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? '';
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? '';

    if (this.selectedDocumentType) {
      this.loadWorkflowAuthorities(this.selectedDocumentType);
    }
  }

  getAllCompanies = () => {
    this._companyService.getCompanyList().subscribe((res) => {
      if (res) {
        this.companies = (res.Data ?? [])
          .map((d: any) => ({
            id: d.Id,
            text: d.Value,
          }))
          .sort((a: any, b: any) => (a.text || '').localeCompare(b.text || ''));
      } else {
        this.companies = [];
      }
    });
  };

  getAllDocumentRequestTypes = () => {
    this._documentRequestTypeService.getDocumentTypeList().subscribe((res) => {
      if (res) {
        this.requestTypes = (res.Data ?? [])
          .map((d: any) => ({
            id: d.Code,
            text: d.Value,
          }))
          .sort((a: any, b: any) => (a.text || '').localeCompare(b.text || ''));
      } else {
        this.requestTypes = [];
      }
    });
  };

  // existingDocumentUrl: the document actually being revised (row.DocumentURL from
  // onCellClicked), as opposed to templateFileUrl below (the Document Type's blank template).
  // For a Revision these are two different files -- "Download Existing Document" downloading
  // the blank template instead of the document under revision was exactly this mix-up.
  GetTemplate(value: string, isRevision: boolean = false, existingDocumentUrl: string = '') {
    this._documentTemplateService.getTemplateByDocumentTypeCode(value).subscribe({
      next: (response: any) => {
        if (!response?.Success || !response?.Data || Object.keys(response.Data).length === 0) {
          this.selectedTemplateType = '';
          this.templateFileUrl = '';
          // A revision keeps the document's own file/content regardless of the Document Type's
          // template state -- the document being revised still exists and is still downloadable
          // even if its type's template was since removed.
          if (!isRevision) {
            this.draftFileUrl = '';
            this.templateHtml = ''; // Clear only if not a revision and no data
          }
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

        // Handle content based on TemplateType
        if (this.selectedTemplateType === '3') {
          // For HTML templates: a revision already has its own saved content (row.proposedContent,
          // set by the caller before this runs) -- keep that instead of overwriting it with the
          // Document Type's default template content, which is what a brand-new request should see.
          this.templateHtml = isRevision
            ? this.templateHtml
            : response.Data?.TemplateContent || response.Data?.templateContent || '';
          this.draftFileUrl = ''; // Ensure no file URL is present
        } else if (this.selectedTemplateType === '1' || this.selectedTemplateType === '2') {
          // For DOCX/PDF templates: a revision downloads/edits the document's OWN file, not the
          // Document Type's blank template -- only fall back to the template if this document
          // somehow has no file of its own.
          this.draftFileUrl = isRevision && existingDocumentUrl ? existingDocumentUrl : this.templateFileUrl;
          // Left as whatever onCellClicked / the mammoth preview already populated (row content,
          // or a client-side conversion of the document's own file) rather than cleared here.
          if (!isRevision) {
            this.templateHtml = '';
          }
        } else {
          // Fallback for other cases or if template type is not set
          if (!isRevision) {
            this.draftFileUrl = '';
            this.templateHtml = '';
          }
        }
      },
      error: (err) => {
        this.selectedTemplateType = '';
        this.templateFileUrl = '';
        if (!isRevision) {
          this.draftFileUrl = '';
          this.templateHtml = '';
        }
        console.error(err);
      },
    });

    if (value === 'Select') {
      this.trainingContent = true;
    }
  }

  downloadTemplate(): void {
    if (!this.selectedDocumentType) {
      this._notificationToastService.createNotification(
        'warning',
        'Template',
        'Please select a Document Type first.',
      );
      return;
    }

    this._documentTemplateService
      .DownloadTemplateByDocumentTypeCode(this.selectedDocumentType)
      .subscribe({
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
              blob.text().then((text) => {
                try {
                  const res = JSON.parse(text);
                  this._notificationToastService.createNotification(
                    'warning',
                    'Template',
                    res.Message || 'Template not available.',
                  );
                } catch {
                  this._notificationToastService.createNotification(
                    'error',
                    'Template',
                    'Failed to read response.',
                  );
                }
              });
              return;
            }

            let filename = `Template_${this.selectedDocumentType}`;
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
            const url =
              typeof response?.Data === 'string'
                ? response.Data
                : response?.Data?.TemplateFileUrl ||
                  response?.Data?.TemplateFileURL ||
                  response?.Data?.templateFileUrl ||
                  this.templateFileUrl;
            if (url) {
              window.open(url, '_blank');
            } else {
              this._notificationToastService.createNotification(
                'warning',
                'Template',
                'No file template available for download.',
              );
            }
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
                  'Template',
                  res.Message || 'Failed to download template.',
                );
              } catch {
                this._notificationToastService.createNotification(
                  'error',
                  'Template',
                  'Failed to download template.',
                );
              }
            });
          } else {
            console.error('Error downloading template', err);
            this._notificationToastService.createNotification(
              'error',
              'Template',
              err?.error?.Message || err?.Message || 'Failed to download template.',
            );
          }
        },
      });
  }

  onDraftFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      this.uploadedFile = null;
      return;
    }

    const file = fileList[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const expectedExt = this.expectedTemplateExtension;

    if (expectedExt && ext !== expectedExt) {
      this._notificationToastService.createNotification(
        'warning',
        'Invalid File',
        `The document template is a .${expectedExt} file. Please upload a matching .${expectedExt} file.`,
      );
      event.target.value = '';
      this.uploadedFile = null;
      return;
    }

    this.uploadedFile = file;
    this.previewUploadedFileContent(file);
  }

  // Bumped by every previewUploadedFileContent/previewExistingDocumentContent call and captured
  // at the start of each -- these are two independent async conversions (a freshly-picked local
  // file vs. fetching the document-under-revision's own file) that can legitimately overlap:
  // selecting a document to revise kicks off the latter, and the user can pick a *different*
  // file to upload before it resolves. Without this guard, whichever conversion finished last
  // silently won and could overwrite the other's (correct, more recent) result -- e.g. a fresh
  // upload's converted content getting clobbered back to the old document's content once that
  // slower network fetch finally resolved.
  private contentPreviewToken = 0;

  // Converts the uploaded .docx to HTML client-side (mammoth.js) so its formatted content shows
  // up in the rich text editor for review/editing -- see the template's "Content Preview"
  // section. Only .docx is supported (mammoth doesn't read legacy .doc); anything else just
  // leaves templateHtml empty, so only the original file participates in the download-time merge
  // for those, exactly as before this feature. Never blocks the actual upload/submit on failure --
  // this only affects the in-form preview.
  private previewUploadedFileContent(file: File): void {
    const token = ++this.contentPreviewToken;
    this.templateHtml = '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'docx') return;

    this.convertingUploadedFile = true;
    file
      .arrayBuffer()
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        if (token !== this.contentPreviewToken) return; // superseded by a newer selection
        this.templateHtml = result.value;
      })
      .catch(() => {
        // Leave templateHtml empty -- the uploaded file is still fully valid for submission.
      })
      .finally(() => {
        if (token === this.contentPreviewToken) {
          this.convertingUploadedFile = false;
        }
      });
  }

  DraftDocumentRequests() {
    if (!this.selectedDocumentRequestType) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select an Document Request Type.',
      );
      return;
    }
    if (!this.selectedCompany) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Company.',
      );
      return;
    }
    if (!this.documentName || this.documentName.trim() === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please enter Document Name.',
      );
      return;
    }
    if (!this.selectedDocumentType) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Document Type.',
      );
      return;
    }
    if (!this.inputJustificationValue) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please enter Justification.',
      );
      return;
    }
    if (!this.selectedTemplateType) {
      this._notificationToastService.createNotification(
        'warning',
        'Template Missing',
        'Please first upload the template against this Document Type.',
      );
      return;
    }
    // if (!this.selectedDivisions) {
    //   this._notificationToastService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select a Division.',
    //   );
    //   return;
    // }
    // if (!this.selectedDepartment) {
    //   this._notificationToastService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select a Department.',
    //   );
    //   return;
    // }
    // if (!this.selectedSubDepartment) {
    //   this._notificationToastService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select a Sub Department.',
    //   );
    //   return;
    // }
    // if (!this.selectedBusinessDomain) {
    //   this._notificationToastService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select a Business Domain.',
    //   );
    //   return;
    // }

    const cleanDistributionList = this.distributionListPayload.map((x: any) => ({
      divisionCode: x.level1Id || x.divisionCode,
      departmentCode: x.level2Id || x.departmentCode,
      subDepartmentCode: x.level3Id || x.subDepartmentCode,
      businessDomainCode: x.level4Id || x.businessDomainCode,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId || x.distributionTypeId,
    }));

    const formData = new FormData();
    formData.append('CompanyId', this.selectedCompany || '');
    formData.append('DocumentRequestTypeCode', this.selectedDocumentRequestType || '');
    if (this.selectedDocumentType) formData.append('documentTypeCode', this.selectedDocumentType);
    if (this.documentName) formData.append('documentName', this.documentName);
    if (this.inputJustificationValue)
      formData.append('justification', this.inputJustificationValue);
    if (this.templateHtml) formData.append('proposedContent', this.templateHtml);
    if (this.selectedDivisions) formData.append('divisionCode', this.selectedDivisions);
    if (this.selectedDepartment) formData.append('departmentCode', this.selectedDepartment);
    if (this.selectedSubDepartment)
      formData.append('subDepartmentCode', this.selectedSubDepartment);
    if (this.selectedBusinessDomain)
      formData.append('businessDomainCode', this.selectedBusinessDomain);

    cleanDistributionList.forEach((item: any, index: number) => {
      if (item.divisionCode)
        formData.append(`DistributionList[${index}].divisionCode`, item.divisionCode);
      if (item.departmentCode)
        formData.append(`DistributionList[${index}].departmentCode`, item.departmentCode);
      if (item.subDepartmentCode)
        formData.append(`DistributionList[${index}].subDepartmentCode`, item.subDepartmentCode);
      if (item.businessDomainCode)
        formData.append(`DistributionList[${index}].businessDomainCode`, item.businessDomainCode);
      if (item.roleId) formData.append(`DistributionList[${index}].roleId`, item.roleId.toString());
      if (item.distributionTypeId)
        formData.append(
          `DistributionList[${index}].distributionTypeId`,
          item.distributionTypeId.toString(),
        );
    });

    this.appendUserIdsToFormData(formData, this.distributionUserList);

    if (this.uploadedFile) {
      formData.append('DraftFile', this.uploadedFile);
    }

    this.isSubmitting = true;
    this._doumentRequestService.CreateDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response?.Success) {
          //clear all fields
          this.emptyFields();
          this.requestCreated.emit();
          this._doumentRequestService.refreshCounts$.next();

          this._notificationToastService.createNotification(
            'success',
            'Document Request',
            'Document drafted successfully!',
          );
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to draft document.',
        );
      },
    });
  }

  SubmitDocumentRequests() {
    if (!this.selectedDocumentRequestType) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Request Type.',
      );
      return;
    }
    if (!this.selectedCompany) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Company.',
      );
      return;
    }
    if (!this.documentName || this.documentName.trim() === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please enter Document Name.',
      );
      return;
    }
    if (!this.selectedDocumentType) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Document Type.',
      );
      return;
    }
    if (!this.inputJustificationValue || this.inputJustificationValue.trim() === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please enter Justification.',
      );
      return;
    }

    if (!this.selectedTemplateType) {
      this._notificationToastService.createNotification(
        'warning',
        'Template Missing',
        'Please first upload the template against this Document Type.',
      );
      return;
    }

    // UC-22: Revision Validation Checks
    if (this.selectedDocumentRequestType == '2' || this.selectedDocumentRequestType == 'DRT-0002') {
      if (!this.selectedDocumentRow) {
        this._notificationToastService.createNotification(
          'warning',
          'Validation',
          'Please select an existing document to revise.',
        );
        return;
      }
    }

    const cleanDistributionList = this.distributionListPayload.map((x: any) => ({
      divisionCode: x.level1Id || x.divisionCode,
      departmentCode: x.level2Id || x.departmentCode,
      subDepartmentCode: x.level3Id || x.subDepartmentCode,
      businessDomainCode: x.level4Id || x.businessDomainCode,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId || x.distributionTypeId,
    }));

    // if (
    //   (this.selectedTemplateType === '1' || this.selectedTemplateType === '2') &&
    //   !this.uploadedFile
    // ) {
    //   this._notificationToastService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please upload your drafted document before submitting.',
    //   );
    //   return;
    // }

    const formData = new FormData();
    formData.append('CompanyId', this.selectedCompany || '');
    formData.append('DocumentRequestTypeCode', this.selectedDocumentRequestType || '');
    if (this.selectedDocumentType) formData.append('documentTypeCode', this.selectedDocumentType);
    if (this.documentName) formData.append('documentName', this.documentName);
    if (this.inputJustificationValue)
      formData.append('justification', this.inputJustificationValue);
    if (this.templateHtml) formData.append('proposedContent', this.templateHtml);
    if (this.selectedDivisions) formData.append('divisionCode', this.selectedDivisions);
    if (this.selectedDepartment) formData.append('departmentCode', this.selectedDepartment);
    if (this.selectedSubDepartment)
      formData.append('subDepartmentCode', this.selectedSubDepartment);
    if (this.selectedBusinessDomain)
      formData.append('businessDomainCode', this.selectedBusinessDomain);

    cleanDistributionList.forEach((item: any, index: number) => {
      if (item.divisionCode)
        formData.append(`DistributionList[${index}].divisionCode`, item.divisionCode);
      if (item.departmentCode)
        formData.append(`DistributionList[${index}].departmentCode`, item.departmentCode);
      if (item.subDepartmentCode)
        formData.append(`DistributionList[${index}].subDepartmentCode`, item.subDepartmentCode);
      if (item.businessDomainCode)
        formData.append(`DistributionList[${index}].businessDomainCode`, item.businessDomainCode);
      if (item.roleId) formData.append(`DistributionList[${index}].roleId`, item.roleId.toString());
      if (item.distributionTypeId)
        formData.append(
          `DistributionList[${index}].distributionTypeId`,
          item.distributionTypeId.toString(),
        );
    });

    this.appendUserIdsToFormData(formData, this.distributionUserList);

    if (this.uploadedFile) {
      formData.append('DraftFile', this.uploadedFile);
    }

    this.isSubmitting = true;
    this._doumentRequestService.CreateAndSubmitDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response?.Success) {
          //clear all fields
          this.emptyFields();
          this.requestCreated.emit();
          this._doumentRequestService.refreshCounts$.next();
          this._notificationToastService.createNotification(
            'success',
            'User',
            'Document Request submitted successfully!',
          );
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to submit document.',
        );
      },
    });
  }

  SubmiteRevisionDocumentRequests() {
    // The document the user picked from the "existing documents" grid is what's being revised.
    // Its own Id must travel to the backend as ParentDocumentId — it must NOT be confused with
    // selectedDocumentRow.requestId, which is the ORIGINAL Creation request's Id and would just
    // resubmit that already-approved request instead of creating a new revision.
    if (!this.selectedDocumentRow || !this.selectedDocumentRow.Id) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select an existing document to revise.',
      );
      return;
    }
    if (!this.selectedCompany) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Company.',
      );
      return;
    }
    if (!this.documentName || this.documentName.trim() === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please enter Document Name.',
      );
      return;
    }
    if (!this.inputJustificationValue || this.inputJustificationValue.trim() === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please enter Justification.',
      );
      return;
    }

    const cleanDistributionList = this.distributionListPayload.map((x: any) => ({
      divisionCode: x.level1Id || x.divisionCode,
      departmentCode: x.level2Id || x.departmentCode,
      subDepartmentCode: x.level3Id || x.subDepartmentCode,
      businessDomainCode: x.level4Id || x.businessDomainCode,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId || x.distributionTypeId,
    }));

    const formData = new FormData();
    formData.append('CompanyId', this.selectedCompany || '');
    formData.append('DocumentRequestTypeCode', this.selectedDocumentRequestType || '');
    formData.append('ParentDocumentId', String(this.selectedDocumentRow.Id));
    if (this.selectedDocumentType) formData.append('documentTypeCode', this.selectedDocumentType);
    if (this.documentName) formData.append('documentName', this.documentName);
    if (this.inputJustificationValue)
      formData.append('justification', this.inputJustificationValue);
    if (this.templateHtml) formData.append('proposedContent', this.templateHtml);
    if (this.selectedDivisions) formData.append('divisionCode', this.selectedDivisions);
    if (this.selectedDepartment) formData.append('departmentCode', this.selectedDepartment);
    if (this.selectedSubDepartment)
      formData.append('subDepartmentCode', this.selectedSubDepartment);
    if (this.selectedBusinessDomain)
      formData.append('businessDomainCode', this.selectedBusinessDomain);

    cleanDistributionList.forEach((item: any, index: number) => {
      if (item.divisionCode)
        formData.append(`DistributionList[${index}].divisionCode`, item.divisionCode);
      if (item.departmentCode)
        formData.append(`DistributionList[${index}].departmentCode`, item.departmentCode);
      if (item.subDepartmentCode)
        formData.append(`DistributionList[${index}].subDepartmentCode`, item.subDepartmentCode);
      if (item.businessDomainCode)
        formData.append(`DistributionList[${index}].businessDomainCode`, item.businessDomainCode);
      if (item.roleId) formData.append(`DistributionList[${index}].roleId`, item.roleId.toString());
      if (item.distributionTypeId)
        formData.append(
          `DistributionList[${index}].distributionTypeId`,
          item.distributionTypeId.toString(),
        );
    });

    this.appendUserIdsToFormData(formData, this.distributionUserList);

    if (this.uploadedFile) {
      formData.append('DraftFile', this.uploadedFile);
    }

    this.isSubmitting = true;
    this._doumentRequestService.CreateAndSubmitRevisionDocumentRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response?.Success) {
          this.emptyFields();
          this.requestCreated.emit();
          this._doumentRequestService.refreshCounts$.next();
          this._notificationToastService.createNotification(
            'success',
            'Document Request',
            'Revision submitted successfully!',
          );
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to submit revision.',
        );
      },
    });
  }

  // Sends each selected employee tagged with the Role + Cabinet row it came from (backend
  // now persists these on DocumentRequestUserDistributions), not just a bare employee code --
  // without this, reopening the request has no way to rebuild the "Document Users" grid rows.
  private appendUserIdsToFormData(formData: FormData, users: any[]): void {
    const getCode = (u: any) =>
      u.employeeCode || u.EmployeeCode || u.empcode || u.empid || u.userId || u.UserId || u.id || u.Id;

    const filtered = (users || []).filter((u: any) => {
      const code = getCode(u);
      return code != null && code !== '';
    });

    filtered.forEach((u: any, index: number) => {
      formData.append(`UserIds[${index}].employeeCode`, String(getCode(u)));

      const roleId = u.roleId ?? u.RoleId;
      if (roleId != null) formData.append(`UserIds[${index}].roleId`, String(roleId));

      const divisionCode = u.divisionCode ?? u.DivisionCode;
      if (divisionCode) formData.append(`UserIds[${index}].divisionCode`, divisionCode);

      const departmentCode = u.departmentCode ?? u.DepartmentCode;
      if (departmentCode) formData.append(`UserIds[${index}].departmentCode`, departmentCode);

      const subDepartmentCode = u.subDepartmentCode ?? u.SubDepartmentCode;
      if (subDepartmentCode) formData.append(`UserIds[${index}].subDepartmentCode`, subDepartmentCode);

      const businessDomainCode = u.businessDomainCode ?? u.BusinessDomainCode;
      if (businessDomainCode) formData.append(`UserIds[${index}].businessDomainCode`, businessDomainCode);
    });
  }

  emptyFields() {
    this.selectedDocumentRequestType = null;
    this.selectedCompany = '';
    this.documentName = '';
    this.inputJustificationValue = '';
    this.selectedDocumentType = '';
    this.selectedDivisions = '';
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.selectedBusinessDomain = '';
    this.templateHtml = '';
    this.originalContentHtml = '';
    this.selectedTemplateType = '';
    this.templateFileUrl = '';
    this.draftFileUrl = '';
    this.uploadedFile = null;
    this.displayDocumentType = '';
    this.displayDivision = '';
    this.displayDepartment = '';
    this.displaySubDepartment = '';
    this.displayBusinessDomain = '';
    this.distributionListPayload = [];
    this.distributionUserList = [];
    this.selectedDocumentRow = null;
    this.showDocumentDiv = false;
    this.showDocumentCreationDiv = false;
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

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
  }

  downloadDraftTemplate(): void {
    if (!this.draftFileUrl) {
      this._notificationToastService.createNotification(
        'warning',
        'Download',
        'No existing document available for download.',
      );
      return;
    }

    // window.open() just navigates to the URL — for file types the browser knows how to
    // render (PDF, images) that opens an inline viewer instead of downloading. Fetching the
    // file ourselves and driving the save through a Blob + <a download> forces an actual
    // download regardless of content type, matching downloadTemplate()/downloadDraft() below.
    fetch(this.draftFileUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then((blob) => {
        let filename = `Document_${this.selectedDocumentType || 'template'}`;
        try {
          const decoded = decodeURIComponent(this.draftFileUrl);
          const last = decoded.split('?')[0].split('#')[0].split('/').pop();
          if (last) filename = last;
        } catch {
          // keep the fallback filename
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        this._notificationToastService.createNotification(
          'error',
          'Download',
          'Failed to download the existing document.',
        );
      });
  }

  
  openDocumentModal(rowData: any) {
    this.templateHtml = rowData.proposedContent || '';
    this.documentId = rowData.Id;
    this.currentDocumentName = rowData.documentName || rowData.DocumentName || '';
    let fileUrl = rowData.url || '';

    if (fileUrl && fileUrl.trim()) {
      // This logic is incorrect as it prepends the API base URL.
      // The correct logic uses window.location.origin.
      if (!fileUrl.startsWith('http')) {
        const origin = window.location.origin;
        const relativeUrl = fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl;
        fileUrl = origin + relativeUrl;
      }
      this.draftFileUrl = fileUrl;
    } else {
      this.draftFileUrl = '';
    }

    this.isPdf = false;
    this.isDocx = false;
    this.safeDraftFileUrl = undefined;

    if (this.draftFileUrl) {
      // A real file exists -- download it directly instead of routing through a modal
      // whose only content in that case was a "Download Document" button.
      this.downloadDraft();
      return;
    }

    this.modal.create({
      nzTitle: 'Document Content',
      nzContent: this.documentModalTpl,
      nzFooter: null,
      nzWidth: '50%',
      nzStyle: { top: '20px' },
    });
  }

  downloadDraft(): void {
    const idToDownload = this.documentId;
    this._documentService.DownloadDocumentTemplate(idToDownload).subscribe({
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
            blob.text().then((text) => {
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

          let filename = `Draft_${this.currentDocumentName || this.documentId}`;
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
            requestId: item.RequestId || item.requestId,
            companyId: item.companyId || item.CompanyId,
            company: item.Company || item.company,
            documentNumber: item.DocumentNumber || item.documentNumber,
            documentTypeCode: item.DocumentTypeCode || item.documenttypecode,
            documentType: item.DocumentType || item.documenttype,
            stepId: item.StepId || item.stepId,
            stepOrder: item.StepOrder || item.stepOrder,
            startedAt: item.StartedAt || item.startedAt,
            division: item.Division || item.division,
            divisionCode: item.DivisionCode || item.divisionCode || item.divisioncode,
            documentName: item.DocumentName || item.documentname || item.title,
            proposedContent: item.ProposedContent || item.proposedcontent || item.content,
            department: item.Department || item.department,
            departmentCode: item.DepartmentCode || item.departmentCode || item.departmentcode,
            subdepartment: item.SubDepartment || item.subdepartment,
            subDepartmentCode:
              item.SubDepartmentCode || item.subDepartmentCode || item.subdepartmentcode,
            justification: item.Justification || item.justification,
            businessdomain: item.BusinessDomain || item.businessDomain || item.businessdomain,
            businessDomainCode:
              item.BusinessDomainCode || item.businessDomainCode || item.businessdomaincode,
            pendingWith: item.CurrentAssignedUser || item.currentassigneduser,
            sumbittedby: item.CreatedBy || item.createdby,
            status: item.IsReworked ? 'Reverted' : 'Draft',
            createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdat || ''),
            requestCreatedOn: new CustomDateFormatPipe().transform(
              item.CreatedAt || item.createdat || '',
            ),
            requestCreatedBy: item.CreatedByName || item.createdByName,
            // previousVersionCreatedBy: item.LastModifiedByName || item.lastmodifiedbyname,
            previousVersionCreatedOn: new CustomDateFormatPipe().transform(
              item.draftContentLastModifiedAt ||
                item.DraftContentLastModifiedAt ||
                item.lastmodifiedat ||
                '',
            ),
            version: item.Version || item.version || item.RowVersion || item.rowVersion,
            nextReviewDate: new CustomDateFormatPipe().transform(
              item.NextReviewDate || item.nextreviewdate || '',
            ),
            url: item.DocumentURL || item.documenturl,
            proposedVersionNumber: item.RowVersion || item.rowVersion || item.version,
            templateType: item.TemplateType || item.templateType,
            templateFileUrl:
              item.TemplateFileUrl || item.TemplateFileURL || item.templateFileUrl || '',
            draftFileUrl:
              item.DraftFileUrl ||
              item.draftfileurl ||
              item.draftFileUrl ||
              item.TemplateFileUrl ||
              item.TemplateFileURL ||
              item.templateFileUrl ||
              (String(item.TemplateType || item.templateType) === '1' ||
              String(item.TemplateType || item.templateType) === '2'
                ? item.ProposedContent || item.proposedcontent
                : ''),
            // Map backend fields back to the frontend keys expected by the component
            distributionListPayload: (item.DistributionList || item.distributionList || []).map(
              (x: any) => ({
                ...x,
                level1Id: x.divisionCode || x.DivisionCode || x.level1Id,
                level2Id: x.departmentCode || x.DepartmentCode || x.level2Id,
                level3Id: x.subDepartmentCode || x.SubDepartmentCode || x.level3Id,
                level4Id: x.businessDomainCode || x.BusinessDomainCode || x.level4Id,
                roleId: x.roleId || x.RoleId,
                distributiontypeId:
                  x.distributionTypeId || x.DistributionTypeId || x.distributiontypeId,
              }),
            ),
            distributionUserList: item.UserList || item.userList || [],
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
          err?.error?.Message || err?.Message || 'Failed to fetch draft documents.',
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

  onCellClicked(event: any): void {
    const row = event.data;
    this.selectedDocumentRow = row;

    this.requestId = row.RequestId || row.requestId;
    this.submittedby = row.submittedBy || row.sumbittedby;
    this.selectedCompany = row.companyId || row.company;
    // ✅ Populate form fields
    this.documentName = row.documentName || row.title || '';
    this.inputJustificationValue = row.justification;
    this.templateHtml = row.proposedContent || row.content || '';
    this.originalContentHtml = row.proposedContent || row.content || '';

    this.selectedTemplateType = row.templateType?.toString() || '';
    this.templateFileUrl = row.templateFileUrl || '';
    // The row's actual field is "DocumentURL" (see the document being revised's own record) --
    // "draftFileUrl"/"url" don't exist on it, so this always evaluated to '' before, silently
    // losing the document's own file and leaving GetTemplate() to fall back to the Document
    // Type's blank template for both download and (previously) the content preview.
    const existingDocumentUrl: string =
      row.DocumentURL || row.documenturl || row.draftFileUrl || row.url || '';
    this.draftFileUrl = existingDocumentUrl;

    this.displayDocumentType = row.documentType || '';
    this.displayDivision = row.division || '';
    this.displayDepartment = row.department || '';
    this.displaySubDepartment = row.subdepartment || row.subDepartment || '';
    this.displayBusinessDomain = row.businessdomain || row.businessDomain || '';

    this.selectedDocumentType = row.documentTypeCode || row.documentType;
    this.selectedDivisions = row.divisionCode || row.level1Id || row.division;
    this.selectedDepartment = row.departmentCode || row.level2Id || row.department;
    this.selectedSubDepartment = row.subDepartmentCode || row.level3Id || row.subdepartment;
    this.selectedBusinessDomain = row.businessDomainCode || row.level4Id || row.businessdomainId;

    // ✅ Populate Distribution List
    this.distributionListPayload = row.distributionListPayload || [];

    // ✅ Populate Users
    this.distributionUserList = row.distributionUserList || [];

    // This document was authored via file upload (no saved proposedContent, unlike an
    // HTML-templated document) -- convert its own file client-side so the rich text editor
    // shows its actual current content instead of sitting blank, same as a freshly-picked
    // upload already does via previewUploadedFileContent.
    if (!this.templateHtml && existingDocumentUrl) {
      this.previewExistingDocumentContent(existingDocumentUrl);
    }

    if (this.selectedDocumentType) {
      this.GetTemplate(this.selectedDocumentType, true, existingDocumentUrl);
      this.loadWorkflowAuthorities(this.selectedDocumentType);
    }
  }

  // Same mammoth-based conversion as previewUploadedFileContent, but for the EXISTING document's
  // own file (fetched by URL) rather than a freshly-picked local File -- lets a Revision's rich
  // text editor show that document's real content instead of sitting blank, without requiring
  // the user to re-upload the same file just to see/edit it inline.
  private previewExistingDocumentContent(url: string): void {
    const token = ++this.contentPreviewToken;
    const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || '';
    if (ext !== 'docx') return;

    this.convertingUploadedFile = true;
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Fetch failed');
        return response.arrayBuffer();
      })
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        if (token !== this.contentPreviewToken) return; // superseded by a newer selection
        this.templateHtml = result.value;
      })
      .catch(() => {
        // Leave templateHtml empty -- the document's own file is still fully valid for
        // download/merge regardless of whether this preview conversion succeeded.
      })
      .finally(() => {
        if (token === this.contentPreviewToken) {
          this.convertingUploadedFile = false;
        }
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
        entityType: 'Document', // Sending Document because User needs to see the approval History of Document
        decision:''
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  reviewDraftedFile(): void {
    if (this.uploadedFile) {
      const fileURL = URL.createObjectURL(this.uploadedFile);
      window.open(fileURL, '_blank');
      // Revoke the object URL after some time to free up memory
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    }
  }

  getDraftFileName(): string {
    if (this.uploadedFile) {
      return this.uploadedFile.name;
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
    // Only clear the user's locally-picked replacement file — draftFileUrl holds the
    // standard template / existing document reference, not the upload, and the
    // "Document Content" section's visibility depends on it staying set.
    this.uploadedFile = null;
    // Only reachable from the Word/PDF file-upload branch (see the template) -- templateHtml
    // there only ever holds this file's converted preview, never independently-typed HTML
    // template content (that's the selectedTemplateType === '3' branch, which has no file
    // upload UI at all), so clearing it here is safe.
    this.templateHtml = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
