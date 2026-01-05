import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { DocumentTypeService } from '@app/shared/services/documentType.service';
import { ColDef } from 'ag-grid-community';
import { filter, map, tap } from 'rxjs';

@Component({
  selector: 'app-document-type-component',
  imports: [CommonModule, FormsModule, AgGridWrapper],
  templateUrl: './document-type-component.html',
  styleUrl: './document-type-component.css',
})
export class DocumentTypeComponent {
  selectedPageSize = 10;
  pageSize = 10;
  totalDocumentTypes = 0;
  documentTypeData: any[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  documentTypeColumnDefs = [
    { field: 'Code', headerName: 'Document Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Document Type', flex: 1, editable: true },
    { field: 'Description', headerName: 'Description', flex: 1, editable: true },
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
    private _documentTypeService: DocumentTypeService,
    private cdr: ChangeDetectorRef,
    private _masterCacheService: Mastercacheservice
  ) {}

  ngOnInit() {
    this.getAllDocumentTypes({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  getAllDocumentTypes = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: 'DOCUMENTTYPES',

        getCount$: () => this._documentTypeService.getDocumentTypeCount(),

           // ✅ RETURN RAW API RESPONSE
        getData$: () => this._documentTypeService.GetAllDocumentTypes('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          Department: item.department || item.Department,
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: item.createdAt || item.CreatedAt || '',
        }),
      })
      .subscribe((data) => {
        this.documentTypeData = data;
        this.totalDocumentTypes = data.length;
      });

    // const sort = query.sortModel?.[0];
    // const pageNumber = Number(query?.pageNumber) || 1;
    // const pageSize = Number(query?.pageSize) || 10;

    // const cacheKey = 'DOCUMENTTYPES';
    // const cached = localStorage.getItem(cacheKey);

    // // 1️⃣ If cache exists → check count
    // if (cached) {
    //   const parsed = JSON.parse(cached);

    //   this._documentTypeService
    //     .GetAllDocumentTypes(
    //       query?.filterModel?.Name?.filter || '',
    //       sort?.sort?.toUpperCase() || 'ASC',
    //       sort?.colId || 'Name',
    //       true,
    //       pageNumber,
    //       pageSize
    //     )
    //     .subscribe((res) => {
    //       if (res?.Success && res.Data?.Items) {
    //         this.totalDocumentTypes = res.Data.TotalCount;
    //         this.documentTypeData = res.Data.Items.map((item: any) => ({
    //           Code: item.code || item.Code,
    //           Name: item.name || item.Name,
    //           Description: item.description || item.Description,
    //           CreatedBy: item.createdBy || item.CreatedBy || '',
    //           CreatedAt: item.createdAt || item.CreatedAt || '',
    //         }));
    //         //console.log('Mapped documentTypeData:', this.documentTypeData);
    //         localStorage.setItem(
    //           'DOCUMENTTYPES',
    //           JSON.stringify({
    //             count: this.totalDocumentTypes,
    //             data: this.documentTypeData,
    //           })
    //         );
    //       } else {
    //         this.documentTypeData = [];
    //       }
    //       //this.cdr.detectChanges(); // force update
    //     });
    // }
    // // ❌ Cache outdated → fetch fresh
    // this.fetchDocumentTypes(query, sort, pageNumber, pageSize);
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllDocumentTypes({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }
}
