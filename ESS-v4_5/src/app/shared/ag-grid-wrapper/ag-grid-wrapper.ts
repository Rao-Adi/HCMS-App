import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, OnInit, Output } from '@angular/core';
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

@Component({
  selector: 'app-ag-grid-wrapper',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './ag-grid-wrapper.html',
  styleUrl: './ag-grid-wrapper.css',
})
export class AgGridWrapper implements OnInit {
  @Input() columnDefs: ColDef[] = [];
  @Input() rowData: any[] = [];
  @Input() pageSize = 10;
  @Input() defaultColDef!: ColDef;
  @Input() totalRows = 0;
  @Input() gridStyle: any = {};

  @Output() serverQuery = new EventEmitter<any>();
  @Output() rowEdited = new EventEmitter<any>();

  gridApi!: GridApi;

  private gridReadyDone = false;
  private suppressEvents = false;
  private suppressEmit = false;
  private isProgrammaticUpdate = false;
  private isGridInitialized = false;

  @Input() pageSizeOptions = [10, 20, 30, 50];
  @Input() defaultPageSize = 10;
  pageNumber = 1;
  //pageSize!: number;
  totalPages = 0;

  ngOnInit(): void {
    this.pageSize = this.defaultPageSize;
  }

  ngOnChanges() {
    this.totalPages = Math.ceil(this.totalRows / this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.emitQuery();
  }

  onPageSizeChange(value: any) {
    const newSize = Number(value);

    if (!newSize || isNaN(newSize)) return;

    this.pageSize = newSize;
    this.pageNumber = 1;
    this.emitQuery();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;

    // Delay first emit to allow grid to stabilize
    setTimeout(() => {
      this.isGridInitialized = true;
      this.emitQuery();
    });
  }
  // onGridReady(params: GridReadyEvent) {
  //   debugger;
  //   this.gridApi = params.api;
  //   this.gridReadyDone = true;

  //   // 🔥 Initial load – call API ONCE
  //   // setTimeout(() => this.emitServerQuery(true), 0);

  //   const datasource = {
  //     getRows: (params: any) => {
  //       const page = params.request.startRow / this.pageSize + 1;

  //       this.serverQuery.emit({
  //         pageNumber: page,
  //         pageSize: this.pageSize,
  //         sortModel: params.request.sortModel,
  //         filterModel: params.request.filterModel,
  //         success: params.success,
  //       });
  //     },
  //   };
  // }

  onSortChanged() {
    if (!this.isGridInitialized) return;
    this.pageNumber = 1;
    this.emitQuery();
  }

  onFilterChanged() {
    if (!this.isGridInitialized) return;
    this.pageNumber = 1;
    this.emitQuery();
  }

  private emitQuery() {
    if (!this.gridApi) return;
    if (!this.pageSize || !this.pageNumber) return;

    this.serverQuery.emit({
      sortModel: this.gridApi
        .getColumnState()
        .filter((c) => c.sort)
        .map((c) => ({ colId: c.colId, sort: c.sort })),
      filterModel: this.gridApi.getFilterModel(),
    });
  }

  // onPaginationChanged(event: any) {
  //   if (this.isProgrammaticUpdate) return;
  //   if (!event.api || !event.newPage) return;

  //   this.emitServerQuery();
  // }

  // onSortChanged(event: any) {
  //   if (this.isProgrammaticUpdate) return;
  //   if (!event.source || event.source !== 'uiColumnSorted') return;

  //   this.emitServerQuery(true);
  // }

  // onFilterChanged(event: any) {
  //   if (this.isProgrammaticUpdate) return;
  //   if (!event.source || event.source !== 'uiFilterChanged') return;

  //   this.emitServerQuery(true);
  // }

  onCellValueChanged(event: any) {
    if (
      event.newValue === event.oldValue ||
      event.newValue === null ||
      event.newValue === undefined
    ) {
      return;
    }

    this.rowEdited.emit({
      data: event.data,
      field: event.colDef.field,
      newValue: event.newValue,
      oldValue: event.oldValue,
    });
  }

  private canEmit(): boolean {
    return this.gridReadyDone && !this.suppressEvents;
  }

  private emitServerQuery(resetPage = false) {
    if (!this.gridApi) return;

    this.suppressEvents = true;

    if (resetPage) {
      this.gridApi.paginationGoToFirstPage();
    }

    const currentPage = this.gridApi.paginationGetCurrentPage() + 1;

    const sortModel = this.gridApi
      .getColumnState()
      .filter((c) => !!c.sort)
      .map((c) => ({ colId: c.colId, sort: c.sort }));

    this.serverQuery.emit({
      pageNumber: currentPage,
      pageSize: this.pageSize,
      sortModel,
      filterModel: this.gridApi.getFilterModel(),
    });

    // allow events again AFTER cycle completes
    setTimeout(() => (this.suppressEvents = false));
  }
}
