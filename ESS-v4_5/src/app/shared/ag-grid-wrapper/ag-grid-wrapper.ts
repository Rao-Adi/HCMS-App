import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  input,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
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
  @Input() gridId!: string;

  //@Input() pageSizeOptions = [10, 20, 30, 50];
  @Input() pageSizeOptions = [1, 2, 3, 50];
  @Input() defaultPageSize = 10;

  @Output() pageSizeChange = new EventEmitter<{ gridId: string; pageSize: number }>();
  @Output() cellClicked = new EventEmitter<any>();

  @Output() serverQuery = new EventEmitter<{
    pageNumber: number;
    pageSize: number;
    sortModel: any;
    filterModel: any;
  }>();

  @Output() rowEdited = new EventEmitter<any>();

  gridApi!: GridApi;

  private isGridInitialized = false;

  pageNumber = 1;
  //pageSize!: number;
  totalPages = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    //this.pageSize = this.defaultPageSize;
  }

  gridOptions: GridOptions = {
    context: {
      componentParent: this,
    },
  };

  ngOnChanges(changes: SimpleChanges) {
    //console.log('ngOnChanges - totalRows:', this.totalRows, 'pageSize:', this.pageSize);
    if (changes['totalRows'] || changes['pageSize']) {
      this.totalPages = Math.max(1, Math.ceil(this.totalRows / this.pageSize));
      if (this.pageNumber > this.totalPages) {
        this.pageNumber = this.totalPages;
      }
      //console.log('Updated totalPages:', this.totalPages, 'pageNumber:', this.pageNumber);
      this.cdr.detectChanges();
    }
  }

  goToPage(page: number) {
    //console.log('goToPage called:', page, 'totalPages:', this.totalPages);
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.emitQuery();
    this.cdr.detectChanges();
  }

  onPageSizeChange(value: any) {
    this.pageSize = Number(value);
    this.pageNumber = 1;

    this.pageSizeChange.emit({ gridId: this.gridId, pageSize: this.pageSize }); // <-- emit page size to parent
    this.emitQuery();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.isGridInitialized = true;

    // Delay first emit to allow grid to stabilize
    // setTimeout(() => {
    //   this.isGridInitialized = true;
    //   this.emitQuery();
    // });
  }

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
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      sortModel: this.gridApi
        .getColumnState()
        .filter((c) => c.sort)
        .map((c) => ({ colId: c.colId, sort: c.sort })),
      filterModel: this.gridApi.getFilterModel(),
    });
  }

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

  onCellClicked(event: any) {
    this.cellClicked.emit(event);
  }
}
