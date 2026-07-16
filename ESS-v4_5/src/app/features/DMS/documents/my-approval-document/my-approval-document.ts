import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { DynamicFormByDocumentAttribute } from '@app/shared/dynamic-forms/dynamic-form-by-document-attribute/dynamic-form-by-document-attribute';
import { PermissionService } from '@app/shared/services/permission.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';

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
export class MyApprovalDocument {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

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

  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentId', label: 'Document ID', visible: true },
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

  pendingDocumentsGridColumnDefs = [
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
    { field: 'documentType', headerName: 'Document Type', minWidth: 130, flex: 1 },
    { field: 'documentTypeCode', headerName: 'DocumentTypeCode', hide: true },
    { field: 'documentId', headerName: 'Document ID', minWidth: 120, flex: 1 },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'company', headerName: 'Company', minWidth: 100, flex: 1 },
    { field: 'proposedDocumentNumber', headerName: 'Proposed Document Number' },
    { field: 'proposedVersionNumber', headerName: 'Proposed Version Number' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'dateOfCreation', headerName: 'Date of Creation', cellClass: 'audit-cell', minWidth: 150,
      flex: 1 },
    // { field: 'dateOfApproval', headerName: 'Date of Approval' },
    { field: 'requestCreatedBy', headerName: 'Requested By', cellClass: 'audit-cell', minWidth: 150,
      flex: 1 },
    { field: 'requestCreatedOn', headerName: 'Requested On', cellClass: 'audit-cell', minWidth: 150,
      flex: 1 },
    {
      field: 'previousVersionCreatedBy',
      headerName: 'Previous Version Created By',
      cellClass: 'audit-cell',minWidth: 150,
      flex: 1
    },
    {
      field: 'previousVersionCreatedOn',
      headerName: 'Previous Version Created On',
      cellClass: 'audit-cell',minWidth: 150,
      flex: 1
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

  pendingDocumentData: any[] = [];

  constructor(
    private modal: NzModalService,
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
    private _documentAttribute: DocumentAttributeService,
    private _documentAttributeService: DocumentAttributeService,
    private _permissionService: PermissionService,
    private _documentRequestService: DocumentRequestService,
  ) {}

  ngOnInit() {
    this.hasSelectedRows = false;
    this.GetLoginEmpId();

    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      // Removed this.GetAllPendingDocuments(); to prevent double API call. AgGridWrapper triggers it automatically on init.
      this.getDocumentCounts();
    });
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
    this._documentService.GetMyDocumentCounts().subscribe({
      next: (response) => {
        if (response && response.Data) {
          const myRequests = response.Data.MyRequests || {
            Pending: 0,
            Approved: 0,
            RejectedOrReverted: 0,
          };
          const myInbox = response.Data.MyInbox || {
            Pending: 0,
            Approved: 0,
            RejectedOrReverted: 0,
          };

          this.pendingDocumentCount = myInbox.pending ?? 0; //(myRequests.Pending ?? 0) + (myInbox.Pending ?? 0);
          this.approvedDocumentCount = myInbox.approved ?? 0; //(myRequests.Approved ?? 0) + (myInbox.Approved ?? 0);
          this.disapprovedDocumentCount = myInbox.rejectedorreverted ?? 0; //(myRequests.RejectedOrReverted ?? 0) + (myInbox.RejectedOrReverted ?? 0);
        }
      },
      error: (err) => console.error('Failed to get request counts', err),
    });
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
      RequestStatus: this.selectedTab == 'Disapproved' ? 'Rejected' : this.selectedTab,
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

              // ──────────────────────────────────────────────
              // Audit / History fields
              // ──────────────────────────────────────────────
              requestCreatedBy: get(['RequestCreatedBy', 'requestCreatedBy'], ''),
              dateOfCreation: new CustomDateFormatPipe().transform(createdAtRaw), // ← see helper below
              requestCreatedOn: new CustomDateFormatPipe().transform(
                get(['RequestCreatedAt', 'requestCreatedAt']),
              ),
              startedAt: new CustomDateFormatPipe().transform(startedAtRaw),

              // Previous version info (only if present in real payloads)
              previsousVersionCreatedBy: get(['RequestCreatedBy', 'requestCreatedBy'], ''),
              previousVersionCreatedOn: new CustomDateFormatPipe().transform(
                get(['RequestCreatedAt', 'requestCreatedAt']),
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
  }

  promptAction(action: string) {
    if (!this.documentId) return;

    if (action === 'Approve') {
      this.submitWorkflowAction(action, ''); // Send empty observation for approve action
      return;
    }

    const modalRef = this.modal.create({
      nzTitle: 'Observation',
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: this.documentId,
        entityType: 'Document',
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
            this.GetAllPendingDocuments();
            if (this.agGridWrapper) {
              this.agGridWrapper.refresh();
            }
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
      RequestStatus: this.selectedTab == 'Disapproved' ? 'Rejected' : this.selectedTab,
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
      next: (response: any) => {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Documents_${this.selectedTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      },
      nzFooter: null,
      nzWidth: 1000,
    });

    modalRef.afterClose.subscribe((result) => {
      if (!result) return;
      this.observation = result.observation;
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

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.Id,
        entityType: 'Document',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
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
