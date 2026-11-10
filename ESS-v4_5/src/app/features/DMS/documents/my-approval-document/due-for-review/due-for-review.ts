import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColDef } from 'ag-grid-community';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { DocumentService } from '@app/shared/services/document.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';

/**
 * "Due for Review" tab of My Approvals - Documents.
 *
 * Lists the Effective documents whose Next Review Date is within 60 days (or already past) and in whose approval workflow the signed-in person
 * was an approver. Any one of those approvers can "Re-approve" such a document when nothing in it needs to change: no workflow runs, no new
 * version is made, the review is recorded and the Next Review Date moves on by the document type's Review Years. (To change the document
 * instead, it is revised as usual from Create / Update Document.)
 */
@Component({
  selector: 'app-document-due-for-review',
  imports: [CommonModule, FormsModule, AgGridWrapper, NzModalModule],
  templateUrl: './due-for-review.html',
})
export class DocumentDueForReview {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('remarksTpl') remarksTpl!: TemplateRef<any>;

  /** Raised after documents were re-approved, so the tab badge on the page can refresh. */
  @Output() changed = new EventEmitter<void>();

  rowData: any[] = [];
  totalRows = 0;
  selectedPageSize = 10;
  selectedRows: any[] = [];
  hasSelectedRows = false;
  remarks = '';
  isProcessing = false;

  private currentGridQuery: any = { pageNumber: 1, pageSize: 10, sortModel: [], filterModel: {}, searchTerm: '' };

  defaultColDef: ColDef = { filter: true, cellDataType: false, editable: false };

  columnDefs: ColDef[] = [
    { field: 'documentNumber', headerName: 'Document Number' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'version', headerName: 'Version' },
    { field: 'nextReviewDate', headerName: 'Next Review Date', cellClass: 'audit-cell' },
    {
      field: 'daysLeft',
      headerName: 'Review Due',
      valueFormatter: (p: any) => {
        const days = Number(p.value);
        if (p.value === null || p.value === undefined || isNaN(days)) return '';
        if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
        if (days === 0) return 'Due today';
        return `In ${days} day${days === 1 ? '' : 's'}`;
      },
      cellStyle: (p: any) => (Number(p.value) < 0 ? { color: '#dc2626', fontWeight: '600' } : null),
    },
    { field: 'reviewYears', headerName: 'Review Period (Years)' },
    { field: 'lastReviewedOn', headerName: 'Last Reviewed On', cellClass: 'audit-cell' },
    { field: 'lastReviewedBy', headerName: 'Last Reviewed By', cellClass: 'audit-cell' },
  ];

  constructor(
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
    private modal: NzModalService,
  ) {}

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.selectedPageSize = event.pageSize;
      this.currentGridQuery.pageSize = this.selectedPageSize;
    }
  }

  onSelectionChange(selectedRows: any[]) {
    this.selectedRows = selectedRows || [];
    this.hasSelectedRows = this.selectedRows.length > 0;
  }

  loadDocuments(query?: any) {
    if (query && typeof query === 'object') {
      this.currentGridQuery = query;
    } else {
      this.currentGridQuery.pageNumber = 1;
    }

    const sortModel = this.currentGridQuery.sortModel || [];
    let sortBy = 'ASC';
    let sortColumn = 'NextReviewDate';
    if (sortModel.length > 0) {
      sortColumn = sortModel[0].colId;
      sortBy = sortModel[0].sort === 'asc' ? 'ASC' : 'DESC';
    }

    const payLoad = {
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.selectedPageSize || 10,
      sortModel: sortModel,
      filterModel: this.currentGridQuery.filterModel || {},
      searchTerm: this.currentGridQuery.searchTerm || '',
      sortBy,
      sortColumn,
      searchText: this.currentGridQuery.searchTerm || '',
    };

    this._documentService.getDocumentsDueForReview(payLoad).subscribe({
      next: (response) => {
        if (!response?.Success) return;
        const data = response.Data;
        const items = data?.Items || (Array.isArray(data) ? data : []);
        this.totalRows = data?.TotalCount ?? items.length;

        // The backend answers in PascalCase or camelCase depending on the serializer; read either.
        const get = (item: any, key: string, fallback: any = '') => {
          const v = item[key] ?? item[key.charAt(0).toLowerCase() + key.slice(1)] ?? item[key.toLowerCase()];
          return v === undefined || v === null ? fallback : v;
        };

        this.rowData = items.map((item: any) => ({
          id: get(item, 'Id'),
          documentNumber: get(item, 'DocumentNumber'),
          documentName: get(item, 'Title'),
          documentType: get(item, 'DocumentType'),
          division: get(item, 'Division'),
          department: get(item, 'Department'),
          subDepartment: get(item, 'SubDepartment'),
          version: get(item, 'Version'),
          nextReviewDate: get(item, 'NextReviewDate'),
          daysLeft: get(item, 'DaysLeft', null),
          reviewYears: get(item, 'ReviewPeriodYears'),
          lastReviewedOn: this.formatDateTime(get(item, 'LastReviewedAt', '')),
          lastReviewedBy: get(item, 'LastReviewedBy'),
        }));
        this.selectedRows = [];
        this.hasSelectedRows = false;
      },
      error: (err) => {
        this._notificationToastService.createNotification(
          'error',
          'Due for Review',
          err?.error?.Message || 'The documents due for review could not be loaded.',
        );
      },
    });
  }

  private formatDateTime(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime())
      ? String(value)
      : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /** Asks for an optional remark, then re-approves every ticked document. */
  promptReapprove() {
    if (!this.hasSelectedRows || this.isProcessing) return;

    const targets = this.selectedRows.map((r: any) => ({ id: r.id, name: r.documentName || r.documentNumber }));
    this.remarks = '';

    this.modal.confirm({
      nzTitle: targets.length === 1 ? 'Re-approve Document' : `Re-approve ${targets.length} Documents`,
      nzContent: this.remarksTpl,
      nzOkText: 'Re-approve',
      nzOnOk: () => this.runReapprovals(targets),
    });
  }

  /** One document at a time; a failure does not stop the rest, and everything is reported together at the end. */
  private async runReapprovals(targets: { id: number; name: string }[]): Promise<void> {
    this.isProcessing = true;
    let ok = 0;
    const failed: string[] = [];
    let lastMessage = '';
    const remarks = (this.remarks || '').trim();

    for (const t of targets) {
      try {
        const res: any = await this._documentService
          .reapproveDocumentReview({ documentId: t.id, remarks })
          .toPromise();
        if (res?.Success) {
          ok++;
          lastMessage = res.Message || '';
        } else {
          failed.push(`${t.name}: ${res?.Message || 'failed'}`);
        }
      } catch (err: any) {
        failed.push(`${t.name}: ${err?.error?.Message || 'failed'}`);
      }
    }

    this.isProcessing = false;

    if (ok > 0) {
      this._notificationToastService.createNotification(
        'success',
        'Due for Review',
        ok === 1 && targets.length === 1 ? lastMessage || 'Document re-approved.' : `${ok} document${ok === 1 ? '' : 's'} re-approved.`,
      );
    }
    if (failed.length > 0) {
      this._notificationToastService.createNotification('error', 'Due for Review', failed.join('\n'));
    }

    this.selectedRows = [];
    this.hasSelectedRows = false;
    if (this.agGridWrapper) this.agGridWrapper.refresh();
    this.changed.emit();
  }
}
