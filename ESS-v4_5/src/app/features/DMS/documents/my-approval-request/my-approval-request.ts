import { CommonModule } from '@angular/common';
import { Component, ViewChild, TemplateRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, ColumnToggle, SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { PermissionService } from '@app/shared/services/permission.service';
import { EmployeeDraftObservationService } from '@app/shared/services/employee-draft-observation.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';


@Component({
  selector: 'app-my-approval-request',
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
    DocumentTypeList,
    CabinetStructureList,
    DMSRichTextEdit,
    NzModalModule,
  ],
  templateUrl: './my-approval-request.html',
  styleUrl: './my-approval-request.css',
})
export class MyApprovalRequest implements OnInit, OnDestroy {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;
  private subscriptions: Subscription[] = [];

  selectedTab: string = 'Pending';

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'myapprovalrequest';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';
  templateHtml: string = '';
  draftFileUrl: string = '';
  requestId: number = 0;
  currentDocumentName: string = '';
  selectedDocumentTypeCode: string = '';

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  totalPendingDocuments = 0;
  totalApprovedDocuments = 0;
  totalDisApprovedDocuments = 0;
  rowData: any[] = [];
  pendingRequestCount: number = 0;
  approvedRequestCount: number = 0;
  disapprovedRequestCount: number = 0;
  public noRowsOverlay: string = '';
  selectedPageSize = 10;
  LoginEmpId: string = '';

  documentRequestsData: any[] = [];
  totalRows = 0;
  pageNumber = 1;

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

