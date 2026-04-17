import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
import { NotificationService } from '@app/shared/notification/notification.service';
import { UserService } from '@app/shared/services/user-service';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { PermissionService } from '@app/shared/services/permission.service';

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
  observation: string = '';

  documentColumnDefs = [
    {
      field: 'documentType',
      headerName: 'Document Type',
    },
    {
      field: 'documentRequestId',
      headerName: 'Request Id',
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

    {
      field: 'observation',
      headerName: 'Observation',
      editable: false,
      cellRenderer: (params: any) => {
        return `
          <span 
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
            ${params.value ? 'Observation' : 'Observation'}
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        this.openObservationModal(event.data);
      },
    },
    {
      field: 'justification',
      headerName: 'Justification',
    },
    {
      field: 'proposedDocumentNumber',
      headerName: 'Proposed Document Number',
    },
    {
      field: 'proposedVersionNumber',
      headerName: 'Proposed Versioin Number',
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
    { field: 'dateOfCreation', headerName: 'Date Of Creation' },
    { field: 'dateOfApproval', headerName: 'Date of Approval' },
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
    { field: 'documentRequestId', label: 'Request Id', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'observation', label: 'Observation', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
    { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'dateOfCreation', label: 'Date Of Creation', visible: true },
    { field: 'dateOfApproval', label: 'Date Of Approval', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
  ];

  constructor(
    private _doumentRequestService: DocumentRequestService,
    private modal: NzModalService,
    private _notification: NotificationService,
    private _userService: UserService,
    private _UtilitiesService: UtilitiesService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    // 1. Fetch synchronous data BEFORE any UI component can trigger an API call
    this.hasSelectedRows = false;
    this.GetLoginEmpId();

    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.GetAllPendingDocuments({
        pageNumber: 1,
        pageSize: this.selectedPageSize,
        sortModel: [],
        filterModel: {},
      });
    });
  }

  GetLoginEmpId() {
    this.LoginEmpId = localStorage.getItem('HRISEmpId') || '';
  }



  emptyAllFileds() {
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.templateHtml = '';
    this.draftFileUrl = '';
    this.requestId = 0;
    this.currentDocumentName = '';
    this.selectedDocumentTypeCode = '';
    this.stepId = 0;
    this.selectedRow = null;
    this.hasSelectedRows = false;
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
    this.GetAllPendingDocuments();
    
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
      requeststatus: this.selectedTab === 'Disapproved' ? 'Rejected' : this.selectedTab || '',
      empId: this.LoginEmpId || '',
    };

    this._doumentRequestService.getMyPendingDocumentRequest(payload).subscribe({
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
                  get([
                    'DraftContentLastModifiedAt',
                    'draftContentLastModifiedAt',
                    'LastModifiedAt',
                    'lastModifiedAt',
                  ]),
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
        this._notification.createNotification('error', 'Error', 'Failed to fetch documents.');
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

  promptAction(action: string) {
    if (!this.selectedRow) return;

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
    if (!observation || observation.trim() === '') {
      this._notification.createNotification('error', 'Validation', 'Observation is required');
      return;
    }

    const payLoad = {
      empId: this.LoginEmpId,
      stepId: this.stepId,
      action: action,
      observation: observation,
    };

    this._doumentRequestService.takeWorkflowActionOnDocumentRequest(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          debugger;
          this._notification.createNotification('success', 'Request', response.Message);
          this.GetAllPendingDocuments();
        }
      },
      error: (err) => {
        this._notification.createNotification(
          'error',
          'Request',
          'Failed to create workflow step.',
        );
      },
    });
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return '';
    try {
      const [datePart, timePart = ''] = value.split(' ');
      const [month, day, year] = datePart.split('/');
      if (!year || !month || !day) return value;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year} ${timePart.trim()}`.trim();
    } catch {
      return value;
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
      this._notification.createNotification(
        'warning',
        'Draft',
        'No drafted file available for download.',
      );
      return;
    }

    this._doumentRequestService.DownloadDraftDocument(this.requestId).subscribe({
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
                this._notification.createNotification(
                  'warning',
                  'Draft',
                  res.Message || 'Draft not available.',
                );
              } catch {
                this._notification.createNotification('error', 'Draft', 'Failed to read response.');
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
          this._notification.createNotification(
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
              this._notification.createNotification(
                'error',
                'Draft',
                res.Message || 'Failed to download draft.',
              );
            } catch {
              this._notification.createNotification('error', 'Draft', 'Failed to download draft.');
            }
          });
        } else {
          console.error('Error downloading draft', err);
          this._notification.createNotification('error', 'Draft', 'Failed to download draft.');
        }
      },
    });
  }
}
