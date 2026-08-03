import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DivisionService } from '@app/shared/services/division.services';
import { PermissionService } from '@app/shared/services/permission.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-division-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './division-component.html',
  styleUrl: './division-component.css',
})
export class DivisionComponent {
  gridConfig: GridConfig = {} as GridConfig;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'cabinetstructure';

  selectedPageSize = 10;
  pageSize = 10;
  totalDivisions = 0;
  divisionData: any[] = [];
  divisions: any[] = []; // for dropdowns

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pinnedTopRowDataPlanning: DivisionColumns[] = [
    {
      Code: '',
      Name: '',
      CreatedBy: '',
      CreateddAt: '',
      LastModifiedBy: '',
      LastModifiedAt: '',
    },
  ];

  constructor(
    private _divisionServices: DivisionService,
    private _masterCacheService: Mastercacheservice,
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      // Now that permissions are set, build the grid and fetch the initial data
      this.buildGrid();
      this.getAllDivisions({
        pageNumber: 1,
        pageSize: this.pageSize,
        sortModel: [],
        filterModel: {},
      });
    });
  }

  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: 10,
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

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'Code',
        headerName: 'Division Code',
        type: 'readonly',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'Name',
        headerName: 'Division Name',
        type: 'text',
        required: true,
        minWidth: 200,
      },
      // {
      //   field: 'IsActive',
      //   headerName: 'Enable/Disable',
      //   type: 'switch',
      //   required: false,
      //   minWidth: 150,
      // },
      {
        field: 'LastModifiedByName',
        headerName: 'Last Saved By',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
        cellClass: 'audit-cell',
      },
      {
        field: 'LastModifiedAt',
        headerName: 'Last Saved On',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
        cellClass: 'audit-cell',
      },
      // {
      //   field: 'LastModifiedByName',
      //   headerName: 'Last Action Performed By',
      //   type: 'readonly',
      //   minWidth: 150,
      //   pinned: 'left',
      //   required: false,
      //   cellClass: 'audit-cell',
      // },
      // {
      //   field: 'LastModifiedAt',
      //   headerName: 'Last Action Performed On',
      //   type: 'readonly',
      //   minWidth: 150,
      //   pinned: 'left',
      //   required: false,
      //   cellClass: 'audit-cell',
      // },
    ];
  }

  loadDivisions(): void {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.DIVISIONS,
        getCount$: () => this._divisionServices.getDivisionCount(),
        getData$: () => this._divisionServices.GetAllDivisions('', 'DESC', 'CreatedAt', true, 1, 10000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          IsActive :item.isActive || item.IsActive || false,
          IsDeleted :item.isDeleted || item.IsDeleted || false,
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedByName : item.CreatedByName || item.createdByName || '',
          CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedByName : item.LastModifiedByName || item.lastModifiedByName || '',
          LastModifiedAt: new CustomDateFormatPipe().transform(
            item.lastModifiedAt || item.LastModifiedAt || '',
          ),
        }),
      })
      .subscribe((data) => {
        this.divisionData = data;
        this.totalDivisions = data.length;
      });
  }

  getAllDivisions = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.DIVISIONS,

        getCount$: () => this._divisionServices.getDivisionCount(),

        // ✅ RETURN RAW API RESPONSE
        getData$: () => this._divisionServices.GetAllDivisions('', 'DESC', 'CreatedAt', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          IsActive :item.isActive || item.IsActive || false,
          IsDeleted :item.isDeleted || item.IsDeleted || false,
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedByName : item.CreatedByName || item.createdByName || '',
          CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedByName : item.LastModifiedByName || item.lastModifiedByName || '',
          LastModifiedAt: new CustomDateFormatPipe().transform(
            item.lastModifiedAt || item.LastModifiedAt || '',
          ),
        }),
      })
      .subscribe((data) => {
        this.divisionData = data;
        this.totalDivisions = data.length;
      });
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllDivisions({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }

  onGridReady(gridApi: any): void {
    console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  private generateId(): number {
    return Date.now();
  }

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  /* ================= Inline Events ================= */

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event; 
    const payLoad = {
      Name: rowData.Name,
      IsActive: true,
      IsDeleted: false,
    };

    this._divisionServices.create(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DIVISIONS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DEPARTMENTS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.SUB_DEPARTMENTS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.BUSINESS_DOMAIN);
        this._notificationToastService.createNotification(
          'success',
          'Division',
          'Division created successfully!',
        );
        this.loadDivisions();
      },
      error: (err) => {
        console.error('Create Division failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notificationToastService.createNotification('error', 'Division', message);
      },
    });
  }

  onRowUpdated(event: { rowData: any }): void {
    const { rowData } = event;
    const payLoad = {
      Code: event.rowData.Code,
      Name: event.rowData.Name,
      IsActive: event.rowData.IsActive,
      IsDeleted: false,
    };

    this._divisionServices.update(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DIVISIONS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DEPARTMENTS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.SUB_DEPARTMENTS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.BUSINESS_DOMAIN);
        this._notificationToastService.createNotification(
          'success',
          'Division',
          'Division updated successfully!',
        );
        this.loadDivisions();
      },
      error: (err) => {
        console.error('Update Division failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notificationToastService.createNotification('error', 'Division', message);
      },
    });
  }

  onRowDeleted(index: number): void {
    const row = this.divisionData[index];

    this._divisionServices.delete(row.Code).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DIVISIONS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DEPARTMENTS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.SUB_DEPARTMENTS);
        this._masterCacheService.clear(MASTER_CACHE_KEYS.BUSINESS_DOMAIN);
        this._notificationToastService.createNotification(
          'success',
          'Division',
          'Division deleted successfully!',
        );
        this.loadDivisions();
      },
      error: (err) => {
        console.error('Delete Division failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notificationToastService.createNotification('error', 'Division', message);
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

class DivisionColumns {
  Code: string = '';
  Name: string = '';
  CreatedBy: string = '';
  CreateddAt: string = '';
  LastModifiedBy: string = '';
  LastModifiedAt: string = '';
}
