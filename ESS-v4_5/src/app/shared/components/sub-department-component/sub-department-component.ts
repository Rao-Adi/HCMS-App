import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { SubDepartmentService } from '@app/shared/services/subdepartment.service';
import { ColDef } from 'ag-grid-community';
import { filter, map, tap } from 'rxjs';

@Component({
  selector: 'app-sub-department-component',
  imports: [CommonModule, FormsModule, AgGridWrapper],
  templateUrl: './sub-department-component.html',
  styleUrl: './sub-department-component.css',
})
export class SubDepartmentComponent {
  selectedPageSize = 10;
  pageSize = 10;
  totalSubDepartments = 0;
  subDepartmentData: any[] = [];

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

  constructor(
    private _subDepartmentService: SubDepartmentService,
    private _masterCacheService: Mastercacheservice
  ) {}

  ngOnInit() {
    this.getAllSubDepartments({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  getAllSubDepartments = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'SUBDEPARTMENTS',
        getCount$: () => this._subDepartmentService.getSubDepartmentCount(),

            // ✅ RETURN RAW API RESPONSE
        getData$: () => this._subDepartmentService.GetAllSubDepartments('', 'ASC', 'Name', true, 1, 1000),
        // The cache service uses this mapFn to unwrap the items from the response
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          Department: item.Department || item.department || '',
          DepartmentCode: item.DepartmentCode || item.departmentCode || '',
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedAt: item.CreatedAt || item.createdAt || '',
          LastModifiedBy: item.LastModifiedBy || item.lastModifiedBy || '',
          LastModifiedAt: item.LastModifiedAt || item.lastModifiedAt || '',
        }),
      })
      .subscribe((data) => {
        // 'data' here is now the mapped array from mapFn
        this.subDepartmentData = data;
        this.totalSubDepartments = data ? data.length : 0;
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

  saveSubDepartment(event: any): void {
    // 🔒 Business validation
    if (!event.newValue || event.newValue.trim().length < 3) {
      this.revertCell(event, 'Minimum 3 characters required');
      return;
    }

    // if (this.isDuplicateName(event.data.Code, event.newValue)) {
    //   this.revertCell(event, 'Name already exists');
    //   return;
    // }

    const payload = {
      code: event.data.Code,
      name: event.newValue,
    };

    // this._subDepartmentService.updateSubDepartment(payload).subscribe({
    //   next: () => {
    //     console.log('Saved successfully');
    //   },
    //   error: () => {
    //     this.revertCell(event, 'Save failed');
    //   },
    // });
  }

  revertCell(event: any, message: string) {
    alert(message); // replace with toast
    event.data[event.field] = event.oldValue;
    this.subDepartmentData = [...this.subDepartmentData];
  }
}
