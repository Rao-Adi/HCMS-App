import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { DepartmentService } from '@app/shared/services/department.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-department-component',
  imports: [CommonModule, FormsModule, AgGridWrapper],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css',
})
export class DepartmentComponent {
  selectedPageSize = 10; // default value

  totalDepartments = 0;
  pageSize = 10;
  departmentData: any[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  departmentColumnDefs = [
    { field: 'Code', headerName: 'Division Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Name', flex: 1, editable: true },
    { field: 'Division', headerName: 'Division', flex: 1, editable: true },
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
    private _departmentServices: DepartmentService,
    private cdr: ChangeDetectorRef,
    private _masterCacheService: Mastercacheservice
  ) {}

  ngOnInit() {
    this.getAllDepartments({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  getAllDepartments = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'DEPARTMENTS',

        getCount$: () => this._departmentServices.getDepartmentCount(),

        getData$: () =>
          this._departmentServices.GetAllDepartments('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          DivisionCode: item.divisionCode || item.DivisionCode,
          Division: item.division || item.Division,
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
        }),
      })
      .subscribe((data) => {
        this.departmentData = data;
        this.totalDepartments = data.length;
      });

    // const sort = query.sortModel?.[0];
    // const pageNumber = Number(query?.pageNumber) || 1;
    // const pageSize = Number(query?.pageSize) || 10;

    // const cacheKey = 'DEPARTMENTS';
    // const cached = localStorage.getItem(cacheKey);

    // // 1️⃣ If cache exists → check count
    // if (cached) {
    //   const parsed = JSON.parse(cached);

    //   this._departmentServices
    //     .GetAllDepartments(
    //       query?.filterModel?.Name?.filter || '',
    //       sort?.sort?.toUpperCase() || 'ASC',
    //       sort?.colId || 'Name',
    //       true,
    //       pageNumber,
    //       pageSize
    //     )
    //     .subscribe((res) => {
    //       if (res?.Success && res.Data?.Items) {
    //         this.totalDepartments = res.Data.TotalCount;
    //         this.departmentData = res.Data.Items.map((item: any) => ({
    //           Code: item.code || item.Code,
    //           Name: item.name || item.Name,
    //           DivisionCode: item.divisionCode || item.DivisionCode,
    //           Division: item.division || item.Division,
    //           CreatedBy: item.createdBy || item.CreatedBy || '',
    //           CreatedAt: item.createdAt || item.CreatedAt || '',
    //         }));
    //         //console.log('Mapped departmentData:', this.departmentData);
    //         localStorage.setItem(
    //           'DEPARTMENTS',
    //           JSON.stringify({
    //             count: this.totalDepartments,
    //             data: this.departmentData,
    //           })
    //         );
    //       } else {
    //         this.departmentData = [];
    //       }
    //       //this.cdr.detectChanges(); // force update
    //     });
    // }
    // // 2️⃣ No cache → fetch
    // this.fetchDepartments(query, sort, pageNumber, pageSize);
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllDepartments({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }
}
