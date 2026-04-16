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
import { NotificationService } from '@app/shared/notification/notification.service';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper'; 
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { DynamicFormByDocumentAttribute } from '@app/shared/dynamic-forms/dynamic-form-by-document-attribute/dynamic-form-by-document-attribute'; 
import { UtilitiesService } from '@app/core/services/utilities.service';
import { PermissionService } from '@app/shared/services/permission.service';

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

  // Tracks the last requested payload to completely eliminate duplicate API calls
  private lastFetchPayload: string = '';

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
    editable: true,
  };

  pageSize = 1;
  totalPendingDocuments = 0;
  totalApprovedDocuments = 0;
  totalDisApprovedDocuments = 0;
  rowData: any[] = [];
  public noRowsOverlay: string = '';

  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'requestId', label: 'Request Id', visible: true },
    { field: 'documentName', label: 'documentName', visible: true },
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

  pendingDocumentsGridColumnDefs = [
    { field: 'executionId', headerName: 'ExecutionId', hide: true },
    {
      field: 'observation',
      headerName: 'Observation',
      editable: false,
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          Observation
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openObservationModal(event.data);
      },
    },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentTypeCode', headerName: 'DocumentTypeCode', hide: true },
    { field: 'requestId', headerName: 'Request Id' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'company', headerName: 'Company' },
    { field: 'proposedDocumentNumber', headerName: 'Proposed Document Number' },
    { field: 'proposedVersionNumber', headerName: 'Proposed Version Number' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'dateOfCreation', headerName: 'Date of Creation' },
    { field: 'dateOfApproval', headerName: 'Date of Approval' },
    { field: 'requestCreatedBy', headerName: 'Requested By' },
    { field: 'requestCreatedOn', headerName: 'Requested On' },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By' },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On' },
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
    private _notification: NotificationService,
    private _documentAttribute: DocumentAttributeService,
    private _documentAttributeService: DocumentAttributeService,
    private _UtilitiesService: UtilitiesService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this.hasSelectedRows = false;
    this.GetLoginEmpId();

    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
       
      this.GetAllPendingDocuments();
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
      employeeCode: this.selectedEmployee,
      RequestStatus: this.selectedTab == 'Disapproved' ? 'Rejected' : this.selectedTab,
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      searchTerm: this.currentGridQuery.searchTerm || '',
      // Map to satisfy backend validation
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: this.currentGridQuery.searchTerm || '',
      empid : this.loginEmpId
    };

    // The deduplication magic: Block duplicate API calls for identical parameters
    const payloadString = JSON.stringify(payLoad);
    if (this.lastFetchPayload === payloadString) {
      return; // Silently drop identical concurrent requests
    }
    this.lastFetchPayload = payloadString;
   
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
              requestId: get(['Id', 'id']), // often same as Id
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
              dateOfCreation: this.formatDate(createdAtRaw), // ← see helper below
              requestCreatedOn: get(['RequestCreatedAt', 'requestCreatedAt']),
              startedAt: this.formatDate(startedAtRaw),

              // Previous version info (only if present in real payloads)
              previsousVersionCreatedBy: get(['RequestCreatedBy', 'requestCreatedBy'], ''),
              previousVersionCreatedOn: this.formatDate(
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
        this._notification.createNotification('error', 'Error', 'Failed to fetch documents.');
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
      this.pageSize = event.pageSize;
      this.currentGridQuery.pageSize = this.pageSize;
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
    this.attributes = [];
  }

  approveDocument() {
    //alert('Approve action triggered for selected rows');
    debugger;
    if (this.observation == '' || this.observation == null) {
      this._notification.createNotification('error', 'Error', 'Observation is required');
      return;
    }
    const payLoad = {
      documentid: this.documentId,
      executionid: this.executionId,
      action: 'APPROVE',
      observation: this.observation,
      employeeCode: this.selectedEmployee,
    };

    this._documentService.approveDocument(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notification.createNotification('success', 'Workflow', response.Message);
        }
      },
      error: (err) => {
        this._notification.createNotification(
          'error',
          'Document Approve',
          'Failed to create workflow step.',
        );
      },
    });
  }

  disapprove() {
    debugger;
    if (this.observation == '' || this.observation == null) {
      this._notification.createNotification('error', 'Error', 'Observation is required');
      return;
    }
    const payLoad = {
      documentid: this.documentId,
      executionid: this.executionId,
      action: 'Rejected',
      observation: this.observation,
      employeeCode: this.selectedEmployee,
    };

    this._documentService.rejectDocument(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notification.createNotification('success', 'Workflow', response.Message);
        }
      },
      error: (err) => {
        this._notification.createNotification(
          'error',
          'Document Rejected',
          'Failed to create workflow step.',
        );
      },
    });
  }

  revert() {
    debugger;
    if (this.observation == '' || this.observation == null) {
      this._notification.createNotification('error', 'Error', 'Observation is required');
      return;
    }
    const payLoad = {
      documentid: this.documentId,
      executionid: this.executionId,
      action: 'Rework',
      observation: this.observation,
      employeeCode: this.selectedEmployee,
    };

    this._documentService.revertDocument(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notification.createNotification('success', 'Workflow', response.Message);
        }
      },
      error: (err) => {
        this._notification.createNotification(
          'error',
          'Document Rework',
          'Failed to create workflow step.',
        );
      },
    });
  }
  export() {}

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
        mode: this.selectedTab === 'Pending' ? 'input' : 'view',
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
      this._notification.createNotification(
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
