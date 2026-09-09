import { CommonModule } from '@angular/common';
import { Component, ViewChild, TemplateRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import {
  CabinetSelection,
  ColumnToggle,
  ControlTypes,
  DocumentAttribute,
  SelectList,
} from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DocumentService } from '@app/shared/services/document.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { getWorkflowActionLabel } from '@app/shared/utils/workflow-action-label';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { EmployeeDraftObservationService } from '@app/shared/services/employee-draft-observation.service';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { DynamicFormByDocumentAttribute } from '@app/shared/dynamic-forms/dynamic-form-by-document-attribute/dynamic-form-by-document-attribute';
import { PermissionService } from '@app/shared/services/permission.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

@Component({
  selector: 'app-my-approval-document',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    DocumentTypeList,
    DMSRichTextEdit,
    CabinetStructureList,
    AgGridWrapper,
    DynamicFormByDocumentAttribute,
    NzModalModule,
  ],
  templateUrl: './my-approval-document.html',
  styleUrl: './my-approval-document.css',
})
export class MyApprovalDocument implements OnInit, OnDestroy {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;
  private subscriptions: Subscription[] = [];

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'myapprovals';

  selectedTab: string = 'Pending';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';
  templateHtml: string = '';
  draftFileUrl: string = '';
  documentName: string = '';
  // Track selection state
  hasSelectedRows = false;
  observationData: any[] = [];
  stepId: number = 0;
  documentId: number = 0;
  executionId: number = 0;
  totalRows = 0;
  selectedEmployee?: string = '';
  observation: string = '';
  loginEmpId: string = '';

  documentRequestsData: any[] = [];
  documentAttributeValues: any[] = [];
  attributes: DocumentAttribute[] = [];

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

