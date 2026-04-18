import { Component, ViewChild } from '@angular/core';
import { ColumnToggle } from '@app/shared/interfaces/interfaces';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NotificationService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { UserService } from '@app/shared/services/user-service';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { PermissionService } from '@app/shared/services/permission.service';

export enum DocumentRequestStatus {
  Draft = 0,
  Submitted = 1,
  InApproval = 2,
  Approved = 3,
  Rejected = 4,
}

@Component({
  selector: 'app-pending-request-for-approval',
  imports: [CommonModule, FormsModule, AgGridWrapper, NzSelectModule],
  templateUrl: './pending-request-for-approval.html',
  styleUrl: './pending-request-for-approval.css',
})
export class PendingRequestForApproval {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'create-update-document';

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
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

  employees: any[] = [];
  selectedEmployee?: string = '';
  selectedStatus: number = 0;
  documentRequestsData: any[] = [];

  requestId: number = 0;
  submittedby: number = 0;

  DocumentRequestStatusOptions = [
    { value: DocumentRequestStatus.Draft, label: 'Draft' },
    { value: DocumentRequestStatus.Submitted, label: 'Submitted' },
    { value: DocumentRequestStatus.InApproval, label: 'In Approval' },
    { value: DocumentRequestStatus.Approved, label: 'Approved' },
    { value: DocumentRequestStatus.Rejected, label: 'Rejected' },
  ];

  documentColumnDefs = [
    {
      field: 'requestId',
      headerName: 'RequestId',
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
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentName', headerName: 'Document Title' },
    { field: 'justification', headerName: 'Justification' },
    { field: 'createdOn', headerName: 'Created On' },
    { field: 'pendingWith', headerName: 'Pending with' },
    { field: 'sumbittedby', headerName: 'sumbittedby', hide: true },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'requestId', label: 'Request Id', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Title', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'createdOn', label: ' Created On', visible: true },
    { field: 'pendingWith', label: 'Pending with', visible: true },
  ];

  constructor(
    private _doumentRequestService: DocumentRequestService,
    private _notification: NotificationService,
    private _peoplePartnerService: PeoplePartnersService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      
      this.getAllUsersList();
      this.GetAllPendingRequests('');
    });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.pageSize = event.pageSize;
      this.currentGridQuery.pageSize = this.pageSize;
    }
  }

  GetAllPendingRequests(query?: any) {
     
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
      //initiator: this.selectedEmployee,
      divisionCode: null,
      departmentCode: null,
      status: this.selectedStatus,
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      searchTerm: this.currentGridQuery.searchTerm || '',
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: this.currentGridQuery.searchTerm || '',
    };

    this._doumentRequestService.GetMyRequestsPendingApproval(payload).subscribe({
      next: (response) => {
        if (response?.Success || response?.Data) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.documentRequestsData = items.map((item: any) => ({
            Id: item.id || item.Id,
            requestId: item.RequestId || item.requestId,
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
            pendingWith: item.CurrentAssignedUser,
            sumbittedby: item.CreatedBy,
            createdOn: new CustomDateFormatPipe().transform(
              item.SubmittedAt || item.submittedAt || '',
            ),
            requestCreatedOn: new CustomDateFormatPipe().transform(
              item.createdAt || item.CreatedAt || '',
            ),
            previousVersionCreatedOn:
              item.draftContentLastModifiedAt || item.DraftContentLastModifiedAt || '',
            proposedVersionNumber: item.RowVersion || item.rowVersion,
          }));
        } else {
          this.documentRequestsData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this._notification.createNotification(
          'error',
          'Error',
          err?.Message || 'Failed to fetch pending requests.',
        );
        this.documentRequestsData = [];
        this.totalRows = 0;
      },
    });
  }

  onEmployeeChange(value: string): void {
    this.selectedEmployee = value;
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.GetAllPendingRequests();
    }
  }

  onSelectionChange(selectedRows: any): void {
    this.requestId = selectedRows[0].requestId;
    this.submittedby = selectedRows[0].sumbittedby;
    // this.hasSelectedRows = selectedRows && selectedRows.length > 0;
    // this.templateHtml = selectedRows[0]?.proposedContent || '';
    // this.stepId = selectedRows[0]?.stepId || 0; // Assuming stepId is part of rowData
  }

  onStatusChange(value: number): void {
    this.selectedStatus = value;
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.GetAllPendingRequests();
    }
  }

  getAllUsersList = () => {
    this._peoplePartnerService.GetEmployeeList().subscribe((res) => {
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
}
