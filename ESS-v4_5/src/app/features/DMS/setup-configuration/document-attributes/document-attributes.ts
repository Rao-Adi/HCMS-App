import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { tuple } from 'ng-zorro-antd/core/types';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-document-attributes',
  imports: [
    CommonModule,
    FormsModule,
    AgGridWrapper,
    NzSelectModule,
    SafeTranslatePipe,
    DocumentTypeList,
  ],
  templateUrl: './document-attributes.html',
  styleUrl: './document-attributes.css',
})
export class DocumentAttributes {
  constructor() {}

  ngOnInit() {
    //this.loadData(this.pageSize);
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';
  selectedDocumentType?: string ='';
  documentTypes: SelectList[] = [];
  pageSize = 10;
  totalRows = 0;
  totalCount = 0;

  documentAttributeColumnDefs = [
    { field: 'controlLebel', headerName: 'Control Lebel', flex: 1 },
    { field: 'controlType', headerName: 'Control Type', flex: 1 },
    { field: 'listValue', headerName: 'List Value', flex: 1 },
    { field: 'mandatoryCabinetWise', headerName: 'Mandatory (Cabinet Wise)', flex: 1 },
  ];

  rowData: any[] = [
    {
      controlLebel: 'Submit Date',
      controlType: 'Date',
      ListValue: null,
      mandatoryCabinetWise: 'View Cabinet Wise',
    },
    {
      controlLebel: 'Document Description',
      controlType: 'Text Box',
      listValue: null,
      mandatoryCabinetWise: 'View Cabinet Wise',
    },
    {
      controlLebel: 'Contract Type',
      controlType: 'List Value',
      listValue: null,
      mandatoryCabinetWise: 'View Cabinet Wise',
    },
  ];

   onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;
  }


  loadBusinessDomains(query: any): void {
    const sort = query.sortModel?.[0];

    // this._businessDomainService
    //   .GetAllBusinessDomains(
    //     query.filterModel?.Name?.filter || '',
    //     sort?.sort?.toUpperCase() || 'ASC',
    //     sort?.colId || 'Name',
    //     true,
    //     query.pageNumber,
    //     query.pageSize
    //   )
    //   .subscribe((res) => {
    //     if (res?.Success) {
    //       this.businessDomainData = res.Data.Items;
    //       this.totalBusinessDomains = res.Data.TotalCount;
    //     } else {
    //       this.businessDomainData = [];
    //       this.totalBusinessDomains = 0;
    //     }
    //   });
  }

}
