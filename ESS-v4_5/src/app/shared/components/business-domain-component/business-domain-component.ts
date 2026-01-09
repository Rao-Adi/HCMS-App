import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditableAgGridWrapper, GridColumn, GridConfig } from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { BusinessDomainService } from '@app/shared/services/businessDomain.service';
import { SubDepartmentService } from '@app/shared/services/subdepartment.service';
import { ColDef } from 'ag-grid-community'; 

@Component({
  selector: 'app-business-domain-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './business-domain-component.html',
  styleUrl: './business-domain-component.css',
})
export class BusinessDomainComponent {
  gridConfig: GridConfig = {} as GridConfig;

  selectedPageSize = 10;
  pageSize = 10;
  businessDomainData: any[] = [];
  totalBusinessDomains = 0;
  subdepartments: any[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  businessdomainColumnDefs = [
    { field: 'Code', headerName: 'Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Business Domain', flex: 1, editable: true },
    {
      field: 'SubDepartment',
      headerName: 'Sub-SubDepartment',
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

  pinnedTopRowDataPlanning: BusinessDomainColumns[] = [
    {
      Code: '',
      Name: '',
      subdepartmentId: '',
      subdepartmentName: '',
      LastModifiedBy: '',
      LastModifiedAt: '',
    },
  ];


  constructor(
    private cdr: ChangeDetectorRef,
    private _businessDomainService: BusinessDomainService,
    private _masterCacheService: Mastercacheservice,
    private _subDepartmentServices: SubDepartmentService
  ) {}

  ngOnInit() {
    this.getAllDepartmeList();
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

    this.getAllBusinessDomains({
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
        headerName: 'Sub Code',
        type: 'text',
        required: true,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'Name',
        headerName: 'Name',
        type: 'text',
        required: true,
        minWidth: 200,
      },
      // ✅ SubDepartment
      {
        field: 'SubDepartment',
        headerName: 'SubDepartment',
        type: 'dropdown',
        dropdownOptions: this.subdepartments,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
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

  getAllBusinessDomains = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'BUSINESSDOMAINS',
        getCount$: () => this._businessDomainService.getBusinessDomainCount(),

        // ✅ RETURN RAW API RESPONSE
        getData$: () =>
          this._businessDomainService.GetAllBusinessDomains('', 'ASC', 'Name', true, 1, 1000),

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

  loadDepartments(): void {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'BUSINESSDOMAINS',
        getCount$: () => this._subDepartmentServices.getSubDepartmentCount(),
        getData$: () =>
          this._subDepartmentServices.GetAllSubDepartments('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          SubDepartment: item.SubDepartment || item.SubDepartment || '',
          DepartmeCode: item.DepartmeCode || item.DepartmeCode || '',
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedAt: item.lastModifiedAt || item.LastModifiedAt || '',
        }),
      })
      .subscribe((data) => {
        this.businessDomainData = data;
        this.totalBusinessDomains = data.length;
      });
  }

    getAllDepartmeList = () => {
    this._subDepartmentServices.getSubDepartmentList().subscribe((res) => {
      if (res?.Data) {
        this.subdepartments = (res.Data ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Value,
        }));
      } else {
        this.subdepartments = [];
      }
      //this.cdr.detectChanges(); // force update

      // ✅ build grid ONLY after Departmes are ready
      this.buildGrid();
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

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }



  /* ================= Inline Events ================= */

  onRowAdded(row: any): void { 
    console.log('➕ Row Added:', row);

    const payLoad = {
      Code: row.Code,
      Name: row.Name,
      DepartmentCode: row.SubDepartment,
      IsActive: true,
      IsDeleted: false,
    };

    this._businessDomainService.create(payLoad).subscribe(() => {
      this._masterCacheService.clear('BUSINESSDOMAINS');
      this.loadDepartments();
    });
  }

  onRowUpdated(event: { rowData: any }): void { 
    console.log('✏️ Row Updated:', event.rowData);

    const payLoad = {
      Code: event.rowData.Code,
      Name: event.rowData.Name,
      DepartmentCode: event.rowData.SubDepartment,
      IsActive: true,
      // IsDeleted: false,
    };

    this._businessDomainService.update(payLoad).subscribe(() => {
      this._masterCacheService.clear('BUSINESSDOMAINS');
      this.loadDepartments();
    });
  }

  onRowDeleted(index: number): void { 
    const row = this.businessDomainData[index];

    console.log('🗑️ Row Deleted:', row);

    this._businessDomainService.delete(row.Code).subscribe(() => {
      this._masterCacheService.clear('BUSINESSDOMAINS');
      this.loadDepartments();
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


class BusinessDomainColumns {
  Code: string = '';
  Name: string = '';
  subdepartmentId: string = '';
  subdepartmentName: string = '';
  LastModifiedBy: string = '';
  LastModifiedAt: string = '';
}
