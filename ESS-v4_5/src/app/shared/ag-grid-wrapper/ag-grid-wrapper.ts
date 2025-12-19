import { CommonModule } from '@angular/common';
import { Component, input, Input, OnInit } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
//import { ColDef, GridReadyEvent } from 'ag-grid-community';
import {
  ClientSideRowModelModule,
  ColDef,
  ColGroupDef,
  ColumnApiModule,
  ColumnState,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ModuleRegistry,
  ValidationModule,
} from 'ag-grid-community';

import { SafeTranslatePipe } from '../pipes/filter-label/safeTranslate.pipe';
import { AgGridDataService } from '@app/core/services/ag-grid-data.service';

@Component({
  selector: 'app-ag-grid-wrapper',
  standalone: true,
  imports: [CommonModule, AgGridAngular, SafeTranslatePipe],
  templateUrl: './ag-grid-wrapper.html',
  styleUrl: './ag-grid-wrapper.css',
})
export class AgGridWrapper implements OnInit {
  @Input() columnDefs: ColDef[] = [];
  @Input() pagination: boolean = true;
  @Input() overlayNoRowsTemplate: string = '';
  @Input() pageSize = 10;
  @Input() rowData: any[] = [];
  @Input() defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    editable: true,
    resizable: true,
  };
  @Input() gridStyle: { [key: string]: any } = {};

  gridApi!: GridApi;
  totalRows = 0;

  ngOnInit(): void {}

  // Default Column Definitions: Apply configuration across all columns

  public noRowsOverlay: string = '';

  constructor(private gridService: AgGridDataService) {}

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    //this.gridApi.setRowData(this.rowData); // initial set
  }
 
  loadData(pageNumber: number) {
    const request = {
      pageNumber,
      pageSize: this.pageSize,
      sortModel: this.gridApi
        .getColumnState()
        .filter((c) => c.sort)
        .map((c) => ({ colId: c.colId, sort: c.sort })),
      filterModel: this.gridApi.getFilterModel(),
    };

    // this.gridService.loadData(this.apiUrl, request).subscribe((res) => {
    //   this.rowData = res.data;
    //   this.totalRows = res.totalRecords;
    // });
  }

  onCellValueChanged(event: any) {
    console.log('Updated Cell:', event.data);
    // Call update API here
  }

  onFilterChanged() {
    this.loadData(1);
  }

  onSortChanged() {
    this.loadData(1);
  }
}
