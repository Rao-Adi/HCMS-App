import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
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
import { DepartmentService } from '@app/shared/services/department.service';
import { DivisionService } from '@app/shared/services/division.services';
import { PermissionService } from '@app/shared/services/permission.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-department-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css',
})
export class DepartmentComponent {
  @Input() level!: number;
  @Input() levelTitles!: Record<number, string>;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'cabinetstructure';

  currentTitle = '';
  parentTitle = '';

  gridConfig: GridConfig = {} as GridConfig;

  selectedPageSize = 10; // default value

  totalDepartments = 0;
  pageSize = 10;
  departmentData: any[] = [];
  divisions: any[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pinnedTopRowDataPlanning: DepartmentColumns[] = [
    {
      Code: '',
      Name: '',
      departmentId: '',
      departmentName: '',
      LastModifiedBy: '',
      LastModifiedAt: '',
    },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private _departmentServices: DepartmentService,
    private _masterCacheService: Mastercacheservice,
    private _divisionServices: DivisionService,
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.currentTitle = this.levelTitles[this.level]; // Department
      this.parentTitle = this.levelTitles[this.level - 1]; // Division

      this.getAllDivisionList();
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

    this.getAllDepartments({
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
        headerName: 'Department Code',
        type: 'readonly',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'Name',
        headerName: 'Department',
        type: 'text',
        required: true,
        minWidth: 200,
      },
      // ✅ DIVISION
      {
        field: 'Division',
        headerName: `${this.parentTitle}`,
        type: 'dropdown',
        dropdownOptions: this.divisions,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
        minWidth: 200,
      },
      {
        field: 'IsActive',
        headerName: 'Enable/Disable',
        type: 'switch',
        required: false,
        minWidth: 150,
      },
      {
        field: 'CreatedByName',
        headerName: 'Last Saved By',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
        cellClass: 'audit-cell',
      },
      {
        field: 'CreatedAt',
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

  loadDepartments(): void {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.DEPARTMENTS,
        getCount$: () => this._departmentServices.getDepartmentCount(),
        getData$: () => this._departmentServices.GetAllDepartments('', 'DESC', 'CreatedAt', true, 1, 10000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          Division: item.Division || item.division || '',
          DivisionCode: item.DivisionCode || item.divisionCode || '',
          IsActive :item.isActive || item.IsActive || false,
          IsDeleted :item.isDeleted || item.IsDeleted || false,
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedByName: item.CreatedByName || item.createdByName || '',
          CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedByName: item.LastModifiedByName || item.lastModifiedByName || '',
          LastModifiedAt: new CustomDateFormatPipe().transform(
            item.lastModifiedAt || item.LastModifiedAt || '',
          ),
        }),
      })
      .subscribe((data) => {
        this.departmentData = data;
        this.totalDepartments = data.length;
      });
  }

  getAllDepartments = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.DEPARTMENTS,
        getCount$: () => this._departmentServices.getDepartmentCount(),

        // ✅ RETURN RAW API RESPONSE
        getData$: () =>
          this._departmentServices.GetAllDepartments('', 'DESC', 'CreatedAt', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          Division: item.Division || item.division || '',
          DivisionCode: item.DivisionCode || item.divisionCode || '',
          IsActive :item.isActive || item.IsActive || false,
          IsDeleted :item.isDeleted || item.IsDeleted || false,
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedByName: item.CreatedByName || item.createdByName || '',
          CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedByName: item.LastModifiedByName || item.lastModifiedByName || '',
          LastModifiedAt: new CustomDateFormatPipe().transform(
            item.lastModifiedAt || item.LastModifiedAt || '',
          ),
        }),
      })
      .subscribe((data) => {
        // 'data' here is now the mapped array from mapFn
        this.departmentData = data;
        this.totalDepartments = data ? data.length : 0;
      });
  };

  getAllDivisionList = () => {
    this._divisionServices.getDivisionList().subscribe((res) => {
      if (res?.Data) {
        this.divisions = (res.Data ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Value,
        }));
      } else {
        this.divisions = [];
      }
      // ✅ build grid ONLY after divisions are ready
      this.buildGrid();
    });
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllDepartments({
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
      DivisionCode: rowData.Division,
      IsActive: true,
      IsDeleted: false,
    };

    this._departmentServices.create(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DEPARTMENTS);
        this._notificationToastService.createNotification(
          'success',
          'Department',
          'Department updated successfully!',
        );
        this.loadDepartments();
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

        this._notificationToastService.createNotification('error', 'Document Attribute', message);
      },
    });
  }

  onRowUpdated(event: { rowData: any }): void {
    //console.log('✏️ Row Updated:', event.rowData);
    const payLoad = { 
      Code: event.rowData.Code,
      Name: event.rowData.Name,
      DivisionCode: event.rowData.DivisionCode,
      IsActive: event.rowData.IsActive,
      IsDeleted: false,
    };

    this._departmentServices.update(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DEPARTMENTS);
        this._notificationToastService.createNotification(
          'success',
          'Department',
          'Department updated successfully!',
        );
        this.loadDepartments();
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

        this._notificationToastService.createNotification('error', 'Document Attribute', message);
      },
    });
  }

  onRowDeleted(index: number): void {
    const row = this.departmentData[index];

    this._departmentServices.delete(row.Code).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.DEPARTMENTS);
        this._notificationToastService.createNotification(
          'success',
          'Department',
          'Department deleted successfully!',
        );
        this.loadDepartments();
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

        this._notificationToastService.createNotification('error', 'Document Attribute', message);
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

class DepartmentColumns {
  Code: string = '';
  Name: string = '';
  departmentId: string = '';
  departmentName: string = '';
  LastModifiedBy: string = '';
  LastModifiedAt: string = '';
}
