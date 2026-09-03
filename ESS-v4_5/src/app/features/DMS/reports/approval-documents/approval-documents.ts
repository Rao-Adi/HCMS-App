import { CommonModule } from '@angular/common';
import { Component, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { BehaviorSubject } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, ColumnToggle, SelectList } from '@app/shared/interfaces/interfaces';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { PermissionService } from '@app/shared/services/permission.service';
import { DocumentService } from '@app/shared/services/document.service';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { AppConfigService } from '@app/core/services/app-config';
import { RevisionHistoryModal } from '../../documents/revision-history-modal/revision-history-modal';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

@Component({
  selector: 'app-approval-documents',
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
    NzModalModule,
    NzDatePickerModule,
    CabinetStructureList,
    DocumentTypeList,
    DMSRichTextEdit,
  ],
  templateUrl: './approval-documents.html',
  styleUrl: './approval-documents.css',
  styles: [
    `
      nz-date-picker,
      nz-range-picker {
        margin: 0 8px 12px 0;
      }
    `,
  ],
})
export class ApprovalDocuments {
  @ViewChild('distributionListModalTpl') distributionListModalTpl!: TemplateRef<any>;
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

  gridApi!: GridApi;
  templateHtml: string = '';
  draftFileUrl: string = '';
  documentId: number = 0;
  currentDocumentName: string = '';
  safeDraftFileUrl?: SafeResourceUrl;
  isPdf: boolean = false;
  isDocx: boolean = false;

  approvedFromDate: Date | null = null;
  approvedToDate: Date | null = null;
  requestCreatedFromDate: Date | null = null;
  requestCreatedToDate: Date | null = null;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'viewapproved';

  plainFooter = 'plain extra footer';
  footerRender = (): string => 'extra footer';
  dateFormat = 'dd/MMM/yyyy';
  pageSize = 10;
  documentRequestsData: any[] = [];
  totalRows = 0;

  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedBusinessDomain: string = '';
  selectedDocumentType?: string = '';

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

  loading = false;
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser?: string;
  documentTypeData: any[] = [];

  selectedRoleDistributions: any[] = [];
  distributionListSearchText: string = '';

  // Field names match the raw (lowercase) shape Dapper/Postgres return -- no per-item remapping
  // is done on this array (see roleDistributions in GetAllPendingDocuments), same as elsewhere
  // in this component.
  distributionListColumnDefs: ColDef[] = [
    { field: 'rolename', headerName: 'Role', flex: 1 },
    { field: 'division', headerName: 'Division', flex: 1 },
    { field: 'department', headerName: 'Department', flex: 1 },
    { field: 'employeecode', headerName: 'Employee Code', flex: 1 },
    { field: 'employeename', headerName: 'Employee Name', flex: 1 },
  ];
  // A stable object reference for [gridStyle] -- an inline object literal in the template would
  // be a new reference every change-detection cycle, same issue as the rowData getter below.
  distributionListGridStyle = { width: '100%' };

  requestCreators: SelectList[] = [];

  public noRowsOverlay: string = '';

