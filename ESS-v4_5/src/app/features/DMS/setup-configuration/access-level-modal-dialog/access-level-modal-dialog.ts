import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-access-level-modal-dialog',
  imports: [CommonModule, FormsModule, AgGridWrapper],
  templateUrl: './access-level-modal-dialog.html',
  styleUrl: './access-level-modal-dialog.css',
})
export class AccessLevelModalDialog {
  @Input() data: any;

  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  totalCount = 0;

  rowData: any[] = [];

  constructor(private modalRef: NzModalRef) {}

  documentAttributeColumnDefs = [
    { field: 'division', headerName: 'Division', flex: 1 },
    { field: 'department', headerName: 'Department', flex: 1 },
    { field: 'subdepartment', headerName: 'Sub-Department', flex: 1 },
    { field: 'documentType', headerName: 'Document Type', flex: 1 }
  ];

  close() {
    this.modalRef.close();
  }

  GetAllDocumentTypeGrid(query: any) {}

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
