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
import { DepartmentService } from '@app/shared/services/department.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { SubDepartmentService } from '@app/shared/services/subdepartment.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-sub-department-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './sub-department-component.html',
  styleUrl: './sub-department-component.css',
})
export class SubDepartmentComponent {
  gridConfig: GridConfig = {} as GridConfig;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'cabinetstructure';

  selectedPageSize = 10;
  pageSize = 10;
  totalSubDepartments = 0;
  subDepartmentData: any[] = [];
  departments: any[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  subDepartmentColumnDefs = [
    { field: 'Code', headerName: 'Sub-Department Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Sub-Department', flex: 1, editable: true },
    { field: 'Department', headerName: 'Department', flex: 1, editable: true },
    {
      field: 'CreatedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',

      flex: 1,
    },
    {
      field: 'CreatedAt',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',

      flex: 1,
      // valueFormatter: (params: ValueFormatterParams<any, Date>) => {
      //   if (!params.value) {
      //     return '';
      //   }
      //   const month = params.value.getMonth() + 1;
      //   const day = params.value.getDate();
      //   return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${
      //     day < 10 ? '0' + day : day
      //   }`;
      // },
      // cellEditorParams: {
      //   max: new Date('2008-12-31'),
      // },
    },
  ];

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
    private _subDepartmentServices: SubDepartmentService,
    private _masterCacheService: Mastercacheservice,
    private _departmentService: DepartmentService,
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.getAllDepartmeList();
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

    this.getAllSubDepartments({
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
        headerName: 'Sub-Department Code',
        type: 'readonly',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'Name',
        headerName: 'Sub-Department Name',
        type: 'text',
        required: true,
        minWidth: 200,
      },
      // ✅ Department
      {
        field: 'Department',
        headerName: 'Department',
        type: 'dropdown',
        dropdownOptions: this.departments,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },
      
      {
        field: 'LastModifiedByName',
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

  loadSubDepartments(): void { 
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.SUB_DEPARTMENTS,
        getCount$: () => this._subDepartmentServices.getSubDepartmentCount(),
        getData$: () => this._subDepartmentServices.GetAllSubDepartments('', 'DESC', 'CreatedAt', true, 1, 10000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          Department: item.Department || item.Department || '',
          DepartmentCode: item.DepartmentCode || item.DepartmentCode || '',
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
        this.subDepartmentData = data;
        this.totalSubDepartments = data.length;
      });
  }

  getAllDepartmeList = () => {
    this._departmentService.getDepartmentList().subscribe((res) => {
      if (res?.Data) {
        this.departments = (res.Data ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Value,
        }));
      } else {
        this.departments = [];
      }
      //this.cdr.detectChanges(); // force update

      // ✅ build grid ONLY after Departmes are ready
      this.buildGrid();
    });
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllSubDepartments({
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

  getAllSubDepartments = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.SUB_DEPARTMENTS,
        getCount$: () => this._subDepartmentServices.getSubDepartmentCount(),

        // ✅ RETURN RAW API RESPONSE
        getData$: () =>
          this._subDepartmentServices.GetAllSubDepartments('', 'DESC', 'CreatedAt', true, 1, 1000),
        // The cache service uses this mapFn to unwrap the items from the response
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          Department: item.Department || item.department || '',
          DepartmentCode: item.DepartmentCode || item.departmentCode || '',
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
        // 'data' here is now the mapped array from mapFn
        this.subDepartmentData = data;
        this.totalSubDepartments = data ? data.length : 0;
      });
  };

  /* ================= Inline Events ================= */

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event;

    const payLoad = {
      Name: rowData.Name,
      DepartmentCode: rowData.Department,
      IsActive: event.rowData.IsActive,
      IsDeleted: false,
    };

    this._subDepartmentServices.create(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.SUB_DEPARTMENTS);
        this._notificationToastService.createNotification(
          'success',
          'Sub-Department',
          'Sub-Department created successfully!',
        );
        this.loadSubDepartments();
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
      DepartmentCode: event.rowData.Department,
      IsActive: true,
      // IsDeleted: false,
    };

    this._subDepartmentServices.update(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.SUB_DEPARTMENTS);
        this._notificationToastService.createNotification(
          'success',
          'Sub-Department',
          'Sub-Department updated successfully!',
        );
        this.loadSubDepartments();
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
    const row = this.subDepartmentData[index];

    this._subDepartmentServices.delete(row.Code).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.SUB_DEPARTMENTS);
        this._notificationToastService.createNotification(
          'success',
          'Sub-Department',
          'Sub-Department updated successfully!',
        );
        this.loadSubDepartments();
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
    console.log('Selected rows:', selectedRows);
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
