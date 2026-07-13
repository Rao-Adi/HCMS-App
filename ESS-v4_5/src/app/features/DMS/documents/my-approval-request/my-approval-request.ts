import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { UserService } from '@app/shared/services/user-service';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { PermissionService } from '@app/shared/services/permission.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

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
export class MyApprovalRequest {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

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

  documentColumnDefs = [
    {
      field: 'documentType',
      headerName: 'Document Type',
      minWidth: 150,
      flex: 1
    },
    {
      field: 'documentRequestId',
      headerName: 'Request ID',
      minWidth: 150,
      flex: 1
    },
    {
      field: 'documentName',
      headerName: 'Document Name',
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
    },
    // {
    //   field: 'proposedDocumentNumber',
    //   headerName: 'Proposed Document Number',
      
    // },
    {
      field: 'proposedVersionNumber',
      headerName: 'Proposed Version Number',
      minWidth: 150,
      flex: 1
    },
    {
      field: 'division',
      headerName: 'Division',
    },
    {
      field: 'department',
      headerName: 'Department',
    },
    {
      field: 'subdepartment',
      headerName: 'Sub-Department',
    },
    {
      field: 'executionStatus',
      headerName: 'Execution Status',
      minWidth: 150,
      cellRenderer: (params: any) => {
        const val = params.value || '';
        const displayVal = val.toLowerCase() === 'reworked' ? 'Revered' : val;
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
      }
    },
    { field: 'dateOfCreation', headerName: 'Date Of Creation', minWidth: 150,
      flex: 1, cellClass: 'audit-cell', },
    // { field: 'dateOfApproval', headerName: 'Date of Approval' },
    { field: 'requestCreatedBy', headerName: 'Request Created By', minWidth: 150,
      flex: 1, cellClass: 'audit-cell', },
    { field: 'requestCreatedOn', headerName: 'Request Created On',minWidth: 150,
      flex: 1, cellClass: 'audit-cell', },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By',minWidth: 180,
      flex: 1, cellClass: 'audit-cell', },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On',minWidth: 180,
      flex: 1, cellClass: 'audit-cell', },
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

  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentRequestId', label: 'Request ID', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'observation', label: 'Observation', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
    { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'dateOfCreation', label: 'Date Of Creation', visible: true },
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
    private _userService: UserService,
    private _UtilitiesService: UtilitiesService,
    private _permissionService: PermissionService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // 1. Fetch synchronous data BEFORE any UI component can trigger an API call
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

    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      // Removed this.GetAllPendingDocuments(); to prevent double API call. AgGridWrapper triggers it automatically on init.
      this.getRequestCounts();
    });
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
    this._documentRequestService.GetMyRequestCounts().subscribe({
      next: (response) => {
        if (response && response.Data) {
          const myRequests = response.Data.MyRequests || { Pending: 0, Approved: 0, RejectedOrReverted: 0 };
          const myInbox = response.Data.MyInbox || { Pending: 0, Approved: 0, RejectedOrReverted: 0 };

          this.pendingRequestCount = myInbox.Pending ?? 0;//(myRequests.Pending ?? 0) + (myInbox.Pending ?? 0);
          this.approvedRequestCount = myInbox.Approved ?? 0; //(myRequests.Approved ?? 0) + (myInbox.Approved ?? 0);
          this.disapprovedRequestCount = myInbox.RejectedOrReverted ?? 0; //(myRequests.RejectedOrReverted ?? 0) + (myInbox.RejectedOrReverted ?? 0);
        }
      },
      error: (err) => console.error('Failed to get request counts', err),
    });
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
                justification: get(['Justification', 'justification']),
                proposedDocumentNumber: get(['DocumentNumber', 'documentNumber']),
                proposedVersionNumber: get(
                  ['ProposedVersionNumber', 'proposedVersionNumber', 'RowVersion', 'rowVersion'],
                  '1.0',
                ),
                division: get(['Division', 'division']),
                department: get(['Department', 'department']),
                subdepartment: get(['SubDepartment', 'subdepartment', 'subDepartment']),
                dateOfCreation: this.formatDate(get(['CreatedAt', 'createdAt'])),
                requestCreatedBy: get([
                  'CreatedBy',
                  'createdBy',
                  'RequestCreatedBy',
                  'requestCreatedBy',
                ]),
                requestCreatedOn: this.formatDate(
                  get(['CreatedAt', 'createdAt', 'RequestCreatedAt', 'requestCreatedAt']),
                ),
                previousVersionCreatedOn: this.formatDate(
                  get(['DraftContentLastModifiedAt', 'draftContentLastModifiedAt']),
                ),
                previousVersionCreatedBy: get([
                  'DraftContentLastModifiedBy',
                  'draftContentLastModifiedBy',
                  'LastModifiedBy',
                  'lastModifiedBy',
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

  // handleGridAction(event: { action: string; rowData: any }) {
  //   if (event.action === 'VIEW_CABINET') {
  //     this.openWorkflowDeatilsModal(event.rowData);
  //   }
  // }

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

  onCellClicked(event: any): void {
    const row = event.data;
    this.templateHtml = row?.proposedContent || '';
    this.draftFileUrl = row?.draftFileUrl || '';
    this.requestId = row?.requestId || row?.Id || row?.id;
    this.currentDocumentName = row?.documentName || '';
    this.selectedDocumentTypeCode = row?.documentTypeCode || '';
    this.stepId = row?.stepId || 0;
    this.loadObservations(row.id);
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
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  loadObservations(requestId: any) {
    if (!requestId) {
      this.observationData = [];
      return;
    }
    this._documentRequestService.GetWorkflowObservationDetails(requestId, 'Request').subscribe({
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

    if (action === 'APPROVED') {
      this.submitWorkflowAction(action, ''); // Send empty observation for approve action
      return;
    }

    const modalRef = this.modal.create({
      nzTitle: 'Observation',
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: this.selectedRow.Id || this.selectedRow.id,
        entityType: 'Request',
        mode: 'input',
        action: 'Approver',
      },
      nzFooter: null,
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      if (!result || !result.observation) return;
      this.submitWorkflowAction(action, result.observation);
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
          this._notificationToastService.createNotification('success', 'Request', response.Message);
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

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value; // Return original value if parsing fails
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return value; // Return original value on any other error
    }
  }

  export() {}

  getAllUsersList = () => {
    this._userService.getUserList().subscribe((res) => {
      if (res?.Data) {
        this.employees = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
        const currentUserCode = this._UtilitiesService.GetUserEmpId();
        if (currentUserCode && this.employees.some((e) => e.CODE === currentUserCode)) {
          this.selectedEmployee = currentUserCode;
        } else if (this.employees.length > 0) {
          this.selectedEmployee = this.employees[0].CODE;
        }

        if (this.selectedEmployee && this.agGridWrapper) {
          this.agGridWrapper.refresh();
        } else if (this.selectedEmployee) {
          this.GetAllPendingDocuments();
        }
      } else {
        this.employees = [];
      }
    });
  };

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
      },
      nzFooter: null,
      nzWidth: 1200,
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
