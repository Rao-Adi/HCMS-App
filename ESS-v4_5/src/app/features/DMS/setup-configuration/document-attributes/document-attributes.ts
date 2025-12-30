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
import { NzModalService } from 'ng-zorro-antd/modal';
import { MandatoryCabinetWisePopup } from '../mandatory-cabinet-wise-popup/mandatory-cabinet-wise-popup';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TextboxRendererComponent } from '@app/shared/controlls/textbox-renderer-component/textbox-renderer-component';

@Component({
  selector: 'app-document-attributes',
  imports: [
    CommonModule,
    FormsModule,
    AgGridWrapper,
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
  constructor(private modal: NzModalService) {}

  ngOnInit() {
    //this.loadData(this.pageSize);
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: true,
  };
  public noRowsOverlay: string = '';
  selectedDocumentType?: string = '';
  documentTypes: SelectList[] = [];
  pageSize = 10;
  totalRows = 0;
  totalCount = 0;

  documentAttributeColumnDefs = [
    {
      headerName: 'Actions',
      field: 'save',
      width: 100,
      cellRenderer: (params: any) => {
        if (params.data.isNewRow) {
          // Green plus button for new row insert
          return `<button class="btn-insert" title="Add New Record" style="background: transparent; border: none; padding: 0; cursor: pointer;">
                          <img  class="save-btn"
                          src="/assets/images/tablePlus.png"
                          alt="+"
                          style="width: 18px; height: 18px; display: block;"/>
                </button>`;
        } else {
          // Edit and delete icons for existing rows
          return `
            <button class="btn-edit" title="Edit" style="background: transparent; border: none; padding: 0; cursor: pointer;">
            <img  class="save-btn"
                          src="/assets/images/imgEdit.png"
                          alt="+"
                          style="width: 18px; height: 18px; display: block;"/>
            </button> 
            <button class="btn-delete" title="Delete" style="background: transparent; border: none; padding: 0; cursor: pointer;">
            <img  class="save-btn"
                          src="/assets/images/imgRemove.png"
                          alt="+"
                          style="width: 18px; height: 18px; display: block;"/>
            </button>
          `;
        }
      },
      //cellRenderer: (params: any) => `<i class="bi bi-plus save-btn" style="font-weight: 900; font-size: 18px; line-height: 1; color: inherit;  cursor: pointer;"></i>`,
      // cellRenderer: (params: any) => `
      //         <button
      //         class="save-btn"
      //         style="background: transparent; border: none; padding: 0; cursor: pointer;"
      //       >
      //         <img  class="save-btn"
      //           src="/assets/images/tablePlus.png"
      //           alt="+"
      //           style="width: 18px; height: 18px; display: block;"
      //         />
      //       </button>
      //       `,
      editable: false,
      sortable: false,
      filter: false,
    },
    { field: 'controlLebel', headerName: 'Control Lebel', flex: 1,editable: true, },
    { field: 'controlType', headerName: 'Control Type', flex: 1,editable: true, },
    {
      field: 'listValue',
      headerName: 'List Value',
      flex: 1,
      editable: true,
      cellEditor: 'agTextCellEditor', // correct for built-in editor
      cellEditorParams: { maxLength: 100 }, // fine for extra params
      cellEditorFramework: TextboxRendererComponent, // ⚠️ conflict here
    },
    {
      field: 'mandatoryCabinetWise',
      headerName: 'Mandatory (Cabinet Wise)',
      flex: 1,
      editable: false,
      cellRenderer: (params: any) => {
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          ${params.value ? 'View Cabinet' : 'View Cabinet'}
        </span>
      `;
      },
      // onCellClicked: (event: any) => {
      //   this.openMandatoryCabinetModal(event.data);
      // },
    },
  ];
  rowData = [
    {
      id: 1,
      controlLabel: 'Submit Date',
      controlType: 'Date',
      listValue: '',
      mandatoryCabinetWise: true,
      isNewRow: false,
    },
    {
      id: 2,
      controlLabel: 'Document Description',
      controlType: 'Text Box',
      listValue: '',
      mandatoryCabinetWise: false,
      isNewRow: false,
    },
    {
      id: 3,
      controlLabel: 'Contract Type',
      controlType: 'List Value',
      listValue: 'Development Contract, Main Contract',
      mandatoryCabinetWise: true,
      isNewRow: false,
    },
  ];
  // This getter adds the new blank row on top
  get rowDataWithNewRow() {
    return [
      {
        id: 0,
        controlLabel: '',
        controlType: '',
        listValue: '',
        mandatoryCabinetWise: false,
        isNewRow: true,
      }, // blank new row
      ...this.rowData,
    ];
  }

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

  GetAllDocumentTypeGrid(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'documentTypeGrid':
        this.divisionPageSize = pageSize;
        this.GetAllDocumentTypeGrid({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      default:
        break;
    }
  }

  openMandatoryCabinetModal(rowData: any) {
    console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Mandatory (Cabinet Wise)',
      nzContent: MandatoryCabinetWisePopup,
      nzData: {
        name: 'Rao Adnan',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  onRowEdited(event: any) {
    console.log('Cell edited:', event);

    // You can also save row here or debounce saves as needed
  }

  // Catch save button clicks inside the grid - by subscribing to the wrapper's cellClicked (add if needed)
  // Called when any cell is clicked inside the grid
  onGridCellClicked(event: any) {
    if (event.colDef.field === 'actions') {
      const target = event.event.target as HTMLElement;

      if (target.classList.contains('btn-insert')) {
        this.insertNewRecord(event.data);
      } else if (target.classList.contains('btn-edit')) {
        this.editRecord(event.data);
      } else if (target.classList.contains('btn-delete')) {
        this.deleteRecord(event.data);
      }
    }

    if (event.colDef.field === 'mandatoryCabinetWise') {
      this.openMandatoryCabinetModal(event.data);
    }

    // // Handle Save button click
    // if (event.colDef.field === 'save' && event.event.target.classList.contains('save-btn')) {
    //   this.saveRow(event.data);
    //   return;
    // }

    // // Handle mandatoryCabinetWise click
    // if (
    //   event.colDef.field === 'mandatoryCabinetWise' &&
    //   event.event.target.dataset.action === 'open'
    // ) {
    //   this.openMandatoryCabinetModal(event.data);
    //   return;
    // }
  }

  insertNewRecord(newRowData: any) {
    console.log('Insert new record:', newRowData);

    // Validate inputs, then add to rowData and clear new row inputs
    if (!newRowData.controlLabel) {
      alert('Control Label is required!');
      return;
    }

    // Assign new ID (in real apps, get from backend)
    const newId = this.rowData.length ? Math.max(...this.rowData.map((r) => r.id)) + 1 : 1;

    const newRecord = {
      ...newRowData,
      id: newId,
      isNewRow: false,
    };

    this.rowData = [newRecord, ...this.rowData];

    // Clear new row fields by resetting newRowData (you'll need a better form of 2-way binding or state management)
    this.rowData[0].controlLabel = '';
    this.rowData[0].controlType = '';
    this.rowData[0].listValue = '';
    this.rowData[0].mandatoryCabinetWise = false;
  }

  editRecord(data: any) {
    alert(`Edit record: ${data.controlLabel}`);
    // Put your logic to enable editing mode or open modal, etc.
  }

  deleteRecord(data: any) {
    if (confirm(`Are you sure to delete ${data.controlLabel}?`)) {
      this.rowData = this.rowData.filter((row) => row.id !== data.id);
    }
  }

  saveRow(rowData: any) {
    console.log('Saving row:', rowData);
    // Replace with actual API call

    setTimeout(() => {
      alert(`Saved row with Control Label: ${rowData.controlLabel}`);
    }, 500);
  }

  addNewRow() {
    const newItem = {
      controlLabel: '',
      controlType: '',
      listValue: '',
      mandatoryCabinetWise: false,
    };
    //this.rowData = [newItem, ...this.rowData];
  }
}
