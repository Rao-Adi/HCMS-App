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
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
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
import { GridConfig } from '../editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { ColumnDisplayOptionsComponent } from './column-display-options-component/column-display-options-component';

interface ColumnToggle {
  field: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-ag-grid-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    NzAlertModule,
    NzSpinModule,
    ColumnDisplayOptionsComponent,
  ],
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
  @Input() isSelectionRequired: boolean = true;
  @Input() showDisplayOption: boolean = false;
  @Input() pageSizeOptions = [10, 20, 30, 50];
  @Input() defaultPageSize = 10;
  @Input() columnToggles?: ColumnToggle[];

  @Input() config: GridConfig = {
    columns: [],
    enablePagination: true,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    enableSorting: true,
    enableFiltering: true,
    enableSelection: true,
    enableInlineAdd: false,
    enableInlineEdit: false,
    enableInlineDelete: false,
    rowHeight: 47,
    headerHeight: 40,
    domLayout: 'autoHeight',
    theme: 'ag-theme-alpine',
    suppressCellFocus: true,
  };

  @Output() rowEdited = new EventEmitter<any>();
  // @Input() pageSizeOptions = [1, 2, 3, 50];

  @Output() pageSizeChange = new EventEmitter<{ gridId: string; pageSize: number }>();
  @Output() cellClicked = new EventEmitter<any>();

  @Output() serverQuery = new EventEmitter<{
    pageNumber: number;
    pageSize: number;
    sortModel: any;
    filterModel: any;
  }>();

  @Output() gridReady = new EventEmitter<GridReadyEvent>();

  finalColumnDefs: ColDef[] = [];
  gridContext: any;
  gridApi!: GridApi;

  private isGridInitialized = false;

  pageNumber = 1;
  //pageSize!: number;
  totalPages = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.buildFinalColumnDefs();
  }

  private buildFinalColumnDefs(): void {
    const cols: ColDef[] = [];

    // ✅ Inject selection column if enabled
    if (this.isSelectionRequired) {
      cols.push(this.createSelectionColumn());
    }

    // ✅ Append parent columns AS-IS
    cols.push(...this.columnDefs);

    this.finalColumnDefs = cols;
  }

  private createSelectionColumn(): ColDef {
    return {
      headerName: '',
      width: 50,
      pinned: 'left',
      lockPosition: true,
      sortable: false,
      filter: false,
      resizable: false,

      checkboxSelection: true, // row checkbox
      headerCheckboxSelection: true, // header select-all checkbox
      headerCheckboxSelectionFilteredOnly: true, // select only filtered rows (recommended)

      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    };
  }

  gridOptions: GridOptions = {
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
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

  onSelectionChanged() {
    const selectedRows = this.gridApi.getSelectedRows();
    console.log('Selected rows:', selectedRows);
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

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
    this.gridReady.emit(event);
    this.syncColumnState();
    // Delay first emit to allow grid to stabilize
    // setTimeout(() => {
    //   this.isGridInitialized = true;
    //   this.emitQuery();
    // });
  }

  saveColumnPrefs() {
    localStorage.setItem('documentGridColumns', JSON.stringify(this.columnToggles));
  }

  toggleColumn(col: ColumnToggle) {
    if (!this.gridApi) return;

    col.visible = !col.visible;
    this.gridApi.setColumnsVisible([col.field], col.visible);
  }

  syncColumnState() {
    if (!this.gridApi || !this.columnToggles) return;

    this.columnToggles.forEach((c) => {
      const column = this.gridApi.getColumn(c.field);
      c.visible = !!column?.isVisible();
    });
  }

  toggleAllColumns(event: any) {
    const visible = event.target.checked;

    this.columnToggles?.forEach((c) => {
      c.visible = visible;
    });
  }

  onToggleColumn(col: ColumnToggle) {
    if (!this.gridApi) return;

    this.gridApi.setColumnsVisible([col.field], col.visible);
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
