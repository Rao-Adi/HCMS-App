import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { UncontrolledDocumentService } from '@app/shared/services/uncontrolled-document.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { ColDef } from 'ag-grid-community'; 
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { UncontrolledDocumentFormModal } from './uncontrolled-document-form-modal/uncontrolled-document-form-modal';
import { UncontrolledDocumentHistoryModal } from './uncontrolled-document-history-modal/uncontrolled-document-history-modal';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { AppConfigService } from '@app/core/services/app-config';
import { resolveUploadUrl } from '@app/shared/utils/resolve-upload-url';

@Component({
  selector: 'app-uncontrolled-documents',
  standalone: true,
  imports: [CommonModule, AgGridWrapper, NzModalModule, SafeTranslatePipe],
  templateUrl: './uncontrolled-documents.html',
  styleUrl: './uncontrolled-documents.css',
})
export class UncontrolledDocuments implements OnInit {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'uncontrolleddocuments';

  documentsData: any[] = [];
  totalRows = 0;
  pageSize = 10;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
    flex: 1,
    minWidth: 100,
  };

  columnDefs: ColDef[] = [
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'reviewDate', headerName: 'Review Date' },
    { field: 'reviewAuthorityName', headerName: 'Review Authority' },
    { field: 'createdByName', headerName: 'Uploaded By' },
    { field: 'createdAt', headerName: 'Uploaded On', cellClass: 'audit-cell' },
    { field: 'lastModifiedByName', headerName: 'Last Updated By' },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filter: false,
      // Arrow function closes over `this`, so it re-reads canEdit/canDelete at render time --
      // permissions load in ngOnInit alongside (and well before) the grid's own data actually
      // renders any rows.
      cellRenderer: () => `
        ${
          this.canEdit
            ? `<button class="btn btn-sm btn-outline-primary me-1" data-action="review" title="Review / Replace File">
                 <i class="bi bi-arrow-repeat"></i>
               </button>`
            : ''
        }
        <button class="btn btn-sm btn-outline-secondary me-1" data-action="history" title="History">
          <i class="bi bi-clock-history"></i>
        </button>
        <a data-action="download" title="Download" class="btn btn-sm btn-outline-success me-1">
          <i class="bi bi-download"></i>
        </a>
        ${
          this.canDelete
            ? `<button class="btn btn-sm btn-outline-danger" data-action="delete" title="Delete">
                 <i class="bi bi-trash"></i>
               </button>`
            : ''
        }
      `,
    },
  ];

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

  constructor(
    private _uncontrolledDocumentService: UncontrolledDocumentService,
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
    private _config: AppConfigService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });
  }

  GetAllDocuments(query?: any) {
    if (query && typeof query === 'object') {
      this.currentGridQuery = query;
    } else {
      this.currentGridQuery.pageNumber = 1;
    }

    const payload = {
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortColumn: this.currentGridQuery.sortModel?.[0]?.colId || '',
      sortBy: this.currentGridQuery.sortModel?.[0]?.sort || '',
      searchText: this.currentGridQuery.searchTerm || '',
      isActive: true,
    };

    this._uncontrolledDocumentService.getAll(payload).subscribe({
      next: (res: any) => {
        if (res?.Success && res?.Data) {
          this.totalRows = res.Data.TotalCount || 0;
          this.documentsData = (res.Data.Items || []).map((item: any) => ({
             id: item.Id ?? item.id,
            documentName: item.DocumentName ?? item.documentName,
            documentUrl: item.DocumentURL ?? item.documentURL,
            reviewDate: new CustomDateFormatPipe().transform(item.ReviewDate) ?? new CustomDateFormatPipe().transform(item.reviewDate),
            // Kept alongside the display-formatted `reviewDate` above -- the Review modal's
            // native <input type="date"> needs a raw, parseable value (it can't read "Sep 11,
            // 2026 00:00:00"), so it reads this field instead when prefilling.
            reviewDateRaw: item.ReviewDate ?? item.reviewDate,
            reviewAuthorityEmpCode: item.ReviewAuthorityEmpCode ?? item.reviewAuthorityEmpCode,
            reviewAuthorityName: item.ReviewAuthorityName ?? item.reviewAuthorityName,
            createdByName: item.CreatedByName ?? item.createdByName,
            createdAt: new CustomDateFormatPipe().transform(item.CreatedAt) ?? new CustomDateFormatPipe().transform(item.createdAt),
            lastModifiedByName: item.LastModifiedByName ?? item.lastModifiedByName,
          }));
        }
      },
      error: () => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          'Failed to load Uncontrolled Documents.',
        );
      },
    });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.pageSize = event.pageSize;
  }

  onActionClicked(event: any) {
    const action = event.event?.target?.closest('[data-action]')?.getAttribute('data-action');
    if (!action) return;

    switch (action) {
      case 'review':
        this.openReviewModal(event.data);
        break;
      case 'history':
        this.openHistoryModal(event.data);
        break;
      case 'download':
        window.open(resolveUploadUrl(event.data.documentUrl, this._config.baseUrl), '_blank');
        break;
      case 'delete':
        this.deleteDocument(event.data);
        break;
    }
  }

  openUploadModal() {
    if (!this.canAdd) return;
    const modalRef = this.modal.create({
      nzTitle: 'Upload Document',
      nzContent: UncontrolledDocumentFormModal,
      nzData: { mode: 'create' },
      nzFooter: null,
      nzWidth: '600px',
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) {
        this.agGridWrapper?.refresh();
      }
    });
  }

  openReviewModal(rowData: any) {
    if (!this.canEdit) return;
    const modalRef = this.modal.create({
      nzTitle: 'Review Document',
      nzContent: UncontrolledDocumentFormModal,
      nzData: { mode: 'review', record: rowData },
      nzFooter: null,
      nzWidth: '600px',
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) {
        this.agGridWrapper?.refresh();
      }
    });
  }

  openHistoryModal(rowData: any) {
    this.modal.create({
      nzTitle: `Review History — ${rowData.documentName}`,
      nzContent: UncontrolledDocumentHistoryModal,
      nzData: { id: rowData.id },
      nzFooter: null,
      nzWidth: '70%',
    });
  }

  deleteDocument(rowData: any) {
    this.modal.confirm({
      nzTitle: 'Delete Uncontrolled Document?',
      nzContent: `Are you sure you want to delete "${rowData.documentName}"? This cannot be undone.`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this._uncontrolledDocumentService.delete(rowData.id).subscribe({
          next: (res: any) => {
            if (res?.Success) {
              this._notificationToastService.createNotification(
                'success',
                'Uncontrolled Document',
                'Deleted successfully.',
              );
              this.agGridWrapper?.refresh();
            }
          },
          error: () => {
            this._notificationToastService.createNotification('error', 'Error', 'Failed to delete document.');
          },
        });
      },
    });
  }
}