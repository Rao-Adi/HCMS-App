import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { DivisionService } from '@app/shared/services/division.services';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-division-component',
  imports: [CommonModule, FormsModule, AgGridWrapper],
  templateUrl: './division-component.html',
  styleUrl: './division-component.css',
})
export class DivisionComponent {
  selectedPageSize = 10;
  pageSize = 10;
  totalDivisions = 0;
  divisionData: any[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  divisionColumnDefs = [
    {
      field: 'Code',
      headerName: 'Division Code',
      flex: 1,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 50,
      },
      valueSetter: (params: any) => {
        if (!params.newValue || !params.newValue.trim()) {
          return false; // ❌ block empty
        }
        if (params.newValue.length > 50) {
          return false; // ❌ block too long
        }
        params.data.Name = params.newValue.trim();
        return true;
      },
      cellClassRules: {
        'cell-invalid': (params: any) => !params.value,
      },
    },
    { field: 'Name', headerName: 'Name', flex: 1, editable: true },
    { field: 'CreatedBy', headerName: 'Last Saved By', flex: 1 },
    {
      field: 'CreatedAt',
      headerName: 'Last Saved On',
      flex: 1,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        // Parse string to Date and format as desired
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return params.value; // fallback to raw string
        return date.toLocaleString(); // or format however you want
      },
    },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private _divisionServices: DivisionService,
    private _masterCacheService: Mastercacheservice
  ) {}

   ngOnInit() {
      this.getAllDivisions({
          pageNumber: 1,
          pageSize: this.pageSize,
          sortModel: [],
          filterModel: {},
        })
  }

  getAllDivisions = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'DIVISIONS',

        getCount$: () => this._divisionServices.getDivisionCount(),

        getData$: () => this._divisionServices.GetAllDivisions('', 'ASC', 'Name', true, 1, 1000),

        mapFn: (item) => ({
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          Description: item.description || item.Description,
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
        }),
      })
      .subscribe((data) => {
        this.divisionData = data;
        this.totalDivisions = data.length;
      });

    // const sort = query.sortModel?.[0];
    // const pageNumber = Number(query?.pageNumber) || 1;
    // const pageSize = Number(query?.pageSize) || 10;
    // const cacheKey = 'DIVISIONS';
    // const cached = localStorage.getItem(cacheKey);

    // // 1️⃣ If cache exists → check count
    // if (cached) {
    //   const parsed = JSON.parse(cached);

    //   this._divisionServices
    //     .GetAllDivisions(
    //       query?.filterModel?.Name?.filter || '',
    //       sort?.sort?.toUpperCase() || 'ASC',
    //       sort?.colId || 'Name',
    //       true,
    //       pageNumber,
    //       pageSize
    //     )
    //     .subscribe((res) => {
    //       if (res?.Success && res.Data?.Items) {
    //         this.totalDivisions = res.Data.TotalCount;
    //         this.divisionData = res.Data.Items.map((item: any) => ({
    //           Code: item.code || item.Code,
    //           Name: item.name || item.Name,
    //           CreatedBy: item.createdBy || item.CreatedBy || '',
    //           CreatedAt: item.createdAt || item.CreatedAt || '',
    //         }));
    //         //console.log('Mapped divisionData:', this.divisionData);
    //         localStorage.setItem(
    //           'DIVISIONS',
    //           JSON.stringify({
    //             count: this.totalDivisions,
    //             data: this.divisionData,
    //           })
    //         );
    //       } else {
    //         this.divisionData = [];
    //       }
    //       //this.cdr.detectChanges(); // force update
    //     });
    // } // 2️⃣ No cache → fetch
    // this.fetchDivisions(query, sort, pageNumber, pageSize);
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllDivisions({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }
}
