import { Component, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentService } from '@app/shared/services/document.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { ColDef } from 'ag-grid-community';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AppConfigService } from '@app/core/services/app-config';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

@Component({
  selector: 'app-uploaded-documents',
  imports: [
    CommonModule,
    AgGridWrapper,
    NzButtonModule,
    NzIconModule,
    DMSRichTextEdit,
  ],
  templateUrl: './uploaded-documents.html',
  styleUrl: './uploaded-documents.css',
})
export class UploadedDocuments {
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;

  gridConfig: GridConfig = {} as GridConfig;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'create-update-document';

  uploadedDocumentsData: any[] = [];
  totalUplodedDocument = 0;

  pageSize = 10;
  divisionPageSize = 10;
  employeePageSize = 10;
  selectedPageSize = 10; // default value

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  templateHtml: string = '';
  draftFileUrl: string = '';
  isPdf = false;
  isDocx = false;
  safeDraftFileUrl?: SafeResourceUrl;
  documentId: string = '';
  currentDocumentName: string = '';

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  // field name each cabinet level maps to in the (read-only) row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, string> = {
    1: 'divisionName',
    2: 'departmentName',
    3: 'subDepartmentName',
    4: 'businessDomainName',
  };

  private readonly fixedColumnDefs: ColDef[] = [
    { field: 'documentId', headerName: 'Document ID', flex: 1 },
    {
      field: 'documentName',
      headerName: 'Document Name',
      flex: 1,
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
    { field: 'version', headerName: 'Version Number', flex: 1 },
    { field: 'documentType', headerName: 'Document Type', flex: 1 },
  ];

  private readonly trailingColumnDefs: ColDef[] = [
    { field: 'nextReviewDate', headerName: 'Next Review Date', flex: 1 },
  ];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out
  // showing just the fixed columns until we know which levels are enabled.
  workflowAuthoritiesColumnDefs: ColDef[] = [...this.fixedColumnDefs, ...this.trailingColumnDefs];

  constructor(
    private _documentService: DocumentService,
    private _permissionService: PermissionService,
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
    private sanitizer: DomSanitizer,
    private _config: AppConfigService,
    private cabinetGridService: CabinetGridService,
    private hierarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      this.buildGrid();
    });

    // Only show Division/Department/Sub-Department/Business Domain columns for
    // cabinet levels that are currently Enabled (CabinetLevel.isActive), and label
    // them with whatever title is configured for that level.
    this.hierarchyService.loadDropdownHierarchy().subscribe((levels) => {
      this.cabinetHierarchy = levels;
      this.levelTitles = this.hierarchyService.getLevelTitles();

      const cabinetColumnDefs: ColDef[] = levels
        .filter((level) => level.isActive && this.cabinetLevelFields[level.level])
        .map((level) => ({
          field: this.cabinetLevelFields[level.level],
          headerName: level.title,
          flex: 1,
        }));

      this.workflowAuthoritiesColumnDefs = [
        ...this.fixedColumnDefs,
        ...cabinetColumnDefs,
        ...this.trailingColumnDefs,
      ];
    });
  }

  private getFixedColumns(): GridColumn[] {
    return [
      {
        field: 'documentId',
        headerName: 'Document ID',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
      {
        field: 'documentName',
        headerName: 'Document Name',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        field: 'version',
        headerName: 'Version',
        type: 'text',
        minWidth: 120,
        pinned: 'left',
        required: true,
      },
      {
        field: 'documentType',
        headerName: 'Document Type',
        type: 'dropdown',
        //dropdownOptions: this.documentTypes,
        // dropdownValueField: 'id',
        // dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },
    ];
  }

  private getRemainingColumns(): GridColumn[] {
    return [
      {
        field: 'nextReviewDate',
        headerName: 'Next Review Date',
        type: 'date',
        required: true,
      },
      {
        field: 'uploadDocument',
        headerName: 'Upload Document',
        type: 'file',
        required: true,
      },
    ];
  }

  private getColumns(): GridColumn[] {
    const cabinetCols = this.cabinetGridService.buildCabinetColumns(this.cabinetHierarchy).map(col => ({
      ...col,
      minWidth: 230
    }));

    return [
      ...this.getFixedColumns(),
      ...cabinetCols,
      ...this.getRemainingColumns(),
    ];
  }

  
  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: this.selectedPageSize,
      pageSizeOptions: [10, 20, 50, 100],
      enableSorting: true,
      enableFiltering: true,
      enableSelection: true,
      enableInlineAdd: this.canAdd,
      enableInlineEdit: this.canEdit,
      enableInlineDelete: this.canDelete,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };
  }

  GetAllUploadedDocuments(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._documentService
      .GetAllDocument(
        query?.searchText || query?.searchTerm || query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'DESC',
        sort?.colId || 'CreatedAT',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        const items = res?.Data?.Items;
        if (res?.Success && res.Data?.Items) {
          if (Array.isArray(items)) {
            this.uploadedDocumentsData = items.map((item: any) => ({
              Id: item.Id,
              documentType: item.DocumentType,
              documentTypeName: item.DocumentType,
              version: item.Version || item.version || '',
              divisionName: item.Division,
              divisionId: item.DivisionCode,
              documentId: item.DocumentNumber,
              documentName: item.Title || item.DocumentName,
              DocumentCode: item.DocumentCode,
              departmentName: item.Department,
              departmentId: item.DepartmentCode,
              subDepartmentName: item.SubDepartment,
              subDepartmentId: item.SubDepartmentCode,
              businessDomainName: item.BusinessDomain,
              businessDomainId: item.BusinessDomainCode,
              EffectiveFrom: new CustomDateFormatPipe().transform(item.EffectiveFrom || ''),
              EffectiveTo: new CustomDateFormatPipe().transform(item.EffectiveTo || ''),
              DocumentURL: item.DocumentURL,
              nextReviewDate: new CustomDateFormatPipe().transform(item.NextReviewDate),
              CreatedAt: new CustomDateFormatPipe().transform(item.CreatedAt || ''),
              CreatedBy: item.CreatedBy,
              LastModifiedAt: new CustomDateFormatPipe().transform(item.LastModifiedAt || ''),
              LastModifiedBy: item.LastModifiedBy,
            }));
            this.totalUplodedDocument = res?.Data?.TotalCount ?? items.length;
          } else {
            this.uploadedDocumentsData = [];
            this.totalUplodedDocument = 0;
          }
        } else {
          this.uploadedDocumentsData = [];
          this.totalUplodedDocument = 0;
        }
      });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    this.selectedPageSize = pageSize;
    this.GetAllUploadedDocuments({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }

  openDocumentModal(rowData: any) { 
    this.templateHtml = rowData.proposedContent || '';
    this.documentId = rowData.Id;
    this.currentDocumentName = rowData.documentName;
    let fileUrl = rowData.DocumentURL || '';

    if (fileUrl && fileUrl.trim()) {
      if (!fileUrl.startsWith('http')) {
        const baseUrl = this._config.baseUrl ? this._config.baseUrl.replace(/\/$/, '') : '';
        fileUrl = baseUrl + (fileUrl.startsWith('/') ? '' : '/') + fileUrl;
      }
      this.draftFileUrl = fileUrl;
    } else {
      this.draftFileUrl = '';
    }

    this.isPdf = false;
    this.isDocx = false;
    this.safeDraftFileUrl = undefined;

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
