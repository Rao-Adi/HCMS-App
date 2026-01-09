import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper'; 
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { MandatoryCabinetWisePopup } from '../mandatory-cabinet-wise-popup/mandatory-cabinet-wise-popup';
@Component({
  selector: 'app-document-attributes',
  imports: [
    CommonModule,
    FormsModule,
    EditableAgGridWrapper,
    NzSelectModule,
    SafeTranslatePipe,
    DocumentTypeList,
    NzButtonModule,
    NzModalModule,
  ],
  templateUrl: './document-attributes.html',
  styleUrl: './document-attributes.css',
})
export class DocumentAttributes {
  gridConfig: GridConfig = {} as GridConfig;

  selectedPageSize = 10;
  pageSize = 10;
  totalDocumentAttributes = 0;
  documentAttributeData: any[] = [];

  controlTypes: any[] = [
    {
      id: '1',
      text: 'Date',
    },
    {
      id: '2',
      text: 'Numeric',
    },
    {
      id: '3',
      text: 'TextBox',
    },
    {
      id: '4',
      text: 'List',
    },
  ]; // for dropdowns
  selectedDocumentType?: string = '';
  documentTypes: SelectList[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  constructor(
    private _documentAttribute: DocumentAttributeService,
    private modal: NzModalService
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
    //this.loadSampleData();

    this.getAllDocumentAttributes({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  pinnedTopRowDataPlanning: DocumentAttributeColumns[] = [
    {
      ControlLabel: '',
      ControlTypeId: '',
      ControlTypeName: '',
      ListValue: '',
      Mandatory: '',
    },
  ];

  private loadSampleData(): void {
    this.documentAttributeData = [
      {
        ControlLabel: 'Control Type',
        ControlTypeId: 'Text Box',
        ListValue: 'Car, House, Bike',
        Mandatory: 'View Cabinet',
      },
    ];
  }

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'ControlLabel',
        headerName: 'Control Label',
        type: 'text',
        required: true,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'ControlTypeId',
        headerName: 'Control Type',
        type: 'dropdown',
        dropdownOptions: this.controlTypes,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
        minWidth: 200,
      },
      {
        field: 'ListValue',
        headerName: 'List Value',
        type: 'text',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'Mandatory',
        headerName: 'Mandatory(Cabinet Wise)',
        type: 'button',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
    ];
  }

  getAllDocumentAttributes = (query: any) => {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._documentAttribute
      .GetAllDocumentAttribute(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize
      )
      .subscribe((res) => {
        const items = res?.Data?.Items;

        if (Array.isArray(items)) {
          this.documentAttributeData = items.map((item: any) => ({
            Id: item.Id,
            DocumentTypeCode: item.DocumentTypeCode,
            ControlLabel: item.ControlLabel,
            ControlTypeId:
              this.controlTypes.find((ct) => ct.id === String(item.ControlType))?.text ||
              item.ControlType, // ✅ matches column
            ListValue: item.ListValues, // ✅ plural in API
            Mandatory: item.IsMandatory, // ✅ boolean
          }));
        } else {
          this.documentAttributeData = [];
        }

        console.log('RowData length:', this.documentAttributeData.length);
      });
  };

  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllDocumentAttributes({
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

  // private generateId(): number {
  //   return Date.now();
  // }

  // private getDisplayName(options: any[], id: any): string {
  //   const option = options.find((opt) => opt.id == id);
  //   return option ? option.text : '';
  // }

  /* ================= Inline Events ================= */

  onRowAdded(row: any): void {
    //console.log('➕ Row Added:', row);
 
    const payLoad = {
      documentTypeCode: this.selectedDocumentType,
      controlLabel: row.ControlLabel,
      controlType: row.ControlTypeId,
      listvalues: row.ListValue,
      isMandatory: false,
      IsActive: true,
      IsDeleted: false,
    };

    this._documentAttribute.create(payLoad).subscribe(() => {
      console.log('Created');
    });
  }

  onRowUpdated(event: { rowData: any }): void {
  
    //console.log('✏️ Row Updated:', event.rowData);
    const payLoad = {
      id: event.rowData.Id,
      documentTypeCode: this.selectedDocumentType,
      controlLabel: event.rowData.ControlLabel,
      controlType: event.rowData.ControlTypeId,
      listValues: event.rowData.ListValue,
      isMandatory: true,
      IsActive: true,
      IsDeleted: false,
    };
    this._documentAttribute.update(payLoad).subscribe(() => {
      console.log('Updated');
    });
  }

  onRowDeleted(index: number): void {
    const row = this.documentAttributeData[index];

    //console.log('🗑️ Row Deleted:', row);

    this._documentAttribute.delete(row.Code).subscribe(() => {
      //console.log('Deleted');
    });
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', event);
  }

  onSelectionChanged(selectedRows: any[]): void {
    //console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }

  handleGridAction(event: { action: string; rowData: any }) {
    if (event.action === 'VIEW_CABINET') {
      this.openCabinetModal(event.rowData);
    }
  }

  openCabinetModal(rowData: any): void {
    const modalRef = this.modal.create({
      nzTitle: 'Mandatory (Cabinet Wise)',
      nzContent: MandatoryCabinetWisePopup,
      nzData: {
        name: 'Access Level',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      //console.log('Modal closed with:', result);
    });
  }
}

class DocumentAttributeColumns {
  ControlLabel: string = '';
  ControlTypeId: string = '';
  ControlTypeName: string = '';
  ListValue: string = '';
  Mandatory: string = '';
}
