import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CabinetSelection, ColumnToggle } from '@app/shared/interfaces/interfaces';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { FormsModule } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

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
  imports: [
    CommonModule,
    FormsModule,
    AgGridWrapper,
    CabinetStructureList,
    DocumentTypeList,
    SafeTranslatePipe,
    NzModalModule,
    DMSRichTextEdit,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './my-total-requests.html',
  styleUrl: './my-total-requests.css',
})
export class MyTotalRequests {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;

  pageSize = 10;
  totalRows = 0;
  documentRequestsData: any[] = [];

  documentId: number = 0;
  currentDocumentName: string = '';
  templateHtml: string = '';
  draftFileUrl: string = '';

  cabinetHierarchy: CabinetSelection[] = [];
  selectedDivisions: string | null = '';
  selectedDepartment: string | null = '';
  selectedSubDepartment: string | null = '';
  selectedBusinessDomain: string | null = '';
  selectedDocumentType: string = '';

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
    { field: 'requestNumber', headerName: 'Request Number' },
    { field: 'documentType', headerName: 'Document Type'  },
    {
      field: 'documentName',
      headerName: 'Document Title',
      minWidth: 200,
      editable: false,
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

  onHierarchyChange(values: CabinetSelection[]): void {
    this.cabinetHierarchy = values ?? [];
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
    this.refreshGrid();
  }

  onDocumentTypeChange(value: string): void {
    this.selectedDocumentType = value;
    this.refreshGrid();
  }

  // This grid binds (serverQuery), so it's server-side/infinite-row-model -- calling
  // GetAllMyTotalRequests() directly only reassigns documentRequestsData, which AG Grid's
  // infinite cache doesn't pick up on its own. refresh() (-> gridApi.refreshInfiniteCache())
  // is what actually re-fetches with the new filters and re-renders, which is why filter
  // changes weren't reflected even though the backend was already returning updated records.
  private refreshGrid(): void {
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.GetAllMyTotalRequests();
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
      divisionCode: this.selectedDivisions || '',
      departmentCode: this.selectedDepartment || '',
      subDepartmentCode: this.selectedSubDepartment || '',
      businessDomainCode: this.selectedBusinessDomain || '',
      documentTypeCode: this.selectedDocumentType || '',
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
              url: item.DraftFileUrl || item.draftFileUrl || item.draftfileurl || item.DraftFileURL,
              proposedContent:
                item.ProposedContent ||
                item.proposedContent ||
                item.VersionContent ||
                item.versionContent ||
                item.versioncontent ||
                item.Content ||
                item.content,
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

  // Follows the same pattern as my-approval-document.ts's exportDocuments() -- backend returns
  // a real .xlsx workbook (see DocumentRequestComponent.ExportMyTotalRequestsAsync), so the blob
  // is used exactly as the server sent it rather than re-wrapped in a hardcoded MIME type.
  exportRequests(): void {
    const searchText = this.currentGridQuery?.searchText || this.currentGridQuery?.filterModel?.fname?.filter || '';
    const sortModel = this.currentGridQuery.sortModel || [];
    let sortBy = 'DESC';
    let sortColumn = 'CreatedAt';
    if (sortModel.length > 0) {
      sortColumn = sortModel[0].colId;
      sortBy = sortModel[0].sort === 'asc' ? 'ASC' : 'DESC';
    }

    const payload = {
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: searchText || '',
      divisionCode: this.selectedDivisions || '',
      departmentCode: this.selectedDepartment || '',
      subDepartmentCode: this.selectedSubDepartment || '',
      businessDomainCode: this.selectedBusinessDomain || '',
      documentTypeCode: this.selectedDocumentType || '',
    };

    this._documentRequestService.exportMyTotalRequests(payload).subscribe({
      next: (response) => {
        const blob = response.body as Blob;
        if (!blob || blob.size === 0) {
          this._notificationToastService.createNotification(
            'warning',
            'Export',
            'No data available to export.',
          );
          return;
        }

        let filename = `My Document Requests - (${new Date().toISOString().split('T')[0]}).xlsx`;
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
          'Request list exported successfully!',
        );
      },
      error: (err) => {
        console.error('Export failed', err);
        this._notificationToastService.createNotification(
          'error',
          'Export',
          'Failed to export request list.',
        );
      },
    });
  }

  openDocumentModal(rowData: any) {
    this.templateHtml = rowData.proposedContent || '';
    this.documentId = rowData.id || rowData.Id;
    this.currentDocumentName = rowData.documentName || rowData.DocumentName || '';
    let fileUrl = rowData.url || '';

    if (fileUrl && fileUrl.trim()) {
      if (!fileUrl.startsWith('http')) {
        const origin = window.location.origin;
        const relativeUrl = fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl;
        fileUrl = origin + relativeUrl;
      }
      this.draftFileUrl = fileUrl;
    } else {
      this.draftFileUrl = '';
    }

    if (this.draftFileUrl) {
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

  downloadDraft(): void {
    const idToDownload = this.documentId;
    this._documentRequestService.DownloadDraftDocument(idToDownload).subscribe({
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

          let filename = `Draft_${this.currentDocumentName || this.documentId}`;
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