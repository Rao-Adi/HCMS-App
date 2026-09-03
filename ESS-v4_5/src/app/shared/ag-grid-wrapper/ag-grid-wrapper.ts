import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  input,
  Input,
  OnInit,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
  NgZone,
  ElementRef,
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
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { FormsModule } from '@angular/forms';
import { NzIconModule, NzIconService } from 'ng-zorro-antd/icon';
import { SettingOutline } from '@ant-design/icons-angular/icons';

import { SpinnerComponent } from '../spinner/spinner.component';

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
    FormsModule,
    AgGridAngular,
    NzAlertModule,
    NzSpinModule,
    NzSwitchModule,
    NzIconModule,
    SpinnerComponent
  ],
  templateUrl: './ag-grid-wrapper.html',
  styleUrl: './ag-grid-wrapper.css',
})
export class AgGridWrapper implements OnInit, OnChanges {
  @Input() columnDefs: ColDef[] = [];
  @Input() autoSizeColumns: boolean = true;
  @Input() rowData: any[] = [];
  @Input() loading: boolean | null = null;
  isLoading = false;
  @Input() pageSize = 10;
  @Input() defaultColDef!: ColDef;

  get finalDefaultColDef(): ColDef {
    return {
      ...this.defaultColDef,
      // wrapHeaderText only breaks at word boundaries if the column is wide enough for the
      // longest word -- placed after the spread (not before) so it's a genuine floor even
      // when the consumer's own defaultColDef sets a smaller minWidth (most of them set 100,
      // which was silently winning here and defeating this floor entirely). An individual
      // column's own minWidth in columnDefs still overrides this normally -- that's a
      // separate, higher-precedence merge layer AG Grid applies on top of defaultColDef.
      minWidth: 120,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      // Narrow columns (or long values like timestamps/names) silently clip cell text with no
      // way to see what was cut off -- a hover tooltip showing the full value fixes that for
      // every column in every grid using this wrapper, without having to widen columns (which
      // just pushes the same problem onto grids with many columns). A column's own
      // tooltipValueGetter/tooltipField in columnDefs still overrides this normally.
      tooltipValueGetter: (params: any) =>
        params.value != null && params.value !== '' ? String(params.value) : null,
    };
  }
  @Input() totalRows = 0;
  @Input() gridStyle: any = {};

  // AG Grid's own noRowsOverlayComponent slot (used successfully in EditableAgGridWrapper)
  // depends on api.showNoRowsOverlay()/hideOverlay() actually taking effect for the infinite
  // row model this wrapper uses for every server-paginated grid -- tried twice now (this and
  // an earlier round) and it doesn't reliably show. This plain Angular binding sidesteps AG
  // Grid's overlay API entirely: Angular re-evaluates it on its own whenever totalRows changes,
  // no imperative "trigger the overlay now" call for AG Grid to silently drop.
  get showNoRowsMessage(): boolean {
    return this.isServerSide && !this.isLoading && this.totalRows === 0;
  }

