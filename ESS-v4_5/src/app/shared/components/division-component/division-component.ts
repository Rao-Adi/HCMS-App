import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { DivisionService } from '@app/shared/services/division.services';
import { ColDef } from 'ag-grid-community';
import { filter, map, tap } from 'rxjs';

@Component({
  selector: 'app-division-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './division-component.html',
  styleUrl: './division-component.css',
})
export class DivisionComponent {
  gridConfig: GridConfig = {} as GridConfig;

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
    private cdr: ChangeDetectorRef,
    private _divisionServices: DivisionService,
    private _masterCacheService: Mastercacheservice
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

    this.getAllDivisions({
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

  loadDivisions(): void {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'DIVISIONS',
        getCount$: () => this._divisionServices.getDivisionCount(),
        getData$: () => this._divisionServices.GetAllDivisions('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedAt: item.lastModifiedAt || item.LastModifiedAt || '',
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
        cacheKey: 'DIVISIONS',

        getCount$: () => this._divisionServices.getDivisionCount(),

        // ✅ RETURN RAW API RESPONSE
        getData$: () => this._divisionServices.GetAllDivisions('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedAt: item.lastModifiedAt || item.LastModifiedAt || '',
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

  onRowAdded(row: any): void { 
    console.log('➕ Row Added:', row);

    const payLoad = {
      Code: row.Code,
      Name: row.Name,
      IsActive: true,
      IsDeleted: false,
    };

    this._divisionServices.create(payLoad).subscribe(() => {
      this._masterCacheService.clear('DIVISIONS');
      this.loadDivisions();
    });
  }

  onRowUpdated(event: { rowData: any }): void {
    console.log('✏️ Row Updated:', event.rowData);
    const payLoad = {
      Code: event.rowData.Code,
      Name: event.rowData.Name,
      IsActive: true,
      IsDeleted: false,
    };
    this._divisionServices.update(payLoad).subscribe(() => {
      this._masterCacheService.clear('DIVISIONS');
      this.loadDivisions();
    });
  }

  onRowDeleted(index: number): void {
 
    const row = this.divisionData[index];

    console.log('🗑️ Row Deleted:', row);

    this._divisionServices.delete(row.Code).subscribe(() => {
      this._masterCacheService.clear('DIVISIONS');
      this.loadDivisions();
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

class DivisionColumns {
  Code: string = '';
  Name: string = '';
  CreatedBy: string = '';
  CreateddAt: string = '';
  LastModifiedBy: string = '';
  LastModifiedAt: string = '';
}