  selectedRequestCreator: number | null = null;

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subDepartment', label: 'Sub-Department' },
    4: { field: 'businessDomain', label: 'Business Domain' },
  };

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit) alongside documentsColumnDefs.
  columnToggles?: ColumnToggle[] = [
    { field: 'requestId', label: 'Request ID', visible: false },
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentnumber', label: 'Document Number', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'version', label: 'Version', visible: true },
    // { field: 'url', label: 'URL', visible: true },
    { field: 'distributionList', label: 'Distribution List', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
    { field: 'revisionHistory', label: 'Revision History', visible: true },
  ];

  // Columns before the cabinet (Division/Department/...) columns
  private readonly leadingColumnDefs: ColDef[] = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentnumber', headerName: 'Document Number' },
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
    // { field: 'url', headerName: 'URL', minWidth: 100 },
    {
      field: 'distributionList',
      headerName: 'Distribution List',
      editable: false,
      minWidth: 100,
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
        this.openDistributionListModal(event.data);
      },
    },
    { field: 'requestCreatedBy', headerName: 'Request Created By', cellClass: 'audit-cell', minWidth: 140 },
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
      minWidth: 110,
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
    {
      field: 'revisionHistory',
      headerName: 'Revision History',
      editable: false,
      minWidth: 110,
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

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out
  // showing just the fixed columns until we know which levels are enabled.
  documentsColumnDefs: ColDef[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs];

  radioValue = '';
  // single state

  constructor(
    private _permissionService: PermissionService,
    private _documentService: DocumentService,
    private _documentRequestService: DocumentRequestService,
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
    private sanitizer: DomSanitizer,
    private _config: AppConfigService,
    private cdr: ChangeDetectorRef,
    private _cabinetHierarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });
    this.getAllDesignationList();

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
        { field: 'requestId', label: 'Request ID', visible: false },
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentName', label: 'Document Name', visible: true },
        { field: 'version', label: 'Version', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'url', label: 'URL', visible: true },
        { field: 'distributionList', label: 'Distribution List', visible: true },
        { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
        { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
        { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
        { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
        { field: 'approvalHistory', label: 'Approval History', visible: true },
        { field: 'revisionHistory', label: 'Revision History', visible: true },
      ];
    });
  }

  onRequestCreatorChange(value: any): void {
    this.selectedRequestCreator = value;
    this.onFilterChange();
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
      requestCreatedBy: this.selectedRequestCreator,
      approvedFromDate: this.approvedFromDate ? this.approvedFromDate.toISOString() : null,
      approvedToDate: this.approvedToDate ? this.approvedToDate.toISOString() : null,
      requestCreatedFromDate: this.requestCreatedFromDate
        ? this.requestCreatedFromDate.toISOString()
        : null,
      requestCreatedToDate: this.requestCreatedToDate
        ? this.requestCreatedToDate.toISOString()
        : null,
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

    if (this.gridApi) {
      this.gridApi.showLoadingOverlay();
    }

    this._documentService.GetApprovedEffectiveDocuments(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          if (items.length > 0) {
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
                Id: get(['Id', 'id']),
                id: get(['Id', 'id']),
                ExecutionId: get(['ExecutionId', 'executionId']),
                RequestId: get(['requestid', 'Requestid']),
                documentId: get(['Id', 'id']), // often same as Id
                stepId: get(['StepId', 'stepId']),
                stepOrder: get(['StepOrder', 'stepOrder']),
                ExecutionStatus: get(['ExecutionStatus', 'executionStatus'], 'Unknown'),

                // ──────────────────────────────────────────────
                // Document metadata
                // ──────────────────────────────────────────────
                documentnumber: get(['DocumentNumber', 'documentnumber']),
                documentType: get(['DocumentType', 'documenttype']),
                documentTypeCode: get(['DocumentTypeCode', 'documenttypecode']),
                documentName: get(['Title', 'title', 'documentname']),
                version: get(['Version', 'version']),
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
                  'PreviousVersionCreatedBy',
                ]),
                previousVersionCreatedOn: new CustomDateFormatPipe().transform(
                  get(['previousversioncreatedon',
                  'previousversioncreatedon',
                  'PreviousVersionCreatedOn',]),
                ),

                // ──────────────────────────────────────────────
                // Placeholder / missing fields from your original
                // (add real data source when available)
                // ──────────────────────────────────────────────
                observation: '', // ← not in sample → populate when available
                requestedBy: get(['RequestedBy', 'requestedBy'], get(['CreatedBy'])),
                dateOfApproval: '', // ← not present
                approvalHistory: true, // Used to render the link in the cell
                revisionHistory: true,
                distributionList: true,
                roleDistributions: get(
                  ['RoleDistributions', 'roledistributions', 'roleDistributions'],
                  [],
                ),
              };
            });
          } else {
            this.documentRequestsData = [];
            this.totalRows = 0;
          }
        } else {
          this.documentRequestsData = [];
          this.totalRows = 0;
        }

        // Force AG grid updates bypass
        if (this.gridApi) {
          if (this.documentRequestsData.length === 0) {
            this.gridApi.showNoRowsOverlay();
          } else {
            this.gridApi.hideOverlay();
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.documentRequestsData = [];
        this.totalRows = 0;
        if (this.gridApi) {
          this.gridApi.showNoRowsOverlay();
        }
        this.cdr.detectChanges();
        this._notificationToastService.createNotification(
          'error',
          'Error',
          'Failed to fetch documents.',
        );
      },
    });
  }

  onGridReady(event: GridReadyEvent) {
    // Don't fetch here — this grid binds (serverQuery), so AgGridWrapper wires up an
    // infinite-row-model datasource right after gridReady fires, and AG Grid's own first
    // getRows() call already triggers GetAllPendingDocuments() via serverQuery. Calling it
    // again here just duplicates the initial API request.
    this.gridApi = event.api;
  }

  onCellClicked(event: any): void {
    const row = event.data;
    this.templateHtml = row?.proposedContent || '';
    this.draftFileUrl = row?.draftFileUrl || '';
    this.documentId = row?.RequestId || row?.Id || row?.id;
    this.currentDocumentName = row?.documentName || '';
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
    this.onFilterChange();
  }

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  // add more as needed...
  selectedPageSize = 10; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'documentGrid':
        this.divisionPageSize = pageSize;
        this.GetAllPendingDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;

      default:
        break;
    }
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;

    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.onFilterChange();
    }
  }

  onFilterChange() {
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.GetAllPendingDocuments({
        pageNumber: 1,
        pageSize: this.selectedPageSize,
        sortModel: [],
        filterModel: {},
      });
    }
  }

  openDocumentModal(rowData: any) {
    // rowData.url / rowData.proposedContent come from the API's documenturl / versioncontent
    // fields (see GetAllPendingDocuments' mapping) -- when both are null, there's no template to show.
    const hasFileUrl = !!(rowData.url && rowData.url.toString().trim());
    const hasContent = !!(rowData.proposedContent && rowData.proposedContent.toString().trim());
    if (!hasFileUrl && !hasContent) {
      this._notificationToastService.createNotification(
        'warning',
        'Document Content',
        'No template uploaded',
      );
      return;
    }

    this.templateHtml = rowData.proposedContent || '';
    this.documentId = rowData.Id || rowData.id;
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

  openDistributionListModal(rowData: any) {
    this.selectedRoleDistributions = rowData.roleDistributions || [];
    this.distributionListSearchText = '';
    this.filteredRoleDistributions = this.selectedRoleDistributions;
    this.modal.create({
      nzTitle: 'Distribution List',
      nzContent: this.distributionListModalTpl,
      nzFooter: null,
      nzWidth: 1000,
    });
  }

  // A plain field, recomputed only on actual search-text changes -- NOT a getter. This list can
  // legitimately be thousands of rows (every role x every employee holding it, e.g. from "ALL"
  // role distribution), and [rowData] on app-ag-grid-wrapper was previously bound directly to a
  // getter of the same shape: Angular re-evaluates a template getter on every change-detection
  // cycle, so AG Grid was being handed a brand-new array reference (a fresh .filter() result)
  // many times a second even when nothing changed, which it treats as entirely new data each
  // time -- that's what was making the grid appear stuck/frozen with ~4000 rows, not the
  // filtering work itself (which is well under a millisecond for this size).
  filteredRoleDistributions: any[] = [];

  onDistributionSearchChange(term: string): void {
    this.distributionListSearchText = term;
    this.filteredRoleDistributions = this.computeFilteredRoleDistributions(term);
  }

  private computeFilteredRoleDistributions(term: string): any[] {
    const search = term.trim().toLowerCase();
    if (!search) return this.selectedRoleDistributions;
    return this.selectedRoleDistributions.filter((role) => {
      const roleName = (role.rolename || role.RoleName || role.roleName || '').toString().toLowerCase();
      const code = (role.employeecode || role.EmployeeCode || role.employeeCode || '').toString().toLowerCase();
      const name = (role.employeename || role.EmployeeName || role.employeeName || '').toString().toLowerCase();
      return roleName.includes(search) || code.includes(search) || name.includes(search);
    });
  }

  downloadDocumentUrl() {
    if (!this.draftFileUrl) return;
    const a = document.createElement('a');
    a.href = this.draftFileUrl;
    a.target = '_blank';
    const parts = this.draftFileUrl.split('/');
    a.download = parts[parts.length - 1];
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  getAllDesignationList = () => {
    this._documentRequestService.GetRequestCreatedByUserListAsync().subscribe((res) => {
      if (res?.Data) {
        this.requestCreators = (res.Data ?? [])
          .map((d: any) => ({
            CODE: d.Code || d.code,
            NAME: d.Value || d.value,
          }))
          .sort((a: any, b: any) => (a.NAME || '').localeCompare(b.NAME || ''));
      } else {
        this.requestCreators = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };
}