  // With domLayout: 'autoHeight' (the config default), AG Grid computes and sets its own
  // height to fit the current page's rows -- a consumer-supplied fixed height in gridStyle
  // would fight that (either clipping the grid or leaving dead space) since it's an inline
  // style applied to the same host element. Width and any other style props still pass through.
  get finalGridStyle(): any {
    if (this.config.domLayout !== 'autoHeight') return this.gridStyle;
    const { height, ...rest } = this.gridStyle || {};
    return rest;
  }
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
    searchText?: string;
    searchTerm?: string;
  }>();

  @Output() gridReady = new EventEmitter<GridReadyEvent>();
  @Output() selectionChange = new EventEmitter<any>();
  @Output() rowSelected = new EventEmitter<any>();
  @Output() rowDeselected = new EventEmitter<any>();
  finalColumnDefs: ColDef[] = [];
  gridContext: any;
  gridApi!: GridApi;

  private isGridInitialized = false;
  isServerSide = false;
  private getRowsParams: any = null;

  pageNumber = 1;
  //pageSize!: number;
  totalPages = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private el: ElementRef,
    private iconService: NzIconService,
  ) {
    this.iconService.addIcon(SettingOutline);
    this.iconService.addIcon({ ...SettingOutline, name: 'setting-o' });
  }

  ngOnInit(): void {
    if (this.loading !== null) {
      this.isLoading = this.loading;
    } else {
      this.isLoading = true;
    }

    this.isServerSide = this.serverQuery.observed;
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

    // ✅ Apply audit styling to all audit trail columns (header + cell) and wrap cellRenderer for highlighting
    cols.forEach((col: ColDef) => {
      const isAuditCell =
        (typeof col.cellClass === 'string' && col.cellClass.includes('audit-cell')) ||
        (Array.isArray(col.cellClass) && col.cellClass.includes('audit-cell')) ||
        (col.headerName && /last saved|created|modified|requested|audit/i.test(col.headerName)) ||
        (col.field && /created|modified|saved|requested|audit/i.test(col.field));

      if (isAuditCell) {
        if (typeof col.headerClass === 'string') {
          if (!col.headerClass.includes('audit-cell')) {
            col.headerClass = `${col.headerClass} audit-cell`;
          }
        } else if (!col.headerClass) {
          col.headerClass = 'audit-cell';
        }

        if (typeof col.cellClass === 'string') {
          if (!col.cellClass.includes('audit-cell')) {
            col.cellClass = `${col.cellClass} audit-cell`;
          }
        } else if (!col.cellClass) {
          col.cellClass = 'audit-cell';
        }
      }

      // Wrap cell renderer for highlighting
      if (col.checkboxSelection) {
        return;
      }

      const originalCellRenderer = col.cellRenderer;
      const isFn = typeof originalCellRenderer === 'function';
      const isAngularComponent = isFn &&
        (!!(originalCellRenderer as any).ɵcmp ||
         !!(originalCellRenderer as any).ɵfac ||
         (originalCellRenderer.prototype && typeof originalCellRenderer.prototype.agInit === 'function'));

      // Only wrap if it's a function or if there is no custom renderer
      if (!originalCellRenderer || (isFn && !isAngularComponent)) {
        col.cellRenderer = (params: any) => {
          let content: any = null;
          if (originalCellRenderer) {
            content = originalCellRenderer(params);
          } else {
            if (col.valueFormatter && typeof col.valueFormatter === 'function') {
              content = col.valueFormatter(params);
            } else {
              content = params.value;
            }
          }

          if (content == null || content === '') {
            return '';
          }

          const searchTerm = this.searchValue ? this.searchValue.trim() : '';

          if (content instanceof HTMLElement) {
            this.highlightTextInElement(content, searchTerm);
            return content;
          }

          const contentStr = content.toString();
          const container = document.createElement('span');
          container.innerHTML = contentStr;
          this.highlightTextInElement(container, searchTerm);
          return container;
        };
      }
    });

    this.finalColumnDefs = cols;
  }

  private createSelectionColumn(): ColDef {
    return {
      headerName: '',
      width: 50,
      minWidth: 50,
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
    if (changes['loading'] && this.loading !== null) {
      this.isLoading = this.loading;
    }
    if (changes['rowData']) {
      if (this.loading === null) {
        this.isLoading = false;
      }
    }
    if (changes['columnDefs']) {
      this.buildFinalColumnDefs();
    }
    if (this.isServerSide && this.getRowsParams) {
      if (changes['rowData'] || changes['totalRows']) {
        const rows = this.rowData || [];
        this.getRowsParams.successCallback(rows, this.totalRows);
        this.getRowsParams = null; // Consume it so we don't double call
      }
    }
    if (changes['rowData'] && this.autoSizeColumns && this.gridApi) {
      setTimeout(() => {
        this.autoSizeGridColumns();
      }, 50);
    }
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
    this.gridReady.emit(event);
    this.syncColumnState();

    if (this.isServerSide) {
      const dataSource = {
        getRows: (params: any) => {
          this.getRowsParams = params;
          this.pageNumber = Math.floor(params.startRow / this.pageSize) + 1;

          if (this.loading === null) {
            this.isLoading = true;
          }

          this.ngZone.run(() => {
            this.serverQuery.emit({
              pageNumber: this.pageNumber,
              pageSize: this.pageSize,
              sortModel: params.sortModel.map((c: any) => ({ colId: c.colId, sort: c.sort })),
              filterModel: params.filterModel,
              searchText: this.searchValue,
              searchTerm: this.searchValue,
            });
          });
        },
      };
      this.gridApi.setGridOption('datasource', dataSource);
    }

    // Subscribe to selection changes
    this.gridApi.addEventListener('selectionChanged', () => {
      const selectedRows = this.gridApi.getSelectedRows();
      this.selectionChange.emit(selectedRows);
    });

    setTimeout(() => {
      this.isGridInitialized = true;
    });
  }

  autoSizeGridColumns(): void {
    if (!this.gridApi) return;
    const columns = this.gridApi.getColumns();
    if (!columns || columns.length === 0) return;

    // Content-sized width only -- no sizeColumnsToFit() fallback. That call used to fire
    // whenever the auto-sized columns left the grid narrower than its container, proportionally
    // stretching every column (including ones with short values like "SOP" or "1.0") to fill
    // the full width, which is exactly the padded-out look this was meant to avoid. Columns
    // that intentionally want to fill available space still can via their own flex on the
    // column def -- that's an explicit per-grid choice, untouched by this method.
    const allColumnIds = columns.map((col: any) => col.getId());
    this.gridApi.autoSizeColumns(allColumnIds);


    // Delay calculation to let AG Grid calculate and apply auto-sized column widths first
    setTimeout(() => {
      if (!this.gridApi) return;
      const cols = this.gridApi.getColumns();
      if (!cols || cols.length === 0) return;

      let totalColumnWidth = 0;
      cols.forEach((col: any) => {
        totalColumnWidth += col.getActualWidth();
      });

      const gridDiv = this.el.nativeElement.querySelector('.ag-theme-alpine') || this.el.nativeElement;
      const gridWidth = gridDiv ? gridDiv.offsetWidth : 0;

      if (totalColumnWidth < gridWidth) {
        this.gridApi.sizeColumnsToFit();
      }
    }, 150);
  }

  onFirstDataRendered(event: any): void {
    if (this.autoSizeColumns) {
      this.autoSizeGridColumns();
    }
  }

  onRowDataUpdated(event: any): void {
    if (this.autoSizeColumns) {
      this.autoSizeGridColumns();
    }
  }

  onSelectionChanged() {
    const selectedRows = this.gridApi.getSelectedRows();
  }

  saveColumnPrefs() {
    localStorage.setItem('documentGridColumns', JSON.stringify(this.columnToggles));
  }

  toggleColumn(col: any, checked: boolean): void {
    //if (!this.gridApi) return;

    col.visible = checked;
    this.gridApi.setColumnsVisible([col.field], col.visible);
  }

  syncColumnState() {
    if (!this.gridApi || !this.columnToggles) return;

    this.columnToggles.forEach((c) => {
      const column = this.gridApi.getColumn(c.field);
      c.visible = !!column?.isVisible();
    });
  }

  // toggleAllColumns(event: any) {
  //   const visible = event.target.checked;

  //   this.columnToggles?.forEach((c) => {
  //     c.visible = visible;
  //   });
  // }

  onSortChanged() {
    if (!this.isGridInitialized) return;
    if (this.isServerSide) return; // AG Grid Infinite model automatically triggers getRows
    this.pageNumber = 1;
    this.emitQuery();
  }

  onFilterChanged() {
    if (!this.isGridInitialized) return;
    if (this.isServerSide) return; // AG Grid Infinite model automatically triggers getRows
    this.pageNumber = 1;
    this.emitQuery();
  }

  private emitQuery() {
    if (!this.gridApi) return;
    if (!this.pageSize || !this.pageNumber) return;

    if (this.loading === null) {
      this.isLoading = true;
    }

    this.serverQuery.emit({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      sortModel: this.gridApi
        .getColumnState()
        .filter((c) => c.sort)
        .map((c) => ({ colId: c.colId, sort: c.sort })),
      filterModel: this.gridApi.getFilterModel(),
      searchText: this.searchValue,
      searchTerm: this.searchValue,
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

  onRowSelected(event: any): void {
    if (event.node.selected) {
      this.rowSelected.emit(event.node.data);
    } else {
      this.rowDeselected.emit(event.node.data);
    }
  }

  toggleShow = false;

  toggleDisplayOptions(): void {
    this.toggleShow = !this.toggleShow;
  }

  areAllColumnsVisible() {
    this.columnToggles?.every((c) => c.visible);
  }
  isAllSelected = true;

  toggleAllColumns(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (!this.gridApi || !this.columnToggles?.length) {
      return;
    }

    const fields = this.columnToggles.map((c) => c.field);

    this.columnToggles.forEach((col) => {
      col.visible = checked;
    });

    this.gridApi.setColumnsVisible(fields, checked);
  }

  searchValue = '';
  onSearchModelChange(value: string) {
    this.searchValue = value;
    this.refresh();
  }

  onSearchEnter() {
    this.refresh();
  }

  refresh() {
    this.pageNumber = 1;
    if (this.gridApi) {
      this.gridApi.redrawRows();
    }
    if (this.isServerSide && this.gridApi) {
      this.gridApi.setGridOption('cacheBlockSize', this.pageSize);
      this.gridApi.refreshInfiniteCache();
    } else {
      this.emitQuery();
    }
  }

  onPaginationChanged(event: any): void {
    if (!this.gridApi || !this.isServerSide) return;

    const newPageSize = this.gridApi.paginationGetPageSize();
    if (newPageSize !== this.pageSize) {
      this.pageSize = newPageSize;
      this.pageSizeChange.emit({ gridId: this.gridId, pageSize: this.pageSize });

      this.gridApi.setGridOption('cacheBlockSize', this.pageSize);
      this.gridApi.refreshInfiniteCache();
    }
  }

  highlightTextInElement(element: Node, searchTerm: string): void {
    if (!searchTerm) return;
    const lowerSearch = searchTerm.toLowerCase();
    const children = Array.from(element.childNodes);

    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue || '';
        const lowerText = text.toLowerCase();
        if (lowerText.includes(lowerSearch)) {
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          const escapedSearch = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`(${escapedSearch})`, 'gi');

          let match;
          while ((match = regex.exec(text)) !== null) {
            const matchIndex = match.index;
            const matchText = match[0];

            if (matchIndex > lastIndex) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
            }

            const mark = document.createElement('mark');
            mark.style.backgroundColor = '#ffeb3b';
            mark.style.padding = '0 2px';
            mark.style.borderRadius = '2px';
            mark.textContent = matchText;
            fragment.appendChild(mark);

            lastIndex = regex.lastIndex;
          }

          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
          }

          child.replaceWith(fragment);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        this.highlightTextInElement(child, searchTerm);
      }
    }
  }
}