import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
import { MyPendingRequestForApproval } from './my-pending-request-for-approval/my-pending-request-for-approval';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ObservationModalPopup } from './observation-modal-popup/observation-modal-popup';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { NotificationService } from '@app/shared/notification/notification.service';
import { UserService } from '@app/shared/services/user-service';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';

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
    MyPendingRequestForApproval,
    CabinetStructureList,
    DMSRichTextEdit,
    NzSelectModule,
  ],
  templateUrl: './my-approval-request.html',
  styleUrl: './my-approval-request.css',
})
export class MyApprovalRequest {
  selectedTab: string = 'Pending';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';
  templateHtml: string = '';

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  pageSize = 10;
  totalPendingDocuments = 0;
  totalApprovedDocuments = 0;
  totalDisApprovedDocuments = 0;
  rowData: any[] = [];
  public noRowsOverlay: string = '';

  documentRequestsData: any[] = [];
  totalRows = 0;
  // Track selection state
  hasSelectedRows = false;
  stepId: number = 0;
  selectedRow: any = null;
  employees: any[] = [];
  selectedEmployee?: string = '';
  observation: string = '';

  companies: SelectList[] = [
    { CODE: '1', NAME: 'ATCO' },
    { CODE: '2', NAME: 'Softronic' },
  ];

  documentColumnDefs = [
    {
      field: 'documentType',
      headerName: 'Document Type',
    },
    {
      field: 'requestId',
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

  constructor(
    private _doumentRequestService: DocumentRequestService,
    private modal: NzModalService,
    private _notification: NotificationService,
    private _userService: UserService,
  ) {}

  ngOnInit() {
    this.getAllUsersList();
    // this.GetAllPendingDocuments({
    //   pageNumber: 1,
    //   pageSize: this.pageSize,
    //   sortModel: [],
    //   filterModel: {},
    // });

    this.hasSelectedRows = false;
  }

  onDivisionChange(value: string): void {
    this.selectedDivisions = value;
    this.emptyAllFileds();
  }
  onDepartmentsChange(value: string): void {
    this.selectedDepartment = value;
    this.emptyAllFileds();
  }

  emptyAllFileds() {
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.templateHtml = '';
  }

  async onDocumentTypeChange(value: string) {
    // this.loading = true;
    this.selectedDocumentType = value;
    await this.GetAllPendingDocuments('');
    this.emptyAllFileds();
  }

  async onTabChange(status: string) {
    this.selectedTab = status;
    await this.GetAllPendingDocuments('');
    this.emptyAllFileds();
  }

  onEmployeeChange(value: string): void {
    this.selectedEmployee = value;
    this.emptyAllFileds();
    if (value != null) {
      this.GetAllPendingDocuments(value);
    }
  }

  GetAllPendingDocuments(query: any) {
    if(this.selectedEmployee == ""){
      return;
    }
    const payload = {
      companyId: 1,
      userId: 1,
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      documentTypeCode: this.selectedDocumentType,
      employeeCode: this.selectedEmployee,
      RequestStatus: this.selectedTab,
    };
    this._doumentRequestService.getMyPendingDocumentRequest(payload).subscribe({
      next: (response) => {
        if (response?.Success) {
          if (response?.Data) {
            this.totalRows = response.Data.TotalCount;
            this.documentRequestsData = response.Data.map((item: any) => ({
              Id: item.id || item.Id,
              requestId: item.Id || item.id,
              documentType: item.DocumentType || item.documentType,
              proposedDocumentNumber: item.RequestNumber || item.requestNumber,
              stepId: item.StepId || item.stepId,
              stepOrder: item.StepOrder || item.stepOrder,
              startedAt: item.StartedAt || item.startedAt,
              division: item.Division,
              documentId: item.DocumentNumber,
              documentName: item.DocumentName,
              proposedContent: item.ProposedContent,
              department: item.Department,
              departmentId: item.DepartmentCode,
              subdepartment: item.SubDepartment,
              justification: item.Justification,
              businessdomainId: item.BusinessDomainCode,
              requestCreatedBy: item.createdBy || item.CreatedBy || '',
              dateOfCreation: new CustomDateFormatPipe().transform(
                item.createdAt || item.CreatedAt || '',
              ),
              requestCreatedOn: new CustomDateFormatPipe().transform(
                item.createdAt || item.CreatedAt || '',
              ),
              previousVersionCreatedOn:
                item.draftContentLastModifiedAt || item.DraftContentLastModifiedAt || '',
              proposedVersionNumber: item.RowVersion || item.rowVersion,
            }));
          } else {
          }
        }
      },
      error: (err) => {
        this._notification.createNotification(
          'error',
          'Error',
          err?.Message || 'Failed to fetch documents.',
        );
      },
    });
  }
  GetAllApprovedDocuments(query: any) {}
  GetAllDisApprovedDocuments(query: any) {}
  GetAllDocuments(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'pendingGrid':
        this.divisionPageSize = pageSize;
        this.GetAllPendingDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;

      case 'approvedGrid':
        this.employeePageSize = pageSize;
        this.GetAllApprovedDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'disapprovedGrid':
        this.employeePageSize = pageSize;
        this.GetAllDisApprovedDocuments({
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
  }

  // handleGridAction(event: { action: string; rowData: any }) {
  //   if (event.action === 'VIEW_CABINET') {
  //     this.openWorkflowDeatilsModal(event.rowData);
  //   }
  // }

  // Handle selection changes
  onSelectionChange(selectedRows: any): void {
    this.hasSelectedRows = selectedRows && selectedRows.length > 0;
    this.templateHtml = selectedRows[0]?.proposedContent || '';
    this.stepId = selectedRows[0]?.stepId || 0; // Assuming stepId is part of rowData
    this.selectedRow = selectedRows[0] || null;
  }

  onCellClicked(event: any): void {
    this.templateHtml = event.data?.proposedContent || '';
  }

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.Id,
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
      nzWidth: 850,
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
      companyId: 1,
      stepId: this.stepId,
      userId: 1,
      action: action,
      observation: observation,
    };

    this._doumentRequestService.takeWorkflowActionOnDocumentRequest(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notification.createNotification('success', 'Request', response.Message);
          this.GetAllPendingDocuments('');
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

  export() {}

  getAllUsersList = () => {
    this._userService.getUserList().subscribe((res) => {
      if (res?.Data) {
        this.employees = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
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
        id: rowData.Id,
        entityType: 'Request',
        mode: 'view',
        action: 'Approver',
      },
      nzFooter: null,
      nzWidth: 850,
    });

    modalRef.afterClose.subscribe((result) => {
      if (!result) return;
      this.observation = result.observation;
    });
  }
}
