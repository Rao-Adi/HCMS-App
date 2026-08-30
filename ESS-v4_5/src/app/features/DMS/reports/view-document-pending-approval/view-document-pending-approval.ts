import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { BehaviorSubject } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, ColumnToggle } from '@app/shared/interfaces/interfaces';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { PermissionService } from '@app/shared/services/permission.service';
import { DocumentService } from '@app/shared/services/document.service';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { AppConfigService } from '@app/core/services/app-config';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

@Component({
  selector: 'app-view-document-pending-approval',
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
    CabinetStructureList,
    DocumentTypeList,
    NzModalModule,
    DMSRichTextEdit,
  ],
  templateUrl: './view-document-pending-approval.html',
  styleUrl: './view-document-pending-approval.css',
})
export class ViewDocumentPendingApproval {
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;

  plainFooter = 'plain extra footer';
  footerRender = (): string => 'extra footer';

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'pendingapproval';

  templateHtml: string = '';
  draftFileUrl: string = '';
  documentId: number = 0;
  currentDocumentName: string = '';
  safeDraftFileUrl?: SafeResourceUrl;
  isPdf: boolean = false;
  isDocx: boolean = false;

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';

  pageSize = 10;
  documentRequestsData: any[] = [];
  totalRows = 0;
  gridApi: any;

  onGridReady(event: any): void {
    this.gridApi = event.api;
  }

