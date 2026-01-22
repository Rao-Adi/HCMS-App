import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { NotificationService } from '@app/shared/notification/notification.service';
import { DocumentTypeService } from '@app/shared/services/documentType.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-document-type-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './document-type-component.html',
  styleUrl: './document-type-component.css',
})
export class DocumentTypeComponent {
  gridConfig: GridConfig = {} as GridConfig;
  selectedPageSize = 10;
  pageSize = 10;
  totalDocumentTypes = 0;
  documentTypeData: any[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pinnedTopRowDataPlanning: DocumentTypeColumns[] = [
    {
      Code: '',
      Name: '',
      Description: '',
      LastModifiedBy: '',
      LastModifiedAt: '',
    },
  ];

  constructor(
    private _documentTypeService: DocumentTypeService,
    private cdr: ChangeDetectorRef,
    private _masterCacheService: Mastercacheservice,
    private _notification: NotificationService,
  ) {}

  ngOnInit() {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: 10,
      pageSizeOptions: [10, 20, 50, 100],
      enableSorting: true,
      enableFiltering: true,
      enableSelection: true,
      enableInlineAdd: true,
      enableInlineEdit: true,
      enableInlineDelete: true,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };

    this.getAllDocumentTypes({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'Code',
        headerName: 'Code',
        type: 'text',
        required: true,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'Name',
        headerName: 'Name',
        type: 'text',
        required: true,
        minWidth: 200,
      },
      {
        field: 'Description',
        headerName: 'Description',
        type: 'text',
        required: false,
        minWidth: 200,
      },
      {
        field: 'LastModifiedBy',
        headerName: 'Last Saved By',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
      {
        field: 'LastModifiedAt',
        headerName: 'Last Saved On',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
    ];
  }

  loadDocumentTypes(): void {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.DOCUMENT_TYPES,
        getCount$: () => this._documentTypeService.getDocumentTypeCount(),
        getData$: () =>
          this._documentTypeService.GetAllDocumentTypes('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          Description: item.description || item.Description,
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedAt: item.lastModifiedAt || item.LastModifiedAt || '',
        }),
      })
      .subscribe((data) => {
        this.documentTypeData = data;
        this.totalDocumentTypes = data.length;
      });
  }

  getAllDocumentTypes = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.DOCUMENT_TYPES,

        getCount$: () => this._documentTypeService.getDocumentTypeCount(),

        // ✅ RETURN RAW API RESPONSE
        getData$: () =>
          this._documentTypeService.GetAllDocumentTypes('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          Description: item.description || item.Description,
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedAt: item.lastModifiedAt || item.LastModifiedAt || '',
        }),
      })
      .subscribe((data) => {
        this.documentTypeData = data;
        this.totalDocumentTypes = data.length;
      });
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllDocumentTypes({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  /* ================= Inline Events ================= */

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event;

    const payLoad = {
      Code: rowData.Code,
      Name: rowData.Name,
      Description: rowData.Description,
      IsActive: true,
      IsDeleted: false,
    };

    this._documentTypeService.create(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DOCUMENT_TYPES);
        this._notification.createNotification(
          'success',
          'Document Type',
          'Document Type created successfully!',
        );
        this.loadDocumentTypes();
      },
      error: (err) => {
        console.error('Create Document Attribute failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notification.createNotification('error', 'Document Attribute', message);
      },
    });
  }

  onRowUpdated(event: { rowData: any }): void {
    //console.log('✏️ Row Updated:', event.rowData);
    const payLoad = {
      Code: event.rowData.Code,
      Name: event.rowData.Name,
      Description: event.rowData.Description,
      IsActive: true,
      IsDeleted: false,
    };
    this._documentTypeService.update(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DOCUMENT_TYPES);
        this._notification.createNotification(
          'success',
          'Document Type',
          'Document Type updated successfully!',
        );
        this.loadDocumentTypes();
      },
      error: (err) => {
        console.error('Create Document Attribute failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notification.createNotification('error', 'Document Attribute', message);
      },
    });
  }

  onRowDeleted(index: number): void {
    const row = this.documentTypeData[index];

    this._documentTypeService.delete(row.Code).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DOCUMENT_TYPES);
        this._notification.createNotification(
          'success',
          'Document Type',
          'Document Type deleted successfully!',
        );
        this.loadDocumentTypes();
      },
      error: (err) => {
        console.error('Create Document Attribute failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notification.createNotification('error', 'Document Attribute', message);
      },
    });
 
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', event);
  }

  onSelectionChanged(selectedRows: any[]): void {
    //console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }
}

class DocumentTypeColumns {
  Code: string = '';
  Name: string = '';
  Description: string = '';
  LastModifiedBy: string = '';
  LastModifiedAt: string = '';
}
