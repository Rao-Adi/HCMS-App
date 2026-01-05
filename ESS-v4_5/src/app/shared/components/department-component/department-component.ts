import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { DepartmentService } from '@app/shared/services/department.service';
import { DivisionService } from '@app/shared/services/division.services';
import { ColDef } from 'ag-grid-community';
import { filter, map, tap } from 'rxjs';

@Component({
  selector: 'app-department-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css',
})
export class DepartmentComponent {
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
      divisionId: '',
      DivisionName: '',
      LastModifiedBy: '',
      LastModifiedAt: '',
    },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private _departmentServices: DepartmentService,
    private _masterCacheService: Mastercacheservice,
    private _divisionServices: DivisionService
  ) {}

  ngOnInit() {
    this.getAllDivisionList();
  }

  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: 10,
      enableInlineAdd: true,
      enableInlineEdit: true,
      enableInlineDelete: true,
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
        headerName: 'Division Code',
        type: 'text',
        required: true,
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
      // ✅ DIVISION
      {
        field: 'Division',
        headerName: 'Division',
        type: 'dropdown',
        dropdownOptions: this.divisions,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },
      // {
      //   field: 'divisionId',
      //   headerName: 'Division',
      //   type: 'dropdown',
      //   dependsOn: 'documentTypeId',
      //   dropdownOptions: this.documentTypes,
      //   filterKey: 'documentTypeId',
      //   dropdownValueField: 'id',
      //   dropdownDisplayField: 'text',
      // },

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

  loadDepartments(): void {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'DEPARTMENTS',
        getCount$: () => this._departmentServices.getDepartmentCount(),
        getData$: () =>
          this._departmentServices.GetAllDepartments('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          Division: item.Division || item.division || '',
          DivisionCode: item.DivisionCode || item.divisionCode || '',
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedAt: item.lastModifiedAt || item.LastModifiedAt || '',
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
        cacheKey: 'DEPARTMENTS',
        getCount$: () => this._departmentServices.getDepartmentCount(),

          // ✅ RETURN RAW API RESPONSE
        getData$: () => this._departmentServices.GetAllDepartments('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          Division: item.Division || item.division || '',
          DivisionCode: item.DivisionCode || item.divisionCode || '',
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedAt: item.CreatedAt || item.createdAt || '',
          LastModifiedBy: item.LastModifiedBy || item.lastModifiedBy || '',
          LastModifiedAt: item.LastModifiedAt || item.lastModifiedAt || '',
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
      //this.cdr.detectChanges(); // force update

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

  onRowAdded(row: any): void {
    debugger;
    console.log('➕ Row Added:', row);

    const payLoad = {
      Code: row.Code,
      Name: row.Name,
      DivisionCode: row.Division,
      IsActive: true,
      IsDeleted: false,
    };

    this._departmentServices.create(payLoad).subscribe(() => {
      this._masterCacheService.clear('DIVISIONS');
      this.loadDepartments();
    });
  }

  onRowUpdated(event: { rowData: any }): void {
    debugger;
    console.log('✏️ Row Updated:', event.rowData);

    this._departmentServices.update(event.rowData).subscribe(() => {
      this._masterCacheService.clear('DIVISIONS');
      this.loadDepartments();
    });
  }

  onRowDeleted(index: number): void {
    debugger;
    const row = this.departmentData[index];

    console.log('🗑️ Row Deleted:', row);

    this._departmentServices.delete(row.Code).subscribe(() => {
      this._masterCacheService.clear('DIVISIONS');
      this.loadDepartments();
    });
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    console.log('Cell value changed:', event);
  }

  onSelectionChanged(selectedRows: any[]): void {
    console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }
}

class DepartmentColumns {
  Code: string = '';
  Name: string = '';
  divisionId: string = '';
  DivisionName: string = '';
  LastModifiedBy: string = '';
  LastModifiedAt: string = '';
}
