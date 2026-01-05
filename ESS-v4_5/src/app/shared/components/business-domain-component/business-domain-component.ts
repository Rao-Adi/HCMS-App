import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { BusinessDomainService } from '@app/shared/services/businessDomain.service';
import { ColDef } from 'ag-grid-community';
import { filter, map, tap } from 'rxjs';

@Component({
  selector: 'app-business-domain-component',
  imports: [CommonModule, FormsModule, AgGridWrapper],
  templateUrl: './business-domain-component.html',
  styleUrl: './business-domain-component.css',
})
export class BusinessDomainComponent {
  selectedPageSize = 10;
  pageSize = 10;
  businessDomainData: any[] = [];
  totalBusinessDomains = 0;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  businessdomainColumnDefs = [
    { field: 'Code', headerName: 'Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Business Domain', flex: 1, editable: true },
    {
      field: 'SubDepartment',
      headerName: 'Sub-Department',
      flex: 1,
      editable: true,
      // cellEditorParams: {
      //   values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      // },
    },

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
    private cdr: ChangeDetectorRef,
    private _businessDomainService: BusinessDomainService,
    private _masterCacheService: Mastercacheservice
  ) {}

  ngOnInit() {
    this.getAllBusinessDomains({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  getAllBusinessDomains = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'BUSINESSDOMAINS',
        getCount$: () => this._businessDomainService.getBusinessDomainCount(),

            // ✅ RETURN RAW API RESPONSE
        getData$: () => this._businessDomainService.GetAllBusinessDomains('', 'ASC', 'Name', true, 1, 1000),

        // The cache service uses this mapFn to unwrap the items from the response
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          SubDepartment: item.SubDepartment || item.subDepartment || '',
          SubDepartmentCode: item.SubDepartmentCode || item.subDepartmentCode || '',
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedAt: item.CreatedAt || item.createdAt || '',
          LastModifiedBy: item.LastModifiedBy || item.lastModifiedBy || '',
          LastModifiedAt: item.LastModifiedAt || item.lastModifiedAt || '',
        }),
      })
      .subscribe((data) => {
        // 'data' here is now the mapped array from mapFn
        this.businessDomainData = data;
        this.totalBusinessDomains = data ? data.length : 0;
      });
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllBusinessDomains({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }
}
