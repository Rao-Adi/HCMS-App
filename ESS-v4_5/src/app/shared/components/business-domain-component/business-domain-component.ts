import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { BusinessDomainService } from '@app/shared/services/businessDomain.service';
import { ColDef } from 'ag-grid-community';

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

        getData$: () =>
          this._businessDomainService.GetAllBusinessDomains('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          Department: item.department || item.Department,
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
        }),
      })
      .subscribe((data) => {
        this.businessDomainData = data;
        this.totalBusinessDomains = data.length;
      });

    // const sort = query.sortModel?.[0];
    // const pageNumber = Number(query?.pageNumber) || 1;
    // const pageSize = Number(query?.pageSize) || 10;

    // const cacheKey = 'BUSINESSDOMAINS';
    // const cached = localStorage.getItem(cacheKey);

    // // 1️⃣ If cache exists → check count
    // if (cached) {
    //   const parsed = JSON.parse(cached);

    //   this._businessDomainService
    //     .GetAllBusinessDomains(
    //       query?.filterModel?.Name?.filter || '',
    //       sort?.sort?.toUpperCase() || 'ASC',
    //       sort?.colId || 'Name',
    //       true,
    //       pageNumber,
    //       pageSize
    //     )
    //     .subscribe((res) => {
    //       if (res?.Success && res.Data?.Items) {
    //         this.totalBusinessDomains = res.Data.TotalCount;
    //         this.businessDomainData = res.Data.Items.map((item: any) => ({
    //           Code: item.code || item.Code,
    //           Name: item.name || item.Name,
    //           SubDepartment: item.SubDepartment || item.SubDepartment,
    //           SubDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
    //           CreatedBy: item.createdBy || item.CreatedBy || '',
    //           CreatedAt: item.createdAt || item.CreatedAt || '',
    //         }));
    //         //console.log('Mapped BusinessDomain:', this.businessDomainData);
    //         localStorage.setItem(
    //           'BUSINESSDOMAINS',
    //           JSON.stringify({
    //             count: this.totalBusinessDomains,
    //             data: this.businessDomainData,
    //           })
    //         );
    //       } else {
    //         this.businessDomainData = [];
    //       }
    //       //this.cdr.detectChanges(); // force update
    //     });
    // }
    // // 2️⃣ No cache → fetch
    // this.fetchBusinessDomains(query, sort, pageNumber, pageSize);
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
