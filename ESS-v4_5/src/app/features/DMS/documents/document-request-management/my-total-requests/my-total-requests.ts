import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ColumnToggle } from '@app/shared/interfaces/interfaces';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { FormsModule } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

// Status badge styling per DocumentRequestStatus (0-4) plus the Reverted case, which shares
// Status 0 (Draft) with a genuinely new draft -- the backend tells them apart via IsReworked
// (see DocumentRequestComponent.GetMyTotalRequestsAsync), the same distinction already used by
// the dashboard's Draft/Reverted split and by my-approval-request.ts's status badge.
const STATUS_BADGES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Draft: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  Reverted: { label: 'Reverted', color: '#6366f1', bg: '#f5f3ff', border: '#ddd6fe' },
  Submitted: { label: 'Submitted', color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' },
  'In Approval': { label: 'In Approval', color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' },
  Approved: { label: 'Approved', color: '#10b981', bg: '#ecfdf5', border: '#d1fae5' },
  Rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2', border: '#fee2e2' },
};

function statusLabel(status: number, isReworked: boolean): string {
  switch (status) {
    case 0:
      return isReworked ? 'Reverted' : 'Draft';
    case 1:
      return 'Submitted';
    case 2:
      return 'In Approval';
    case 3:
      return 'Approved';
    case 4:
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

@Component({
  selector: 'app-my-total-requests',
  imports: [CommonModule, FormsModule, AgGridWrapper],
  templateUrl: './my-total-requests.html',
  styleUrl: './my-total-requests.css',
})
export class MyTotalRequests {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

  pageSize = 10;
  totalRows = 0;
  documentRequestsData: any[] = [];

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
    flex: 1,
    minWidth: 100,
  };

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subdepartment', label: 'Sub-Department' },
    4: { field: 'businessdomain', label: 'Business Domain' },
  };

  private readonly leadingColumnDefs: ColDef[] = [
    { field: 'requestNumber', headerName: 'Request Number', minWidth: 140 },
    { field: 'documentType', headerName: 'Document Type', minWidth: 150 },
    { field: 'documentName', headerName: 'Document Title', minWidth: 200 },
    {
      field: 'justification',
      headerName: 'Justification',
      minWidth: 130,
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
  ];

  private readonly trailingColumnDefs: ColDef[] = [
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 140,
      cellRenderer: (params: any) => {
        const badge = STATUS_BADGES[params.value] || STATUS_BADGES['Draft'];
        return `
          <span style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 12px;
            font-size: 12px;
            font-weight: 600;
            line-height: 1;
            color: ${badge.color};
            background-color: ${badge.bg};
            border: 1px solid ${badge.border};
            border-radius: 9999px;
          ">
            ${badge.label}
          </span>
        `;
      },
    },
    { field: 'createdOn', headerName: 'Created On', minWidth: 160, cellClass: 'audit-cell' },
    { field: 'createdBy', headerName: 'Created By', minWidth: 150, cellClass: 'audit-cell' },
    { field: 'lastModifiedOn', headerName: 'Last Modified On', minWidth: 160, cellClass: 'audit-cell' },
    { field: 'lastModifiedBy', headerName: 'Last Modified By', minWidth: 150, cellClass: 'audit-cell' },
  ];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out
  // showing just the fixed columns until we know which levels are enabled.
  documentColumnDefs: ColDef[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs];

  columnToggles?: ColumnToggle[] = [
    { field: 'requestNumber', label: 'Request Number', visible: true },
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Title', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'status', label: 'Status', visible: true },
    { field: 'createdOn', label: 'Created On', visible: true },
    { field: 'createdBy', label: 'Created By', visible: true },
    { field: 'lastModifiedOn', label: 'Last Modified On', visible: true },
    { field: 'lastModifiedBy', label: 'Last Modified By', visible: true },
  ];

  constructor(
    private _documentRequestService: DocumentRequestService,
    private _notificationToastService: NotificationToastService,
    private modal: NzModalService,
    private _cabinetHierarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit() {
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
        ...activeLevelDefs.map((def) => ({ field: def.field, headerName: def.title, minWidth: 150 })),
        ...this.trailingColumnDefs,
      ];

      this.columnToggles = [
        { field: 'requestNumber', label: 'Request Number', visible: true },
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentName', label: 'Document Title', visible: true },
        { field: 'justification', label: 'Justification', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'status', label: 'Status', visible: true },
        { field: 'createdOn', label: 'Created On', visible: true },
        { field: 'createdBy', label: 'Created By', visible: true },
        { field: 'lastModifiedOn', label: 'Last Modified On', visible: true },
        { field: 'lastModifiedBy', label: 'Last Modified By', visible: true },
      ];
    });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.pageSize = event.pageSize;
      this.currentGridQuery.pageSize = this.pageSize;
    }
  }

  GetAllMyTotalRequests(query?: any) {
    const searchText = query?.searchText || query?.filterModel?.fname?.filter || '';

    if (query && typeof query === 'object') {
      this.currentGridQuery = query;
    } else {
      this.currentGridQuery.pageNumber = 1;
    }

    const sortModel = this.currentGridQuery.sortModel || [];
    let sortBy = 'DESC';
    let sortColumn = 'CreatedAt';
    if (sortModel.length > 0) {
      sortColumn = sortModel[0].colId;
      sortBy = sortModel[0].sort === 'asc' ? 'ASC' : 'DESC';
    }

    const payload = {
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: searchText || '',
    };

    this._documentRequestService.getMyTotalRequests(payload).subscribe({
      next: (response) => {
        if (response?.Success) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.documentRequestsData = items.map((item: any) => {
            const status = item.Status ?? item.status ?? 0;
            const isReworked = item.IsReworked ?? item.isReworked ?? false;
            return {
              id: item.Id || item.id,
              requestNumber: item.RequestNumber || item.requestNumber,
              documentType: item.DocumentType || item.documentType,
              documentName: item.DocumentName || item.documentName,
              justification: item.Justification || item.justification || '',
              division: item.Division,
              department: item.Department,
              subdepartment: item.SubDepartment,
              businessdomain: item.BusinessDomain,
              status: statusLabel(status, isReworked),
              createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdAt || ''),
              createdBy: item.CreatedByName || item.createdByName || item.CreatedBy || item.createdBy,
              lastModifiedOn: new CustomDateFormatPipe().transform(
                item.LastModifiedAt || item.lastModifiedAt || '',
              ),
              lastModifiedBy:
                item.LastModifiedByName || item.lastModifiedByName || item.LastModifiedBy || item.lastModifiedBy,
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
          err?.Message || 'Failed to fetch total requests.',
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
}