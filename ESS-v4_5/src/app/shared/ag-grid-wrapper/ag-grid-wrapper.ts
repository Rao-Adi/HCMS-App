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
  @Input() pagination: Boolean = true;
  @Input() overlayNoRowsTemplate: string = '';
  @Input() apiUrl!: string;
  @Input() pageSize = 10;
  @Input() rowData: any[] = [];
  @Input() defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    editable: true,
    resizable: true,
  };
  @Input() useMockData = false;

  ngOnInit(): void {}

  gridApi!: GridApi;
  totalRows = 0;

  //public UploadColumnDefs: ColDef[] = [];
  // Default Column Definitions: Apply configuration across all columns

  public noRowsOverlay: string = '';

  constructor(private gridService: AgGridDataService) {}

  UploadColumnDefs = [
    { field: 'documentId', headerName: 'Document ID', width: 100 },
    { field: 'documentName', headerName: 'Document Name', width: 100 },
    { field: 'version', headerName: 'Version', width: 100 },
    { field: 'documentType', headerName: 'Document Type', width: 100 },
    { field: 'division', headerName: 'Division', width: 100 },
    { field: 'department', headerName: 'Department', width: 100 },
    { field: 'subDepartment', headerName: 'Sub-Department', width: 100 },
    { field: 'nextReviewDate', headerName: 'Next Review Date', width: 100 },
    { field: 'uploadDocument', headerName: 'Upload Document', width: 100 },
  ];

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.loadData(1);
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

    this.gridService.loadData(this.apiUrl, request).subscribe((res) => {
      this.rowData = res.data;
      this.totalRows = res.totalRecords;
    });
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
