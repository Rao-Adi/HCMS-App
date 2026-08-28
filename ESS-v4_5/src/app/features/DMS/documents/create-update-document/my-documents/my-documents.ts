import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { DocumentService } from '@app/shared/services/document.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetSelection } from '@app/shared/interfaces/interfaces';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

// Status badge styling for a Document's lifecycle CurrentStatus (Draft / Pending Approval /
// Authorization Pending / Training Pending / Approved / Authorized / Effective / Rejected --
// see DocumentComponent.GetMyDocumentsAsync). Matched by keyword rather than an exact-string
// dictionary since CurrentStatus is a free-text state Name, not a fixed code, so this stays
// correct even if the exact wording of a state's Name changes -- mirrors the same
// pending/approved/rejected color convention used by my-total-requests.ts and my-approval-request.ts.
function documentStatusBadge(status: string): { color: string; bg: string; border: string } {
  const s = (status || '').toLowerCase();
  if (s.includes('reject')) return { color: '#ef4444', bg: '#fef2f2', border: '#fee2e2' };
  if (s.includes('draft')) return { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };
  if (s.includes('pending') || s.includes('progress') || s.includes('rework') || s.includes('revert')) {
    return { color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' };
  }
  if (s.includes('approv') || s.includes('effective') || s.includes('authoriz')) {
    return { color: '#10b981', bg: '#ecfdf5', border: '#d1fae5' };
  }
  return { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };
}

@Component({
  selector: 'app-my-documents',
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
  templateUrl: './my-documents.html',
  styleUrl: './my-documents.css',
})
export class MyDocuments {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;

  pageSize = 10;
  totalRows = 0;
  documentsData: any[] = [];

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

  documentColumnDefs: ColDef[] = [
    { field: 'documentNumber', headerName: 'Document Number', minWidth: 150 },
    { field: 'documentType', headerName: 'Document Type', minWidth: 150 },
    {
      field: 'title',
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
    { field: 'version', headerName: 'Version', minWidth: 100 },
    { field: 'division', headerName: 'Division', minWidth: 130 },
    { field: 'department', headerName: 'Department', minWidth: 130 },
    { field: 'subDepartment', headerName: 'Sub-Department', minWidth: 140 },
    { field: 'businessDomain', headerName: 'Business Domain', minWidth: 140 },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 140,
      cellRenderer: (params: any) => {
        const badge = documentStatusBadge(params.value);
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
            ${params.value || 'Draft'}
          </span>
        `;
      },
    },
    { field: 'createdOn', headerName: 'Created On', minWidth: 160, cellClass: 'audit-cell' },
    { field: 'createdBy', headerName: 'Created By', minWidth: 150, cellClass: 'audit-cell' },
    { field: 'lastModifiedOn', headerName: 'Last Modified On', minWidth: 160, cellClass: 'audit-cell' },
    { field: 'lastModifiedBy', headerName: 'Last Modified By', minWidth: 150, cellClass: 'audit-cell' },
  ];

  columnToggles = this.documentColumnDefs.map((c) => ({
    field: c.field as string,
    label: c.headerName as string,
    visible: true,
  }));

  constructor(
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
    private modal: NzModalService,
  ) {}

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
  // GetAllMyDocuments() directly only reassigns documentsData, which AG Grid's infinite cache
  // doesn't pick up on its own. refresh() (-> gridApi.refreshInfiniteCache()) is what actually
  // re-fetches with the new filters and re-renders, which is why filter changes weren't
  // reflected even though the backend was already returning the updated records.
  private refreshGrid(): void {
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.GetAllMyDocuments();
    }
  }

  GetAllMyDocuments(query?: any) {
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

    this._documentService.getMyDocuments(payload).subscribe({
      next: (response) => {
        if (response?.Success) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.documentsData = items.map((item: any) => ({
            id: item.Id || item.id,
            documentNumber: item.DocumentNumber || item.documentnumber,
            documentType: item.DocumentType || item.documenttype,
            title: item.Title || item.title,
            version: item.Version || item.version,
            division: item.Division || item.division,
            department: item.Department || item.department,
            subDepartment: item.SubDepartment || item.subdepartment,
            businessDomain: item.BusinessDomain || item.businessdomain,
            status: item.CurrentStatus || item.currentstatus || 'Draft',
            url: item.DocumentURL || item.documenturl,
            proposedContent:
              item.ProposedContent ||
              item.proposedcontent ||
              item.VersionContent ||
              item.versioncontent ||
              item.content,
            createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdat || ''),
            createdBy: item.CreatedByName || item.createdbyname || item.CreatedBy || item.createdby,
            lastModifiedOn: new CustomDateFormatPipe().transform(
              item.LastModifiedAt || item.lastmodifiedat || '',
            ),
            lastModifiedBy:
              item.LastModifiedByName ||
              item.lastmodifiedbyname ||
              item.LastModifiedBy ||
              item.lastmodifiedby,
          }));
        } else {
          this.documentsData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this.documentsData = [];
        this.totalRows = 0;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to fetch your documents.',
        );
      },
    });
  }

  // Follows the same pattern as my-approval-document.ts's exportDocuments() -- backend returns
  // a real .xlsx workbook (see DocumentComponent.ExportMyDocumentsListAsync), so the blob is
  // used exactly as the server sent it rather than re-wrapped in a hardcoded MIME type.
  exportDocuments(): void {
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

    this._documentService.exportMyDocumentsList(payload).subscribe({
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

        let filename = `My Documents - (${new Date().toISOString().split('T')[0]}).xlsx`;
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
          'Document list exported successfully!',
        );
      },
      error: (err) => {
        console.error('Export failed', err);
        this._notificationToastService.createNotification(
          'error',
          'Export',
          'Failed to export document list.',
        );
      },
    });
  }

  openDocumentModal(rowData: any) {
    this.templateHtml = rowData.proposedContent || '';
    this.documentId = rowData.id || rowData.Id;
    this.currentDocumentName = rowData.title || rowData.Title || '';
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
}