  // Track selection state
  hasSelectedRows = false;
  stepId: number = 0;
  selectedRow: any = null;
  employees: any[] = [];
  selectedEmployee?: string = '';
  observationData: any[] = [];
  observation: string = '';
  documentColumnDefsWithoutStatus: ColDef[] = [];

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subdepartment', label: 'Sub-Department' },
    4: { field: 'businessdomain', label: 'Business Domain' },
  };

  // Columns before the cabinet (Division/Department/...) columns
  private readonly leadingColumnDefs: ColDef[] = [
    {
      field: 'documentType',
      headerName: 'Document Type',
      flex: 1,
    },
    {
      field: 'documentRequestId',
      headerName: 'Request ID',
      flex: 1,
    },
    {
      field: 'documentName',
      headerName: 'Document Name',
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
    {
      field: 'proposedContent',
      headerName: 'ProposedContent',
      hide: true,
    },
    {
      field: 'rowVersion',
      headerName: 'RowVersion',
      hide: true,
    },
    {
      field: 'stepId',
      headerName: 'StepId',
      hide: true,
    },
    {
      field: 'stepOrder',
      headerName: 'StepOrder',
      hide: true,
    },
    {
      field: 'startedAt',
      headerName: 'StartedAt',
      hide: true,
    },
    { field: 'observation', headerName: 'Observation', hide: true },
    // {
    //   field: 'observation',
    //   headerName: 'Observation',
    //   editable: false,
    //   cellRenderer: (params: any) => {
    //     return `
    //       <span
    //         style="color:#1976d2; cursor:pointer; text-decoration:underline"
    //         data-action="open"
    //       >
    //         ${params.value ? 'Observation' : 'Observation'}
    //       </span>
    //     `;
    //   },
    // },
    {
      field: 'justification',
      headerName: 'Justification',
      editable: false,
      cellRenderer: (params: any) => {
        const val = params.value || (params.data && params.data.justification) || '';
        if (!val) return '<span>-</span>';
        return `
          <span
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open-justification"
          >
            Justification
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        const val = event.value || (event.data && event.data.justification);
        if (val) {
          this.openJustificationModal(val);
        }
      },
    },
    // {
    //   field: 'proposedDocumentNumber',
    //   headerName: 'Proposed Document Number',

    // },
    {
      field: 'proposedVersionNumber',
      headerName: 'Proposed Version Number',
      flex: 1,
    },
  ];

  private readonly trailingColumnDefs: ColDef[] = [
    {
      field: 'executionStatus',
      headerName: 'Execution Status',
      cellRenderer: (params: any) => {
        const val = params.value || '';
        const displayVal = val.toLowerCase() === 'reworked' ? 'Reverted' : val;
        const status = displayVal.toLowerCase();
        let color = '#6b7280'; // default gray
        let bgColor = '#f3f4f6';
        let borderColor = '#e5e7eb';

        if (status === 'approved') {
          color = '#10b981';
          bgColor = '#ecfdf5';
          borderColor = '#d1fae5';
        } else if (status === 'rejected') {
          color = '#ef4444';
          bgColor = '#fef2f2';
          borderColor = '#fee2e2';
        } else if (status === 'running' || status === 'pending') {
          color = '#f59e0b';
          bgColor = '#fffbeb';
          borderColor = '#fef3c7';
        } else if (status === 'revered') {
          color = '#6366f1';
          bgColor = '#f5f3ff';
          borderColor = '#ddd6fe';
        }

        return `
          <span style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 12px;
            font-size: 12px;
            font-weight: 600;
            line-height: 1;
            color: ${color};
            background-color: ${bgColor};
            border: 1px solid ${borderColor};
            border-radius: 9999px;
            text-transform: capitalize;
          ">
            ${displayVal}
          </span>
        `;
      },
    },
    // { field: 'dateOfApproval', headerName: 'Date of Approval' },
    {
      field: 'requestCreatedBy',
      headerName: 'Request Created By',
      flex: 1,
      minWidth: 150,
      cellClass: 'audit-cell',
    },
    {
      field: 'requestCreatedOn',
      headerName: 'Request Created On',
      flex: 1,
      minWidth: 150,
      cellClass: 'audit-cell',
    },
    {
      field: 'previousVersionCreatedBy',
      headerName: 'Previous Version Created By',
      flex: 1,
      minWidth: 150,
      cellClass: 'audit-cell',
    },
    {
      field: 'previousVersionCreatedOn',
      headerName: 'Previous Version Created On',
      flex: 1,
      minWidth: 150,
      cellClass: 'audit-cell',
    },
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
        this.openWorkflowDeatilsModal(event.data);
      },
    },
  ];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out
  // showing just the fixed columns until we know which levels are enabled.
  documentColumnDefs: ColDef[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs];

  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentRequestId', label: 'Request ID', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'observation', label: 'Observation', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
    { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
    // { field: 'dateOfApproval', label: 'Date Of Approval', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
  ];

  constructor(
    private _documentRequestService: DocumentRequestService,
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
    private route: ActivatedRoute,
    private _employeeDraftObservationService: EmployeeDraftObservationService,
    private _navigationCountsService: NavigationCountsService,
    private _cabinetHierarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit() {
    // 1. Fetch synchronous data BEFORE any UI component can trigger an API call
    this.documentColumnDefsWithoutStatus = this.documentColumnDefs.filter(
      (col) => col.field !== 'executionStatus',
    );
    this.hasSelectedRows = false;
    this.GetLoginEmpId();

    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
        if (this.agGridWrapper) {
          this.agGridWrapper.refresh();
        }
      }
    });

    // Tab badges reflect the same shared count state the sidebar menu uses (see
    // NavigationCountsService), so this page and the menu never disagree.
    this.subscriptions.push(
      this._navigationCountsService.myRequestApprovalCounts$.subscribe((counts) => {
        this.pendingRequestCount = counts.pending;
        this.approvedRequestCount = counts.approved;
        this.disapprovedRequestCount = counts.rejectedOrReverted;
      }),
    );

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

      this.documentColumnDefs = [
        ...this.leadingColumnDefs,
        ...activeLevelDefs.map((def) => ({ field: def.field, headerName: def.title })),
        ...this.trailingColumnDefs,
      ];
      this.documentColumnDefsWithoutStatus = this.documentColumnDefs.filter(
        (col) => col.field !== 'executionStatus',
      );

      this.columnToggles = [
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentRequestId', label: 'Request ID', visible: true },
        { field: 'documentName', label: 'Document Name', visible: true },
        { field: 'observation', label: 'Observation', visible: true },
        { field: 'justification', label: 'Justification', visible: true },
        { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
        { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
        { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
        { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
        { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
        { field: 'approvalHistory', label: 'Approval History', visible: true },
      ];
    });

    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      // Removed this.GetAllPendingDocuments(); to prevent double API call. AgGridWrapper triggers it automatically on init.
      this.getRequestCounts();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  GetLoginEmpId() {
    this.LoginEmpId = localStorage.getItem('HRISEmpId') || '';
  }

  emptyAllFileds() {
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.clearSelection();
  }

  clearSelection() {
    this.templateHtml = '';
    this.draftFileUrl = '';
    this.requestId = 0;
    this.currentDocumentName = '';
    this.selectedDocumentTypeCode = '';
    this.stepId = 0;
    this.selectedRow = null;
    this.observationData = [];
    this.hasSelectedRows = false;

    // Safely clear the selection from the ag-grid API to prevent row-index selection preservation
    if (this.agGridWrapper) {
      const wrapper = this.agGridWrapper as any;
      const api = wrapper.gridApi || wrapper.api || wrapper.agGrid?.api;
      if (api && typeof api.deselectAll === 'function') {
        api.deselectAll();
      }
    }
  }

  async onDocumentTypeChange(value: string) {
    // this.loading = true;
    this.selectedDocumentType = value;
    this.emptyAllFileds();
    this.pageNumber = 1;
    this.currentGridQuery.pageNumber = 1;
    // this.GetAllPendingDocuments();
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    }
  }

  async onTabChange(status: string) {
    this.selectedTab = status;
    this.emptyAllFileds();
    this.pageNumber = 1;
    this.currentGridQuery.pageNumber = 1;
    // Removed this.GetAllPendingDocuments(); to prevent double API call. AgGridWrapper triggers it automatically.
  }

  getRequestCounts() {
    // Fetches through the shared service; the ngOnInit subscription to
    // myRequestApprovalCounts$ applies the result to this page's tab badges, and
    // main-layout's own subscription applies the same result to the sidebar badge.
    this._navigationCountsService.refreshMyRequestApprovalCounts();
  }

  GetAllPendingDocuments(query?: any) {
    let searchText = '';
    let sortColumn = '';
    let sortBy = 'DESC';

    // If grid triggers the query, extract pagination parameters
    if (query && typeof query === 'object') {
      if (query.pageNumber) this.pageNumber = query.pageNumber;
      if (query.pageSize) this.selectedPageSize = query.pageSize;
      searchText = query.searchText || '';
      if (query.sortModel && query.sortModel.length > 0) {
        sortColumn = query.sortModel[0].colId;
        sortBy = query.sortModel[0].sort;
      }
    } else {
      // Otherwise, reset to page 1 for fresh filters
      this.pageNumber = 1;
    }

    const payload = {
      searchtext: searchText,
      sortby: sortBy,
      sortcolumn: sortColumn,
      isactive: true,
      pagenumber: this.pageNumber,
      pagesize: this.selectedPageSize || 10,
      divisioncode: this.selectedDivisions || '',
      departmentcode: this.selectedDepartment || '',
      subdepartmentcode: this.selectedSubDepartment || '',
      businessdomaincode: this.selectedBusinessDomain || '',
      documenttypecode: this.selectedDocumentType || '',
      requeststatus: this.selectedTab,
      empId: this.LoginEmpId || '',
    };

    this._documentRequestService.getMyPendingDocumentRequest(payload).subscribe({
      next: (response) => {
        if (response?.Success) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          if (this.totalRows > 0) {
            this.documentRequestsData = items.map((item: any) => {
              // Case-insensitive helper to match backend keys
              const get = (keys: string[], defaultValue: any = ''): any => {
                for (const key of keys) {
                  if (item[key] !== undefined && item[key] !== null) return item[key];
                  const lower = key.toLowerCase();
                  if (item[lower] !== undefined && item[lower] !== null) return item[lower];
                }
                return defaultValue;
              };

              return {
                id: get(['Id', 'id']),
                documentRequestId: get(['RequestNumber', 'requestNumber', 'Id', 'id']),
                documentType: get(['DocumentType', 'documentType']),
                documentName: get(['DocumentName', 'documentName', 'Title', 'title']),
                observation: '',
                justification: get(['Justification', 'justification', 'Reason', 'reason'], ''),
                proposedDocumentNumber: get(['DocumentNumber', 'documentNumber']),
                proposedVersionNumber: get(
                  ['ProposedVersionNumber', 'proposedVersionNumber', 'RowVersion', 'rowVersion'],
                  '1.0',
                ),
                division: get(['Division', 'division']),
                department: get(['Department', 'department']),
                subdepartment: get(['SubDepartment', 'subdepartment', 'subDepartment']),
                businessdomain: get(['BusinessDomain', 'businessDomain', 'businessdomain']),
                requestCreatedBy: get([
                  'CreatedBy',
                  'createdBy',
                  'RequestCreatedBy',
                  'requestCreatedBy',
                ]),
                requestCreatedOn: new CustomDateFormatPipe().transform(
                  get(['CreatedAt', 'createdAt', 'RequestCreatedAt', 'requestCreatedAt']),
                ),
                previousVersionCreatedOn: new CustomDateFormatPipe().transform(
                  get(['PreviousVersionCreatedOn', 'previousVersionCreatedOn']),
                ),
                previousVersionCreatedBy: get([
                  'PreviousVersionCreatedBy',
                  'previousVersionCreatedBy'
                ]),
                stepId: get(['StepId', 'stepId']),
                stepOrder: get(['StepOrder', 'stepOrder']),
                startedAt: get(['StartedAt', 'startedAt']),
                executionStatus: get(['ExecutionStatus', 'executionStatus']),
                proposedContent: get([
                  'ProposedContent',
                  'proposedContent',
                  'VersionContent',
                  'versionContent',
                  'Content',
                  'content',
                ]),
                draftFileUrl: get(['DraftFileUrl', 'draftFileUrl', 'draftfileurl', 'DraftFileURL']),
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
      },
      error: (err) => {
        this.documentRequestsData = [];
        this.totalRows = 0;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          'Failed to fetch documents.',
        );
      },
    });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.selectedPageSize = event.pageSize;
      this.currentGridQuery.pageSize = this.selectedPageSize;
    }
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.emptyAllFileds();

    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;

    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    }
  }
 
  // Handle selection changes
  onSelectionChange(selectedRows: any): void {
    this.hasSelectedRows = selectedRows && selectedRows.length > 0;
    const row = selectedRows[0];
    if (row) {
      this.templateHtml = row.proposedContent || '';
      this.stepId = row.stepId || 0;
      this.selectedRow = row;
      this.draftFileUrl = row.draftFileUrl || '';
      this.requestId = row.requestId || row.Id || row.id;
      this.currentDocumentName = row.documentName || '';
      this.selectedDocumentTypeCode = row.documentTypeCode || '';
    } else {
      this.templateHtml = '';
      this.draftFileUrl = '';
      this.requestId = 0;
      this.currentDocumentName = '';
      this.selectedDocumentTypeCode = '';
      this.stepId = 0;
      this.selectedRow = null;
    }
  }

  openDocumentModal(rowData: any): void {
    const proposedContent = rowData?.proposedContent || '';
    const fileUrl = rowData?.draftFileUrl || '';

    if (!proposedContent && !fileUrl) {
      this._notificationToastService.createNotification(
        'warning',
        'Document',
        'No template found for this document.',
      );
      return;
    }

    this.templateHtml = proposedContent;
    this.draftFileUrl = fileUrl;
    this.requestId = rowData?.requestId || rowData?.Id || rowData?.id;
    this.currentDocumentName = rowData?.documentName || '';

    if (fileUrl) {
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

  onCellClicked(event: any): void {
    const row = event.data;
    this.templateHtml = row?.proposedContent || '';
    this.draftFileUrl = row?.draftFileUrl || '';
    this.requestId = row?.requestId || row?.Id || row?.id;
    this.currentDocumentName = row?.documentName || '';
    this.selectedDocumentTypeCode = row?.documentTypeCode || '';
    this.stepId = row?.stepId || 0;
    this.loadObservations(row?.id);
    this.selectedRow = row;
  }

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.id,
        entityType: 'Request',
        // Backend segregates workflow steps by decision -- values line up 1:1 with this
        // screen's tabs ('Pending' | 'Approved' | 'Rejected').
        decision: this.selectedTab,
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  openJustificationModal(justificationText: string): void {
    const text = justificationText || 'No justification provided.';
    const modalRef = this.modal.create({
      nzTitle: 'Justification',
      nzContent: `<div style="padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${text}</div>`,
      nzClosable: true,
      nzMaskClosable: true,
      nzFooter: [
        {
          label: 'Close',
          type: 'primary',
          onClick: () => modalRef.destroy(),
        },
      ],
      nzWidth: 600,
    });
  }

  loadObservations(requestId: any) {
    if (!requestId) {
      this.observationData = [];
      return;
    }
    this._documentRequestService.GetWorkflowObservationDetails(requestId, 'Request', this.selectedTab).subscribe({
      next: (response) => {
        if (response && response.Data) {
          this.observationData = response.Data.map((item: any) => ({
            // Mapping to match the HTML template for observation cards
            loggedBy: item.EmployeeName,
            designation: item.Designation,
            status: item.Decision,
            date: item.ActionAt,
            observation: item.Observation,
            // You can keep other fields if needed for other logic
            ...item,
          }));
        } else {
          this.observationData = [];
        }
      },
    });
  }

  promptAction(action: string) {
    if (!this.selectedRow) return;

    const modalRef = this.modal.create({
      nzTitle: 'Observation',
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: this.selectedRow.Id || this.selectedRow.id,
        entityType: 'Request',
        mode: 'input',
        action: action,
        decision: this.selectedTab
      },
      nzFooter: null,
      nzWidth: 800,
    });

    modalRef.afterClose.subscribe((result) => {
      if (!result) return;
      const actionStr = (action || '').toUpperCase();
      const isApprove = actionStr === 'APPROVED' || actionStr === 'APPROVE';
      if (!isApprove && (!result.observation || result.observation.trim() === '')) {
        return;
      }
      this.submitWorkflowAction(action, result.observation || '');
    });
  }

  submitWorkflowAction(action: string, observation: string) {
    if (action !== 'APPROVED' && (!observation || observation.trim() === '')) {
      this._notificationToastService.createNotification(
        'error',
        'Validation',
        'Observation is required',
      );
      return;
    }

    const payLoad = {
      empId: this.LoginEmpId,
      stepId: this.stepId,
      action: action,
      observation: observation,
    };

    this._documentRequestService.takeWorkflowActionOnDocumentRequest(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          // Message reflects the action actually taken -- backend derives it from the same
          // decision value it just persisted (see DMSDocumentRequestController.TakeWorkflowAction),
          // instead of duplicating that action-to-text mapping here where it could drift out
          // of sync with what actually happened.
          this._notificationToastService.createNotification(
            'success',
            'Request',
            response.Message,
          );
          this.clearSelection();
          this.getRequestCounts();
          if (this.agGridWrapper) {
            this.agGridWrapper.refresh();
          } else {
            this.GetAllPendingDocuments(this.currentGridQuery);
          }
        }
      },
      error: (err) => {
        this._notificationToastService.createNotification(
          'error',
          'Request',
          err.error?.Message || 'Failed to take action on the request.',
          // 'Failed to create workflow step.',
        );
      },
    });
  }

  exportDocumentRequests(): void {
    const payload = {
      searchtext: '',
      sortby: 'DESC',
      sortcolumn: '',
      isactive: true,
      pagenumber: 1,
      pagesize: 100000, // Export all records matching filters
      divisioncode: this.selectedDivisions || '',
      departmentcode: this.selectedDepartment || '',
      subdepartmentcode: this.selectedSubDepartment || '',
      businessdomaincode: this.selectedBusinessDomain || '',
      documenttypecode: this.selectedDocumentType || '',
      requeststatus: this.selectedTab,
      empId: this.LoginEmpId || '',
    };

    this._documentRequestService.exportMyPendingDocumentRequest(payload).subscribe({
      next: (response) => {
        // Backend (ExportMyInboxRequestsAsync) now returns a real .xlsx workbook. Use the blob
        // exactly as the server sent it (response.body already carries the server's actual
        // Content-Type) instead of re-wrapping it in a hardcoded MIME type -- forcing a
        // mismatched type here (e.g. declaring text/csv over real xlsx bytes, as a previous
        // version of this code did) is what produced a file Excel refused to open.
        const blob = response.body as Blob;
        if (!blob) {
          this._notificationToastService.createNotification(
            'error',
            'Export',
            'Failed to export document request list.',
          );
          return;
        }

        // Filename comes from the backend's own naming convention (Content-Disposition), e.g.
        // "Requests Approved by Me - (Aug 21, 2026).xlsx" -- fall back to a local name only if
        // that header is missing for some reason.
        let filename = `My_Approval_Requests_${this.selectedTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
        const contentDisposition =
          response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
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
        this._notificationToastService.createNotification(
          'success',
          'Export',
          'Document request list exported successfully!',
        );
      },
      error: (err) => {
        console.error('Export failed', err);
        this._notificationToastService.createNotification(
          'error',
          'Export',
          'Failed to export document request list.',
        );
      },
    });
  }

  openObservationModal(rowData: any) {
    //console.log('Row clicked:', rowData);
    const modalRef = this.modal.create({
      nzTitle: 'Observation',
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: rowData.id,
        entityType: 'Request',
        mode: 'view',
        action: 'Approver',
        decision: this.selectedTab
      },
      nzFooter: null,
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((result) => {
      if (!result) return;
      this.observation = result.observation;
    });
  }

  downloadDraft(): void {
    if (!this.requestId) {
      this._notificationToastService.createNotification(
        'warning',
        'Draft',
        'No drafted file available for download.',
      );
      return;
    }

    this._documentRequestService.DownloadDraftDocument(this.requestId).subscribe({
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

          let filename = `Draft_${this.currentDocumentName || this.requestId}`;
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
