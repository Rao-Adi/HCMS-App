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
import { getWorkflowActionLabel, getWorkflowSuccessMessage } from '@app/shared/utils/workflow-action-label';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { DistributionListModal } from '../distribution-list-modal/distribution-list-modal';
import { EmployeeDraftObservationService } from '@app/shared/services/employee-draft-observation.service';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { DynamicFormByDocumentAttribute } from '@app/shared/dynamic-forms/dynamic-form-by-document-attribute/dynamic-form-by-document-attribute';
import { PermissionService } from '@app/shared/services/permission.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';
import { TemplateService } from '@app/shared/services/template.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

// WorkflowExecutions.Status as stored, translated into what the business calls it. 'Reworked' is
// the stored value for a revert; nothing user-facing has ever called it that. 'Completed' means
// the approval workflow finished, which from an approver's side reads as Approved.
const MY_APPROVAL_STATUS_LABELS: Record<string, string> = {
  Running: 'Pending',
  Completed: 'Approved',
  Rejected: 'Rejected',
  Reworked: 'Reverted',
};

const MY_APPROVAL_STATUS_CLASSES: Record<string, string> = {
  Pending: 'dms-status-pending',
  Approved: 'dms-status-approved',
  Rejected: 'dms-status-rejected',
  Reverted: 'dms-status-reverted',
};

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
  /**
   * Every checked row, so an action can be applied to all of them at once. documentId /
   * executionId below still track the FIRST selected row exactly as before, so the detail
   * panel and the single-record path are untouched.
   */
  selectedRows: any[] = [];

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
    { field: 'distributionList', label: 'Distribution List', visible: true },
    { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
    { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
    { field: 'status', label: 'Status', visible: true },
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
    // Obsoletion distribution retrieval tracking (client requirement, Ayesha Naz, step 9 of her
    // Obsoletion workflow email): "The approver approves the requests after reviewing that
    // document retrieval according to the distribution list is done... should see the
    // distribution list and retrieved status." That requirement names Obsoletion only -- Creation
    // and Revision were never asked for this column, and every document carries a Distribution
    // List (who receives it once Effective) regardless of activity type, so showing it
    // unconditionally put a "Distribution List" link -- that opened a retrieval checklist nothing
    // ever retrieves -- on every row. Gated on activityTypeCode (WorkflowExecutions.ActivityTypeCode
    // via fn_get_my_inbox_documents) so the column is blank for anything but Obsoletion.
    {
      field: 'distributionList',
      headerName: 'Distribution List',
      editable: false,
      cellRenderer: (params: any) => {
        if (String(params.data?.activityTypeCode || '').toUpperCase() !== 'DRT-0003')
          return '<span>-</span>';
        const list = params.value || (params.data && params.data.distributionList) || [];
        if (!list.length) return '<span>-</span>';
        return `
          <span
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open-distribution-list"
          >
            Distribution List
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        if (String(event.data?.activityTypeCode || '').toUpperCase() !== 'DRT-0003') return;
        const list = event.value || (event.data && event.data.distributionList) || [];
        this.openDistributionListModal(list, event.data?.activityTypeCode);
      },
    },
    { field: 'company', headerName: 'Company'},
    { field: 'proposedDocumentNumber', headerName: 'Proposed Document Number' },
    { field: 'proposedVersionNumber', headerName: 'Proposed Version Number' },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 130,
      // The Reverted/Rejected tab lists both outcomes together and, until now, gave no way to
      // tell which a given row was without opening it. ExecutionStatus is already on every row
      // (fn_get_my_inbox_documents returns it); this just names it in the user's own words.
      valueGetter: (params: any) => MY_APPROVAL_STATUS_LABELS[params.data?.ExecutionStatus] ?? params.data?.ExecutionStatus ?? '',
      cellRenderer: (params: any) => {
        const label = params.value;
        if (!label) return '';
        const cls = MY_APPROVAL_STATUS_CLASSES[label] ?? 'dms-status-draft';
        // Classes come from the global stylesheet, so the colours match the same status
        // everywhere else in the DMS rather than being re-picked per grid.
        return `<span class="dms-status-pill ${cls}">${label}</span>`;
      },
    },
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

  // Display Options for those same tabs: offering a toggle for a column that is not on the grid
  // just leaves a switch that does nothing.
  columnTogglesWithoutStatus?: ColumnToggle[];

  // The same columns without Status, for the tabs where every row necessarily has the same one.
  // On Pending every row is Pending and on Approved every row is Approved, so the column says
  // nothing there and only costs width. It earns its place on Reverted/Rejected, which is the one
  // tab that lists two different outcomes together. Mirrors documentColumnDefsWithoutStatus in
  // my-approval-request.ts, which already worked this way.
  documentColumnDefsWithoutStatus: ColDef[] = [];

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
    private _templateService: TemplateService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.hasSelectedRows = false;
    this.GetLoginEmpId();

    // Lets a notification's "View Request Details" link land on the tab that actually
    // matches what it's about (e.g. ?tab=Rejected), instead of always the default tab --
    // same pattern as my-approval-request.ts.
    //
    // Matched case-insensitively: seen in production as "?tab=pending" (lowercase) even
    // though this app only ever sends "Pending" -- something outside this codebase (an email
    // link scanner/rewriter is the leading suspect) is altering the URL's casing in transit.
    // selectedTab drives strict 'Pending'/'Approved'/'Rejected' checks all over this component
    // (the tab content's *ngIf, the grid's own RequestStatus filter, the history modal's
    // decision param) -- an unrecognized case silently matched none of them, rendering a
    // completely blank page instead of just missing the intended tab highlight.
    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        const canonicalTab = ['Pending', 'Approved', 'Rejected'].find(
          (t) => t.toLowerCase() === String(params['tab']).toLowerCase(),
        );
        if (canonicalTab) {
          this.selectedTab = canonicalTab;
        }
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
      this.documentColumnDefsWithoutStatus = this.pendingDocumentsGridColumnDefs.filter(
        (col) => col.field !== 'status',
      );

      this.columnToggles = [
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentId', label: 'Document ID', visible: true },
        { field: 'documentName', label: 'Document Name', visible: true },
        { field: 'observation', label: 'Observation', visible: true },
        { field: 'justification', label: 'Justification', visible: true },
        { field: 'distributionList', label: 'Distribution List', visible: true },
        { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
        { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
        { field: 'status', label: 'Status', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'dateOfCreation', label: 'Date Of Creation', visible: true },
        { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
        { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
        { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
        { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
        { field: 'approvalHistory', label: 'Approval History', visible: true },
      ];

      this.columnTogglesWithoutStatus = this.columnToggles.filter(
        (toggle) => toggle.field !== 'status',
      );
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
              justification: get(['RequestJustification', 'requestJustification', 'DocumentJustification', 'documentJustification'], ''),

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

              // Obsoletion distribution retrieval tracking (client requirement, Ayesha Naz): the
              // approver must be able to see each Distribution List entry's retrieval status
              // before approving. Creation/Revision carry the SAME distribution list (who the
              // document goes out to once Effective), but nothing ever retrieves it -- so showing
              // the Status/Retrieved By columns against those rows read as a permanently-stuck
              // checklist that was never actually there. activityTypeCode (from
              // WorkflowExecutions.ActivityTypeCode, fn_get_my_inbox_documents) tells the modal
              // which case it's in -- see openDistributionListModal.
              distributionList: get(['DistributionList', 'distributionList'], []),
              activityTypeCode: get(['ActivityTypeCode', 'activityTypeCode'], ''),
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

  // Obsoletion distribution retrieval tracking: shows the Distribution List this document's
  // request carried, including each entry's retrieval status, so the approver can verify
  // retrieval was actually done (not just asserted) before approving. Creation/Revision carry
  // the same Distribution List (who the document goes out to once Effective) but nothing ever
  // retrieves it -- the Status/Retrieved By columns only mean anything for Obsoletion (client
  // requirement, Ayesha Naz), so DistributionListModal hides those two columns entirely rather
  // than showing "Not Retrieved" against a checklist that was never actually there.
  //
  // A hand-built HTML string previously lived here (nzContent as a plain string) -- its <table>
  // ignored width:100% and kept shrink-wrapping to content width instead of filling the modal, for
  // reasons not worth chasing further. Moved to a real component (DistributionListModal, same
  // pattern as RevisionHistoryModal/UsersInRoleModal), using the exact Bootstrap `table` markup
  // that already renders correctly elsewhere in this app.
  openDistributionListModal(distributionList: any[], activityTypeCode?: string): void {
    const modalRef = this.modal.create({
      nzTitle: 'Distribution List',
      nzContent: DistributionListModal,
      nzData: {
        distributionList: distributionList || [],
        isObsoletion: String(activityTypeCode || '').toUpperCase() === 'DRT-0003',
      },
      nzFooter: null, // custom footer handled inside the component
      nzClosable: true,
      nzMaskClosable: true,
      nzWidth: 700,
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

    // What the approver gets depends on the Document Type's template, not on whether a file
    // happens to be attached: a Word template (with or without placeholders) is merged with this
    // content and downloaded, so the approver reviews the document as it will actually be issued
    // -- header, document number, version, signature block and all.
    //
    // An HTML template is the exception: there is no .docx to merge into, so its content is what
    // the document IS, and it is shown in the rich text modal instead.
    //
    // The lookup is cached per document type (TemplateService), so a reviewer clicking through a
    // list of the same type pays for it once. An unknown or failed lookup resolves to '' and falls
    // through to the download, which is the behaviour every one of these screens had before.
    this._templateService
      .getTemplateTypeByDocumentTypeCode(rowData?.documentTypeCode)
      .subscribe((templateType) => {
        if (templateType === TemplateService.TEMPLATE_TYPE_HTML) {
          this.openHtmlContentModal();
          return;
        }
        this.downloadDraft();
      });
  }

  /**
   * Shows the saved content in the rich text modal. Only reached for a document type whose
   * template is HTML -- for every other type the approver gets the merged .docx instead.
   */
  openHtmlContentModal(): void {
    this.modal.create({
      nzTitle: 'Document Content',
      nzContent: this.documentModalTpl,
      nzFooter: null,
      nzWidth: '70%',
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
    this.selectedRows = Array.isArray(selectedRows) ? selectedRows : [];
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

    const targets = this.collectWorkflowTargets();

    this.runWorkflowActions(action, observation, targets, 0, {
      ok: 0,
      failed: [],
      lastMessage: 'Action completed successfully.',
    });
  }

  /**
   * One entry per checked row. When nothing is checked this falls back to the single record the
   * panel is showing, so the existing one-at-a-time behaviour is unchanged.
   */
  private collectWorkflowTargets(): { documentid: number; executionid: number; name: string }[] {
    const targets = (this.selectedRows || [])
      .map((r: any) => ({
        documentid: r?.Id ?? r?.documentId ?? 0,
        executionid: r?.ExecutionId ?? r?.executionId ?? 0,
        name: r?.documentName ?? '',
      }))
      .filter((t: any) => t.documentid && t.executionid);

    if (!targets.length) {
      targets.push({
        documentid: this.documentId,
        executionid: this.executionId,
        name: this.documentName || '',
      });
    }

    return targets;
  }

  /** Builds the service call for one target -- the same payload shape the single path always sent. */
  private buildWorkflowActionCall(
    action: string,
    observation: string,
    target: { documentid: number; executionid: number },
  ) {
    const payLoad = {
      documentid: target.documentid,
      executionid: target.executionid,
      action: action,
      observation: observation,
      empid: this.loginEmpId,
    };

    if (action === 'Approve') return this._documentService.approveDocument(payLoad);
    if (action === 'Rejected') return this._documentService.rejectDocument(payLoad);
    if (action === 'Rework') return this._documentService.revertDocument(payLoad);
    return null;
  }

  /**
   * Applies the action to each target in turn.
   *
   * Sequential, not parallel, and deliberately so: each call mutates workflow state, and the
   * backend refuses a second action on a workflow that has already completed. Firing them
   * together would also race the grid refresh and the badge counts.
   *
   * One failure does not abort the rest -- it is collected and reported at the end, so approving
   * eight documents does not silently stop at the second.
   */
  private runWorkflowActions(
    action: string,
    observation: string,
    targets: { documentid: number; executionid: number; name: string }[],
    index: number,
    summary: { ok: number; failed: string[]; lastMessage: string },
  ): void {
    if (index >= targets.length) {
      this.finishWorkflowActions(action, targets, summary);
      return;
    }

    const target = targets[index];
    const call = this.buildWorkflowActionCall(action, observation, target);

    if (!call) {
      this.finishWorkflowActions(action, targets, summary);
      return;
    }

    const label = target.name || String(target.documentid);

    call.subscribe({
      next: (response: any) => {
        if (response?.Success) {
          summary.ok++;
          summary.lastMessage = response?.Message || summary.lastMessage;
        } else {
          summary.failed.push(label + ': ' + (response?.Message || 'failed'));
        }
        this.runWorkflowActions(action, observation, targets, index + 1, summary);
      },
      error: (err: any) => {
        summary.failed.push(label + ': ' + (err?.error?.Message || err?.Message || 'failed'));
        this.runWorkflowActions(action, observation, targets, index + 1, summary);
      },
    });
  }

  /** Refreshes once, after every target has been attempted, and reports what happened. */
  private finishWorkflowActions(
    action: string,
    targets: { documentid: number; executionid: number; name: string }[],
    summary: { ok: number; failed: string[]; lastMessage: string },
  ): void {
    if (summary.ok > 0) {
      this._notificationToastService.createNotification(
        'success',
        'Workflow',
        targets.length === 1
          ? getWorkflowSuccessMessage(action, 'document') || summary.lastMessage
          : summary.ok + ' of ' + targets.length + ' record(s) processed successfully.',
      );

      // Refreshed once here rather than per record: this grid binds (serverQuery), so refresh()
      // is what re-fetches the rows on screen, and calling it inside the loop would fire one
      // list request per selected row.
      this.agGridWrapper?.gridApi?.deselectAll();
      this.agGridWrapper?.refresh();
      this.selectedRows = [];
      this.hasSelectedRows = false;
      this.emptyAllFileds();
      // Every badge, not just this screen's.
      this._navigationCountsService.refreshAfterAction('Document ' + action);
    }

    if (summary.failed.length) {
      this._notificationToastService.createNotification(
        'error',
        'Workflow',
        summary.failed.join(' | '),
      );
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
        // 'All', not selectedTab. The backend filter matches a step's own Decision value, and
        // those are only ever Approved / Rejected / Reworked -- 'Pending' matches nothing at all,
        // and 'Rejected' excludes every Reverted step, because a revert is stored as 'Reworked'.
        // So on the Reverted/Rejected tab, reverting a document and then opening its Observation
        // history showed everything except the action you had just performed. This history is
        // meant to be the document's whole story regardless of outcome.
        decision: 'All',
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
    // 'All' for the same reason as openObservationModal: the panel is headed "Observation
    // History" and a step's own Decision is only ever Approved / Rejected / Reworked, so passing
    // the tab name filtered out the very actions this panel exists to show.
    this._documentRequestService.GetWorkflowObservationDetails(requestId, 'Document', 'All').subscribe({
      next: (response) => {
        if (response && response.Data) {
          this.observationData = response.Data.map((item: any) => ({
            // Mapping to match the HTML template for observation cards
            loggedBy: item.EmployeeName,
            designation: item.Designation,
            // A revert is stored as 'Reworked'; everything the user ever sees calls it 'Reverted'.
            // The template's badge classes and label both test for 'Reverted', so an un-translated
            // 'Reworked' fell through every branch -- rendering with no status colour at all.
            status: item.Decision === 'Reworked' ? 'Reverted' : item.Decision,
            date: item.ActionAt || item.StatusUpdatedOn,
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

    this._documentService.DownloadDocumentTemplate(idToDownload, true).subscribe({
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