  loading = false;
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser?: string;
  documentTypeData: any[] = [];

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subDepartment', label: 'Sub-Department' },
    4: { field: 'businessDomain', label: 'Business Domain' },
  };

  // Columns before the cabinet (Division/Department/...) columns
  private readonly leadingColumnDefs: ColDef[] = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentNumber', headerName: 'Document Number' },
    {
      field: 'documentName',
      headerName: 'Document Name',
      editable: false,
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        return `
          <span
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
                ${params.value || 'View'}
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        this.openDocumentModal(event.data);
      },
    },
    { field: 'version', headerName: 'Version' },
  ];

  // Columns after the cabinet (Division/Department/...) columns
  private readonly trailingColumnDefs: ColDef[] = [
    // { field: 'url', headerName: 'URL' ,
    //   editable: false,
    //   cellRenderer: (params: any) => {
    //     if (!params.data) return '';
    //     return `
    //       <span
    //         style="color:#1976d2; cursor:pointer; text-decoration:underline"
    //         data-action="open"
    //       >
    //             ${params.value || 'View'}
    //       </span>
    //     `;
    //   },
    //   onCellClicked: (event: any) => {
    //     this.openDocumentModal(event.data);
    //   },
    // },
    { field: 'requestCreatedBy', headerName: 'Request Created By', cellClass: 'audit-cell', minWidth: 150 },
    { field: 'requestCreatedOn', headerName: 'Request Created On', cellClass: 'audit-cell', minWidth: 150 },
    {
      field: 'previousVersionCreatedBy',
      headerName: 'Previous Version Created By',
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
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        return `
          <span
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
            Approval History
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        this.openWorkflowDeatilsModal(event.data);
      },
    },
  ];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out
  // showing just the fixed columns until we know which levels are enabled.
  documentsColumnDefs: ColDef[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit) alongside documentsColumnDefs.
  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'version', label: 'Version', visible: true },
    { field: 'url', label: 'URL', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
  ];

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 1,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  constructor(
    private _permissionService: PermissionService,
    private modal: NzModalService,
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
    private sanitizer: DomSanitizer,
    private _config: AppConfigService,
    private _cabinetHierarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });

    // Only show Division/Department/Sub-Department/Business Domain columns for cabinet
    // levels that are currently Enabled (CabinetLevel.isActive), labeled with whichever
    // title is configured for that level.
    this._cabinetHierarchyService.loadDropdownHierarchy().subscribe((levels) => {
      const activeLevelDefs = levels
        .filter((level) => level.isActive && this.cabinetLevelFields[level.level])
        .map((level) => ({
          ...this.cabinetLevelFields[level.level],
          title: level.title,
        }));

      this.documentsColumnDefs = [
        ...this.leadingColumnDefs,
        ...activeLevelDefs.map((def) => ({ field: def.field, headerName: def.title })),
        ...this.trailingColumnDefs,
      ];

      this.columnToggles = [
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentName', label: 'Document Name', visible: true },
        { field: 'version', label: 'Version', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'url', label: 'URL', visible: true },
        { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
        { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
        { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
        { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
        { field: 'approvalHistory', label: 'Approval History', visible: true },
      ];
    });
  }

  selectedAuthorityType: number | null = null;

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
  }

  selectedWorkflowExclude: number | null = null;
  onWorkflowExcludeChange(value: number | null): void {
    this.selectedWorkflowExclude = value;
  }

  GetAllPendingDocuments(query?: any) {
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

    const payLoad = {
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      documentTypeCode: this.selectedDocumentType,
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      searchTerm: this.currentGridQuery.searchTerm || '',
      // Map to satisfy backend validation
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: this.currentGridQuery.searchTerm || '',
    };

    this._documentService.GetAllDocumentPendingApprovals(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.documentRequestsData = items.map((item: any) => {
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
              documentId: get(['Id', 'id']), // often same as Id
              stepId: get(['StepId', 'stepId']),
              stepOrder: get(['StepOrder', 'stepOrder']),
              ExecutionStatus: get(['ExecutionStatus', 'executionStatus'], 'Unknown'),

              // ──────────────────────────────────────────────
              // Document metadata
              // ──────────────────────────────────────────────
              documentType: get(['DocumentType', 'documenttype']),
              documentTypeCode: get(['DocumentTypeCode', 'documenttypecode']),
              documentName: get(['Title', 'title', 'documentname']),
              documentNumber: get(['DocumentNumber', 'documentnumber']),
              version: get(['Version', 'version', 'proposedVersionNumber']),
              company: get(['Company', 'company'], ''),

              // ──────────────────────────────────────────────
              // Organizational context
              // ──────────────────────────────────────────────
              division: get(['Division', 'division']),
              department: get(['Department', 'department']),
              departmentId: get(['DepartmentCode', 'departmentcode']),
              subDepartment: get(['SubDepartment', 'subdepartment']),
              subDepartmentId: get(['SubDepartmentCode', 'subdepartmentcode']),
              businessDomain: get(['BusinessDomain', 'businessdomain']),
              businessDomainId: get(['BusinessDomainCode', 'businessdomaincode']),
              // ──────────────────────────────────────────────
              // Content / Justification
              // ──────────────────────────────────────────────

              proposedContent: get(['VersionContent', 'ProposedContent', 'Content'], ''),
              url: get(['DocumentURL', 'documenturl', 'DraftFileURL', 'draftFileURL']),

              // ──────────────────────────────────────────────
              // Audit / History fields
              // ──────────────────────────────────────────────
              requestCreatedBy: get(['CreatedByName', 'createdbyname', 'RequestCreatedBy']),
              dateOfCreation: new CustomDateFormatPipe().transform(createdAtRaw), // ← see helper below
              requestCreatedOn: new CustomDateFormatPipe().transform(
                get(['CreatedAt', 'createdat', 'RequestCreatedAt']),
              ),
              startedAt: new CustomDateFormatPipe().transform(startedAtRaw),

              // Previous version info (only if present in real payloads)
              previousVersionCreatedBy: get([
                'previousversioncreatedby',
                'previousversioncreatedby',
              ]),
              previousVersionCreatedOn: new CustomDateFormatPipe().transform(
                get(['previousversioncreatedon', 'previousversioncreatedon']),
              ),

              // ──────────────────────────────────────────────
              // Placeholder / missing fields from your original
              // (add real data source when available)
              // ──────────────────────────────────────────────
              observation: '', // ← not in sample → populate when available
              requestedBy: get(['RequestedBy', 'requestedBy'], get(['CreatedBy'])),
              dateOfApproval: '', // ← not present
              approvalHistory: true, // Used to render the link in the cell
            };
          });

          if (this.gridApi) {
            this.gridApi.hideOverlay();
            if (this.documentRequestsData.length === 0) {
              this.gridApi.showNoRowsOverlay();
            }
          }
        } else {
          this.documentRequestsData = [];
          this.totalRows = 0;
          if (this.gridApi) {
            this.gridApi.hideOverlay();
            this.gridApi.showNoRowsOverlay();
          }
        }
      },
      error: (err) => {
        this.documentRequestsData = [];
        this.totalRows = 0;
        if (this.gridApi) {
          this.gridApi.hideOverlay();
          this.gridApi.showNoRowsOverlay();
        }
        this._notificationToastService.createNotification(
          'error',
          'Error',
          'Failed to fetch documents.',
        );
      },
    });
  }

  onCellClicked(event: any): void {
    const row = event.data;
    this.templateHtml = row?.proposedContent || '';
    this.draftFileUrl = row?.draftFileUrl || '';
    this.documentId = row?.RequestId || row?.Id || row?.id;
    this.currentDocumentName = row?.documentName || '';
  }

  onDocumentTypeChange(value: string): void {
    this.selectedDocumentType = value;
    if (this.gridApi) {
      this.gridApi.refreshInfiniteCache();
    } else {
      this.GetAllPendingDocuments();
    }
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    if (gridId === 'documentGridPending') {
      this.pageSize = pageSize;
      if (this.gridApi) {
        this.gridApi.refreshInfiniteCache();
      } else {
        this.GetAllPendingDocuments();
      }
    }
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
    if (this.gridApi) {
      this.gridApi.refreshInfiniteCache();
    } else {
      this.GetAllPendingDocuments();
    }
  }

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.Id,
        entityType: 'Document',
        decision:'Approved'
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  openDocumentModal(rowData: any) {
    this.templateHtml = rowData.proposedContent || '';
    this.documentId = rowData.Id || rowData.id;
    this.currentDocumentName = rowData.documentName || rowData.DocumentName || '';
    let fileUrl = rowData.url || '';

    if (fileUrl && fileUrl.trim()) {
      if (!fileUrl.startsWith('http')) {
        const baseUrl = this._config.baseUrl ? this._config.baseUrl.replace(/\/$/, '') : '';
        fileUrl = baseUrl + (fileUrl.startsWith('/') ? '' : '/') + fileUrl;
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
      nzStyle: { top: '20%' },
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
}