  selectedPageSize = 10;
  totalPendingDocuments = 0;
  totalApprovedDocuments = 0;
  totalDisApprovedDocuments = 0;
  rowData: any[] = [];
  pendingDocumentCount: number = 0;
  approvedDocumentCount: number = 0;
  disapprovedDocumentCount: number = 0;
  public noRowsOverlay: string = '';

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subDepartment', label: 'SubDepartment' },
    4: { field: 'businessDomain', label: 'BusinessDomain' },
  };

  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentId', label: 'Document ID', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'observation', label: 'Observation', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
    { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
    { field: 'dateOfCreation', label: 'Date Of Creation', visible: true },
    // { field: 'dateOfApproval', label: 'Date Of Approval', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
  ];

  private readonly leadingColumnDefs: ColDef[] = [
    { field: 'executionId', headerName: 'ExecutionId', hide: true },
    { field: 'observation', headerName: 'Observation', hide: true },
    // {
    //   field: 'observation',
    //   headerName: 'Observation',
    //   editable: false,
    //   cellRenderer: (params: any) => {
    //     if (!params.data) return '';
    //     return `
    //     <span
    //       style="color:#1976d2; cursor:pointer; text-decoration:underline"
    //       data-action="open"
    //     >
    //       Observation
    //     </span>
    //   `;
    //   },
    //   onCellClicked: (event: any) => {
    //     this.openObservationModal(event.data);
    //   },
    // },
    { field: 'documentType', headerName: 'Document Type'},
    { field: 'documentTypeCode', headerName: 'DocumentTypeCode', hide: true },
    { field: 'documentId', headerName: 'Document ID' },
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
    { field: 'company', headerName: 'Company'},
    { field: 'proposedDocumentNumber', headerName: 'Proposed Document Number' },
    { field: 'proposedVersionNumber', headerName: 'Proposed Version Number' },
  ];

  private readonly trailingColumnDefs: ColDef[] = [
    { field: 'dateOfCreation', headerName: 'Date of Creation', cellClass: 'audit-cell' },
    // { field: 'dateOfApproval', headerName: 'Date of Approval' },
    { field: 'requestCreatedBy', headerName: 'Requested By', cellClass: 'audit-cell'},
    { field: 'requestCreatedOn', headerName: 'Requested On', cellClass: 'audit-cell'},
    {
      field: 'previousVersionCreatedBy',
      headerName: 'Previous Version Created By',
      cellClass: 'audit-cell'
    },
    {
      field: 'previousVersionCreatedOn',
      headerName: 'Previous Version Created On',
      cellClass: 'audit-cell'
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
  pendingDocumentsGridColumnDefs: ColDef[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs];

  pendingDocumentData: any[] = [];

  constructor(
    private modal: NzModalService,
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
    private _documentAttribute: DocumentAttributeService,
    private _documentAttributeService: DocumentAttributeService,
    private _permissionService: PermissionService,
    private _documentRequestService: DocumentRequestService,
    private _employeeDraftObservationService: EmployeeDraftObservationService,
    private _navigationCountsService: NavigationCountsService,
    private _cabinetHierarchyService: CabinetHierarchyService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.hasSelectedRows = false;
    this.GetLoginEmpId();

    // Lets a notification's "View Request Details" link land on the tab that actually
    // matches what it's about (e.g. ?tab=Rejected), instead of always the default tab --
    // same pattern as my-approval-request.ts.
    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
    });

    // Tab badges reflect the same shared count state the sidebar menu uses (see
    // NavigationCountsService), so this page and the menu never disagree.
    this.subscriptions.push(
      this._navigationCountsService.myDocumentApprovalCounts$.subscribe((counts) => {
        this.pendingDocumentCount = counts.pending;
        this.approvedDocumentCount = counts.approved;
        this.disapprovedDocumentCount = counts.rejectedOrReverted;
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

      this.pendingDocumentsGridColumnDefs = [
        ...this.leadingColumnDefs,
        ...activeLevelDefs.map((def) => ({ field: def.field, headerName: def.title })),
        ...this.trailingColumnDefs,
      ];

      this.columnToggles = [
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentId', label: 'Document ID', visible: true },
        { field: 'documentName', label: 'Document Name', visible: true },
        { field: 'observation', label: 'Observation', visible: true },
        { field: 'justification', label: 'Justification', visible: true },
        { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
        { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'dateOfCreation', label: 'Date Of Creation', visible: true },
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
      this.getDocumentCounts();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private getCountPayload(status: string): any {
    return {
      divisionCode: '',
      departmentCode: '',
      subDepartmentCode: '',
      businessDomainCode: '',
      documentTypeCode: '',
      RequestStatus: status,
      pageNumber: 1,
      pageSize: 1, // Only need the count
      sortModel: [],
      filterModel: {},
      searchTerm: '',
      sortBy: 'DESC',
      sortColumn: 'Id',
      searchText: '',
      empid: this.loginEmpId,
    };
  }

  getDocumentCounts() {
    // Fetches through the shared service; the ngOnInit subscription to
    // myDocumentApprovalCounts$ applies the result to this page's tab badges, and
    // main-layout's own subscription applies the same result to the sidebar badge.
    this._navigationCountsService.refreshMyDocumentApprovalCounts();
  }

  GetLoginEmpId() {
    this.loginEmpId = localStorage.getItem('HRISEmpId') || '';
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
    this.selectedDocumentType = value;
    this.emptyAllFileds();
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    }
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
      RequestStatus: this.selectedTab,
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.selectedPageSize || 10,
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
              subDepartment: get(['SubDepartment', 'subDepartment']),
              subDepartmentId: get(['SubDepartmentCode', 'subDepartmentCode']),
              businessDomain: get(['BusinessDomain', 'businessDomain']),
              businessDomainId: get(['BusinessDomainCode', 'businessDomainCode']),
              // ──────────────────────────────────────────────
              // Content / Justification
              // ──────────────────────────────────────────────

              proposedContent: get(['VersionContent', 'ProposedContent', 'Content'], ''),
              draftFileUrl: get(
                ['DraftFileURL', 'draftFileURL', 'draftfileurl', 'DraftFileUrl', 'draftFileUrl'],
                '',
              ),
              justification: get(['Justification', 'justification', 'Reason', 'reason'], ''),

              // ──────────────────────────────────────────────
              // Audit / History fields
              // ──────────────────────────────────────────────
              requestCreatedBy: get(['RequestCreatedBy', 'requestCreatedBy'], ''),
              dateOfCreation: new CustomDateFormatPipe().transform(createdAtRaw), // ← see helper below
              requestCreatedOn: new CustomDateFormatPipe().transform(
                get(['RequestCreatedAt', 'requestCreatedAt']),
              ),
              startedAt: new CustomDateFormatPipe().transform(startedAtRaw),

              previousVersionCreatedOn: new CustomDateFormatPipe().transform(
                  get(['PreviousVersionCreatedOn', 'previousVersionCreatedOn']),
                ),
                previousVersionCreatedBy: get([
                  'PreviousVersionCreatedBy',
                  'previousVersionCreatedBy'
                ]),

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
    this.documentName = rowData?.documentName || '';
    this.documentId = rowData?.Id;

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
    this.templateHtml = event.data?.proposedContent || '';
    this.draftFileUrl = event.data?.draftFileUrl || '';
    this.documentName = event.data?.documentName || '';
    this.documentId = event.data?.Id;
    this.GetDocumentAttributeByDocumentId(this.documentId);
    this.loadObservations(this.documentId);
    this.GetDocumentAttributes(event.data?.documentTypeCode);
  }

  onSelectionChange(selectedRows: any): void {
    this.hasSelectedRows = selectedRows && selectedRows.length > 0;
    this.templateHtml = selectedRows[0]?.proposedContent || '';
    this.draftFileUrl = selectedRows[0]?.draftFileUrl || '';
    this.documentName = selectedRows[0]?.documentName || '';
    this.stepId = selectedRows[0]?.stepId || 0; // Assuming stepId is part of rowData
    this.documentId = selectedRows[0]?.Id || 0;
    this.executionId = selectedRows[0]?.ExecutionId || 0;
    // Row selection (checkbox) is a separate AG Grid event from onCellClicked, and unlike that
    // handler this one never refreshed the Observation panel -- selecting a different document
    // this way left the previously-clicked document's observations on screen indefinitely.
    this.loadObservations(this.documentId);
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.selectedPageSize = event.pageSize;
      this.currentGridQuery.pageSize = this.selectedPageSize;
    }
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
    this.emptyAllFileds();
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    }
  }

  async onTabChange(status: string) {
    this.selectedTab = status;
    this.emptyAllFileds();
  }

  emptyAllFileds() {
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.templateHtml = '';
    this.draftFileUrl = '';
    this.documentName = '';
    this.documentId = 0;
    this.documentAttributeValues = [];
    this.observationData = [];
    this.attributes = [];
    this.hasSelectedRows = false;
    this.stepId = 0;
    this.executionId = 0;
  }

  promptAction(action: string) {
    if (!this.documentId) return;

    const modalRef = this.modal.create({
      nzTitle: `Observation - ${getWorkflowActionLabel(action, 'Document')}`,
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: this.documentId,
        entityType: 'Document',
        mode: 'input',
        action: action,
        decision: this.selectedTab
      },
      nzFooter: null,
      nzWidth: '70%',
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
    if (action !== 'Approve' && (!observation || observation.trim() === '')) {
      this._notificationToastService.createNotification(
        'error',
        'Validation',
        'Observation is required',
      );
      return;
    }

    const payLoad = {
      documentid: this.documentId,
      executionid: this.executionId,
      action: action,
      observation: observation,
      empid: this.loginEmpId,
    };

    let actionObservable;
    if (action === 'Approve') {
      actionObservable = this._documentService.approveDocument(payLoad);
    } else if (action === 'Rejected') {
      actionObservable = this._documentService.rejectDocument(payLoad);
    } else if (action === 'Rework') {
      actionObservable = this._documentService.revertDocument(payLoad);
    }

    if (actionObservable) {
      actionObservable.subscribe({
        next: (response: any) => {
          if (response?.Success) {
            this._notificationToastService.createNotification(
              'success',
              'Workflow',
              response.Message,
            );
            // This grid binds (serverQuery), so it's server-side/infinite-row-model — calling
            // GetAllPendingDocuments() directly only reassigns documentRequestsData, which
            // doesn't reach AG Grid's rendered rows unless a fetch happens to be mid-flight.
            // refresh() (via refreshInfiniteCache()) is what actually re-fetches what's on
            // screen; calling both meant every action fired the list request twice.
            this.agGridWrapper?.gridApi?.deselectAll();
            this.agGridWrapper?.refresh();
            this.emptyAllFileds();
            // Previously this action never refreshed the tab/sidebar badges at all —
            // they'd only catch up on next navigation. Refresh immediately now.
            this.getDocumentCounts();
          }
        },
        error: (err: any) => {
          this._notificationToastService.createNotification(
            'error',
            'Workflow',
            err?.error?.Message || err?.Message,
          );
        },
      });
    }
  }


  exportDocuments(query?: any) {
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
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      documentTypeCode: this.selectedDocumentType,
      RequestStatus: this.selectedTab,
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: 1000000,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      searchTerm: this.currentGridQuery.searchTerm || '',
      // Map to satisfy backend validation
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: this.currentGridQuery.searchTerm || '',
      empid: this.loginEmpId,
    };

    this._documentService.exportDocuments(payload).subscribe({
      next: (response) => {
        // Backend (ExportMyDocumentsAsync) now returns a real .xlsx workbook. Use the blob exactly
        // as the server sent it instead of re-wrapping it in a hardcoded MIME type -- a mismatched
        // type here (declaring text/csv over real xlsx bytes) is what produced a file Excel refused
        // to open, which is why this was reverted to CSV in the first place.
        const blob = response.body as Blob;
        if (!blob) {
          this._notificationToastService.createNotification('error', 'Export', 'Failed to export document list.');
          return;
        }

        let filename = `Documents_${this.selectedTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        this._notificationToastService.createNotification('success', 'Export', 'Document list exported successfully!');
      },
      error: (err) => {
        console.error('Export failed', err);
        this._notificationToastService.createNotification('error', 'Export', 'Failed to export document list.');
      }
    });
  }



  GetDocumentAttributeByDocumentId = (documentId: any) => {
    this._documentAttribute.getDocumentAttributeByDocumentId(documentId).subscribe((res) => {
      if (res?.Data) {
        this.documentAttributeValues = res.Data;
      } else {
        this.documentAttributeValues = [];
      }
    });
  };

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

  openObservationModal(rowData: any) {
    //console.log('Row clicked:', rowData);
    const modalRef = this.modal.create({
      nzTitle: 'Observation',
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: rowData.Id,
        entityType: 'Document',
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

  loadObservations(requestId: any) {
    // Cleared up front, not just in the response branches below -- otherwise the previous
    // document's observations stay visible for the entire round trip to the new one's.
    this.observationData = [];
    if (!requestId) {
      return;
    }
    this._documentRequestService.GetWorkflowObservationDetails(requestId, 'Document', this.selectedTab).subscribe({
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

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.Id,
        entityType: 'Document',
        // selectedTab is passed straight through as the decision filter, but the backend's
        // filter only ever matches an exact 'Rejected'/'Reworked'/'Approved'/'All' -- neither
        // 'Rejected' (see below) nor 'Pending' as sent here ever appear as a step's OWN Decision
        // value, so both silently returned zero rows, always, regardless of what actually
        // happened on the document.
        //
        // 'Rejected': this tab's button is labeled "Reverted/Rejected" and lists BOTH outcomes
        // together, but selectedTab is always the single literal string 'Rejected' regardless of
        // which one a given row actually is. 'All' shows the row's complete history regardless
        // of outcome type, which is what "Approval History" should show either way.
        //
        // 'Pending': a still-pending document's earlier steps are already decided (by
        // definition -- a sequential workflow can't reach a later step until every prior one is
        // Approved), so asking for 'Approved' shows exactly that prior history. There's no
        // decision value that also includes the current not-yet-decided step, since Decision is
        // NULL until someone actually acts on it.
        decision:
          this.selectedTab === 'Rejected'
            ? 'All'
            : this.selectedTab === 'Pending'
              ? 'Approved'
              : this.selectedTab,
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  downloadDraft(): void {
    const idToDownload = this.documentId;

    if (!idToDownload) {
      this._notificationToastService.createNotification(
        'warning',
        'Draft',
        'No drafted file available for download.',
      );
      return;
    }

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
}