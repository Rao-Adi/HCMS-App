import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  ViewChild,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  RowSelectedEvent,
  SelectionChangedEvent,
  GridOptions,
  CheckboxCellRenderer,
} from 'ag-grid-community';
import { InputCellRenderer } from '../ag-grid-renderers/input-cell-renderer/input-cell-renderer';
import { DropdownCellRenderer } from '../ag-grid-renderers/dropdown-cell-renderer/dropdown-cell-renderer';
import { HighlightCellRenderer } from '../ag-grid-renderers/highlight-cell-renderer/highlight-cell-renderer';
import { TextCellRenderer } from '../ag-grid-renderers/text-cell-renderer/text-cell-renderer';
import { DatePickerCellRenderer } from '../ag-grid-renderers/date-picker-cell-renderer/date-picker-cell-renderer';
import { Checkboxrenderer } from '../ag-grid-renderers/checkboxrenderer/checkboxrenderer';
import { FileUploadCellRenderer } from '../ag-grid-renderers/file-upload-cell-renderer/file-upload-cell-renderer';
import { CascadeDropdownCellRenderer } from '../ag-grid-renderers/cascade-dropdown-cell-renderer/cascade-dropdown-cell-renderer';

export interface GridColumn {
  field: string;
  headerName: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'checkbox' | 'file' | 'action';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  pinned?: 'left' | 'right';
  editable?: boolean;
  sortable?: boolean;
  filter?: boolean;

  // For dropdowns
  dropdownOptions?: Array<{ id: any; text: string }>;
  dropdownValueField?: string;
  dropdownDisplayField?: string;

  // For cascade functionality
  dependsOn?: string; // Field name this dropdown depends on
  dataSourceKey?: string; // Key to look up data in parent component
  filterKey?: string; // Key to filter parent data by

  // For inputs
  prefix?: string;
  suffix?: string;
  placeholder?: string;

  // For numbers
  decimalPlaces?: number;

  // For dates
  dateFormat?: string;
  returnType?: 'date' | 'iso' | 'timestamp' | 'formatted';
  disablePastDates?: boolean;

  // For file uploads
  accept?: string; // e.g., '.pdf,.doc,.docx' or 'image/*'
  multiple?: boolean;
  maxSize?: number; // MB

  // Validation
  required?: boolean;

  // Custom renderer
  customRenderer?: any;
  customRendererParams?: any;
}

export interface GridConfig {
  columns: GridColumn[];
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableSelection?: boolean;
  enableInlineAdd?: boolean;
  enableInlineEdit?: boolean;
  enableInlineDelete?: boolean;
  rowHeight?: number;
  headerHeight?: number;
  domLayout?: 'normal' | 'autoHeight' | 'print';
  theme?: string;
  suppressCellFocus?: boolean;
  pinnedTopRowData?: any[];
  pinnedBottomRowData?: any[];
}

@Component({
  selector: 'app-editable-ag-grid-wrapper',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './editable-ag-grid-wrapper.html',
  styleUrl: './editable-ag-grid-wrapper.css',
})
export class EditableAgGridWrapper implements OnInit, OnChanges {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  @Input() gridId: string = 'grid-' + Math.random().toString(36).substr(2, 9);
  @Input() config: GridConfig = {
    columns: [],
    enablePagination: true,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    enableSorting: true,
    enableFiltering: true,
    enableSelection: false,
    enableInlineAdd: false,
    enableInlineEdit: false,
    enableInlineDelete: false,
    rowHeight: 47,
    headerHeight: 40,
    domLayout: 'autoHeight',
    theme: 'ag-theme-alpine',
    suppressCellFocus: true,
  };

  @Input() rowData: any[] = [];
  @Input() pinnedTopRowData: any[] = [];
  @Input() pinnedBottomRowData: any[] = [];

  @Output() rowAdded = new EventEmitter<any>();
  @Output() rowUpdated = new EventEmitter<{ rowData: any; index: number }>();
  @Output() rowDeleted = new EventEmitter<number>();
  @Output() cellValueChanged = new EventEmitter<{
    field: string;
    value: any;
    rowData: any;
    rowIndex: number;
  }>();
  @Output() selectionChanged = new EventEmitter<any[]>();
  @Output() gridReady = new EventEmitter<GridApi>();

  columnDefs: any[] = [];
  defaultColDef: ColDef;
  gridApi!: GridApi;
  editingRowId: any = null;
  editingRowData: any = null;
  editingRowIndex: number = -1;

  gridContext: any;

  constructor() {
    this.defaultColDef = {
      sortable: this.config.enableSorting,
      filter: this.config.enableFiltering,
      resizable: true,
      flex: 1,
      minWidth: 100,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      cellRenderer: (p: ICellRendererParams) => this.highlightByFilter(p),
      cellStyle: { display: 'flex', alignItems: 'center' },
    };
  }

  // Data sources for cascade dropdowns
  documentTypes = [
    { id: 'DT1', text: 'SOP' },
    { id: 'DT2', text: 'Policy' },
    { id: 'DT3', text: 'Guideline' },
    { id: 'DT4', text: 'Form' },
  ];

  divisions = [
    { id: 'D1', text: 'Software Division', documentTypeId: 'DT1' },
    { id: 'D2', text: 'Quality Management', documentTypeId: 'DT1' },
    { id: 'D3', text: 'HR Division', documentTypeId: 'DT2' },
    { id: 'D4', text: 'Finance Division', documentTypeId: 'DT3' },
    { id: 'D5', text: 'IT Division', documentTypeId: 'DT4' },
  ];

  departments = [
    { id: 'DEP1', text: 'Software Department', divisionId: 'D1' },
    { id: 'DEP2', text: 'QA Department', divisionId: 'D1' },
    { id: 'DEP3', text: 'Development', divisionId: 'D2' },
    { id: 'DEP4', text: 'Testing', divisionId: 'D2' },
    { id: 'DEP5', text: 'HR Operations', divisionId: 'D3' },
    { id: 'DEP6', text: 'Recruitment', divisionId: 'D3' },
    { id: 'DEP7', text: 'Accounts', divisionId: 'D4' },
    { id: 'DEP8', text: 'Budget', divisionId: 'D4' },
    { id: 'DEP9', text: 'Infrastructure', divisionId: 'D5' },
    { id: 'DEP10', text: 'Support', divisionId: 'D5' },
  ];

  subDepartments = [
    { id: 'SD1', text: 'Frontend Team', departmentId: 'DEP1' },
    { id: 'SD2', text: 'Backend Team', departmentId: 'DEP1' },
    { id: 'SD3', text: 'Mobile Team', departmentId: 'DEP1' },

    { id: 'SD4', text: 'Manual QA', departmentId: 'DEP2' },
    { id: 'SD5', text: 'Automation QA', departmentId: 'DEP2' },

    { id: 'SD6', text: 'Angular Team', departmentId: 'DEP3' },
    { id: 'SD7', text: 'React Team', departmentId: 'DEP3' },

    { id: 'SD8', text: 'Functional Testing', departmentId: 'DEP4' },
    { id: 'SD9', text: 'Performance Testing', departmentId: 'DEP4' },

    { id: 'SD10', text: 'Payroll', departmentId: 'DEP5' },
    { id: 'SD11', text: 'Benefits', departmentId: 'DEP5' },

    { id: 'SD12', text: 'Campus Hiring', departmentId: 'DEP6' },
    { id: 'SD13', text: 'Lateral Hiring', departmentId: 'DEP6' },
  ];

  ngOnInit(): void {
    //this.buildColumnDefs();
    this.gridContext = this.getContextData();
    this.buildColumnDefs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.gridContext = this.getContextData();
    this.buildColumnDefs();
    // if (changes['config'] || changes['rowData']) {
    //   this.buildColumnDefs();
    // }
  }

  private buildColumnDefs(): void {
    this.columnDefs = [];

    // Add action column if inline edit/delete is enabled
    if (this.config.enableInlineEdit || this.config.enableInlineDelete) {
      this.columnDefs.push(this.createActionColumn());
    }

    // Build columns from config
    this.config.columns.forEach((column) => {
      this.columnDefs.push(this.createColumnDef(column));
    });
    //console.log(JSON.stringify(this.columnDefs));
  }

  private createActionColumn(): ColDef {
    return {
      headerName: 'Actions',
      field: 'actions',
      //pinned: 'left',
      minWidth: 100,
      maxWidth: 120,
      editable: false,
      filter: false,
      sortable: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      cellRenderer: (params: any) => {
        if (params.node.rowPinned === 'top') {
          if (!this.config.enableInlineAdd) return '';
          return `
            <div style="display: flex; gap: 10px; align-items: center;">
              <svg style="width: 16px; height: 16px; cursor: pointer; fill: #28a745;" viewBox="0 0 448 512" title="Add" data-action-type="add">
                <path data-action-type="add" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
              </svg>
            </div>
          `;
        }

        const isEditing = this.editingRowId === params.node.id;

        if (isEditing) {
          return `
            <div style="display: flex; gap: 15px; align-items: center;">
              ${
                this.config.enableInlineEdit
                  ? `
              <svg style="width: 16px; height: 16px; cursor: pointer; fill: #28a745;" viewBox="0 0 448 512" title="Update" data-action-type="update">
                <path data-action-type="update" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
              </svg>`
                  : ''
              }
              
              <svg style="width: 14px; height: 14px; cursor: pointer; fill: #6c757d;" viewBox="0 0 384 512" title="Cancel" data-action-type="cancel">
                <path data-action-type="cancel" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
              </svg>
            </div>
          `;
        } else {
          return `
            <div style="display: flex; gap: 15px; align-items: center;">
              ${
                this.config.enableInlineEdit
                  ? `
              <svg style="width: 14px; height: 14px; cursor: pointer; fill: #555;" viewBox="0 0 512 512" title="Edit" data-action-type="edit">
                <path data-action-type="edit" d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/>
              </svg>`
                  : ''
              }
              
              ${
                this.config.enableInlineDelete
                  ? `
              <svg style="width: 14px; height: 14px; cursor: pointer; fill: #555;" viewBox="0 0 448 512" title="Delete" data-action-type="delete">
                <path data-action-type="delete" d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
              </svg>`
                  : ''
              }
            </div>
          `;
        }
      },
    };
  }

  private createColumnDef(column: GridColumn): ColDef {
    const colDef: ColDef = {
      field: column.field,
      headerName: column.headerName,
      minWidth: column.minWidth || 100,
      width: column.width,
      maxWidth: column.maxWidth,
      //pinned: column.pinned,
      sortable: column.sortable ?? this.config.enableSorting,
      filter: column.filter ?? this.config.enableFiltering,
      editable: column.editable ?? false,
    };

    // Set cell renderer based on column type
    switch (column.type) {
      // case 'dropdown':
      //   colDef.cellRendererSelector = (params: any) => {
      //     if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
      //       return {
      //         component: column.customRenderer || DropdownCellRenderer,
      //         params: {
      //           options: column.dropdownOptions || [],
      //           value: params.data?.[column.dropdownValueField || column.field],
      //           disabled: params.data?.disabled,
      //           onValueChange: (value: any, data: any) => {
      //             if (column.dropdownValueField) {
      //               data[column.dropdownValueField] = value;
      //             }
      //             if (column.dropdownDisplayField) {
      //               const matched = column.dropdownOptions?.find((opt) => opt.id === value);
      //               data[column.dropdownDisplayField] = matched?.text || '';
      //             }
      //             this.emitCellValueChanged(column.field, value, data, params.rowIndex);
      //           },
      //           ...column.customRendererParams,
      //         },
      //       };
      //     }
      //     return { component: HighlightCellRenderer };
      //   };

      //   // Value formatter for display
      //   colDef.valueFormatter = (params) => {
      //     if (column.dropdownDisplayField && params.data) {
      //       return params.data[column.dropdownDisplayField];
      //     }
      //     const matched = column.dropdownOptions?.find(
      //       (opt) => opt.id === params.data?.[column.dropdownValueField || column.field]
      //     );
      //     return matched?.text || '';
      //   };
      //   break;
      case 'dropdown':
        // Check if it's a cascade dropdown
        const isCascade = !!column.dependsOn;

        colDef.cellRendererSelector = (params: any) => {
          if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
            const rendererComponent = isCascade
              ? CascadeDropdownCellRenderer
              : DropdownCellRenderer;

            return {
              component: column.customRenderer || rendererComponent,
              params: {
                // 🔥 ALWAYS pass options (for root dropdown)
                options: column.dropdownOptions || [],

                // 🔥 ALWAYS read value from rowData
                value: params.data?.[column.field],
                //value: params.data?.[column.dropdownValueField || column.field],

                disabled: params.data?.disabled,
                placeholder: column.placeholder || '--Select--',
                emptyValue: 0,

                // Cascade specific params
                dependsOn: column.dependsOn,
                dataSourceKey: column.dataSourceKey,
                filterKey: column.filterKey,

                // Context for data access
                context: this.getContextData(),

                onValueChange: (value: any, data: any) => {
                  // 1️⃣ Set value
                  data[column.field] = value;

                  // 2️⃣ Clear children
                  this.clearDependentFields(data, column.field);

                  // 3️⃣ IMPORTANT: refresh pinned row manually
                  if (params.node.rowPinned === 'top') {
                    this.pinnedTopRowData[0][column.field] = value;
                    this.gridApi.setGridOption('pinnedTopRowData', this.pinnedTopRowData);
                  }

                  // 4️⃣ Emit change
                  this.emitCellValueChanged(column.field, value, data, params.rowIndex);
 
                },
                ...column.customRendererParams,
              },
            };
          }
          return { component: HighlightCellRenderer };
        };

        colDef.valueFormatter = (params) => {
          if (column.dropdownDisplayField && params.data) {
            return params.data[column.dropdownDisplayField];
          }
          return this.getOptionText(
            column,
            params.data?.[column.dropdownValueField || column.field]
          );
        };
        break;
      case 'number':
        colDef.cellRendererSelector = (params: any) => {
          if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
            return {
              component: column.customRenderer || InputCellRenderer,
              params: {
                prefix: column.prefix || '',
                suffix: column.suffix || '',
                type: 'number',
                decimalPlaces: column.decimalPlaces || 0,
                onValueChange: (value: any, data: any) => {
                  data[column.field] = value;
                  this.emitCellValueChanged(column.field, value, data, params.rowIndex);
                },
                ...column.customRendererParams,
              },
            };
          }
          return { component: HighlightCellRenderer };
        };

        colDef.valueFormatter = (params) => {
          if (params.value == null) return '';
          let formatted = parseFloat(params.value).toFixed(column.decimalPlaces || 0);
          if (column.prefix) formatted = column.prefix + ' ' + formatted;
          if (column.suffix) formatted = formatted + ' ' + column.suffix;
          return formatted;
        };
        break;

      case 'text':
        colDef.cellRendererSelector = (params: any) => {
          if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
            return {
              component: column.customRenderer || TextCellRenderer,
              params: {
                prefix: column.prefix || '',
                suffix: column.suffix || '',
                type: 'text',
                onValueChange: (value: any, data: any) => {
                  data[column.field] = value;
                  this.emitCellValueChanged(column.field, value, data, params.rowIndex);
                },
                ...column.customRendererParams,
              },
            };
          }
          return { component: HighlightCellRenderer };
        };
        break;

      case 'date':
        colDef.cellRendererSelector = (params: any) => {
          if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
            return {
              component: column.customRenderer || DatePickerCellRenderer,
              params: {
                placeholder: column.placeholder || 'Select date',
                dateFormat: column.dateFormat || 'dd/MM/yyyy',
                returnType: column.returnType || 'date', // 'date', 'iso', 'timestamp', 'formatted'
                disablePastDates: column.disablePastDates || false,
                value: params.data?.[column.field],
                editingRowId: this.editingRowId,
                onValueChange: (value: any, data: any) => {
                  data[column.field] = value;
                  this.emitCellValueChanged(column.field, value, data, params.rowIndex);
                },
                ...column.customRendererParams,
              },
            };
          }
          return { component: HighlightCellRenderer };
        };

        colDef.valueFormatter = (params) => {
          if (!params.value) return '';

          try {
            const date = new Date(params.value);
            if (isNaN(date.getTime())) return '';

            const format = column.dateFormat || 'dd/MM/yyyy';
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            return format
              .replace('dd', day)
              .replace('MM', month)
              .replace('yyyy', year.toString())
              .replace('yy', year.toString().slice(-2));
          } catch {
            return params.value.toString();
          }
        };

        // Add comparator for date sorting
        colDef.comparator = (valueA, valueB, nodeA, nodeB, isInverted) => {
          const dateA = valueA ? new Date(valueA).getTime() : 0;
          const dateB = valueB ? new Date(valueB).getTime() : 0;
          return dateA - dateB;
        };
        break;

      case 'file':
        colDef.cellRendererSelector = (params: any) => {
          if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
            return {
              component: column.customRenderer || FileUploadCellRenderer,
              params: {
                value: params.data?.[column.field],
                editingRowId: this.editingRowId,
                accept: column.accept || '*',
                multiple: column.multiple || false,
                maxSize: column.maxSize || 5, // MB
                onValueChange: (value: any, data: any) => {
                  data[column.field] = value;
                  this.emitCellValueChanged(column.field, value, data, params.rowIndex);
                },
                onFilePreview: (fileInfo: any) => {
                  // Emit custom event for file preview
                  this.cellValueChanged.emit({
                    field: column.field,
                    value: fileInfo,
                    rowData: params.data,
                    rowIndex: params.rowIndex,
                    //type: 'file-preview',
                  });
                },
                ...column.customRendererParams,
              },
            };
          }
          return { component: HighlightCellRenderer };
        };

        colDef.valueFormatter = (params) => {
          if (!params.value) return 'No file';

          if (typeof params.value === 'string') {
            return params.value.split('/').pop() || params.value;
          } else if (params.value.name) {
            return params.value.name;
          }

          return 'File attached';
        };
        break;

      case 'checkbox':
        colDef.cellRendererSelector = (params: any) => {
          if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
            return {
              component: column.customRenderer || Checkboxrenderer,
              params: {
                value: params.data?.[column.field],
                onValueChange: (value: any, data: any) => {
                  data[column.field] = value;
                  this.emitCellValueChanged(column.field, value, data, params.rowIndex);
                },
                ...column.customRendererParams,
              },
            };
          }
          return { component: HighlightCellRenderer };
        };

        colDef.valueFormatter = (params) => {
          return params.value ? 'Yes' : 'No';
        };
        break;

      case 'action':
        // Already handled by action column
        break;

      default:
        // Use HighlightCellRenderer for non-editable columns
        colDef.cellRenderer = HighlightCellRenderer;
    }

    return colDef;
  }

  private getContextData(): any {
    // Return data that can be accessed by renderers via context
    return {
      documentTypes: this.documentTypes,
      divisions: this.divisions,
      departments: this.departments,
      subDepartments: this.subDepartments,
      // Add any other data sources needed
    };
  }

  private getOptionText(column: GridColumn, value: any): string {
    if (!value && value !== 0) return '';

    if (Array.isArray(column.dropdownOptions)) {
      const matched = column.dropdownOptions.find((opt) => opt.id == value);
      return matched?.text || '';
    }

    // If options come from dataSourceKey, we need to look it up
    if (column.dataSourceKey) {
      const data = this.getContextData()[column.dataSourceKey] || [];
      const matched = data.find((item: any) => item.id == value);
      return matched?.text || '';
    }

    return String(value);
  }

  private clearDependentFields(data: any, parentField: string) {
    this.config.columns.forEach((col) => {
      if (col.dependsOn === parentField) {
        data[col.field] = null;
        this.clearDependentFields(data, col.field);
      }
    });
  }

  // private clearDependentFields(data: any, field: string): void {
  //   // Find all columns that depend on this field
  //   this.config.columns.forEach((col) => {
  //     if (col.dependsOn === field) {
  //       // Clear the dependent field
  //       data[col.field] = col || 0;
  //       if (col.dropdownDisplayField) {
  //         data[col.dropdownDisplayField] = '';
  //       }

  //       // Recursively clear fields that depend on this one
  //       this.clearDependentFields(data, col.field);
  //     }
  //   });
  // }

  private emitCellValueChanged(field: string, value: any, rowData: any, rowIndex: number): void {
    this.cellValueChanged.emit({
      field,
      value,
      rowData,
      rowIndex,
    });
  }

  private highlightByFilter(params: ICellRendererParams): HTMLElement {
    const text =
      params.valueFormatted != null
        ? String(params.valueFormatted)
        : params.value == null
        ? ''
        : String(params.value);

    const span = document.createElement('span');
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const api = params.api;
    const colId =
      params.column?.getColId?.() ||
      params.colDef?.colId ||
      (params.colDef?.field as string | undefined) ||
      '';
    const fm = api.getFilterModel?.() || {};
    const m = colId ? (fm as any)[colId] : undefined;

    if (!m) {
      span.textContent = text;
      return span;
    }

    const terms: string[] = [];
    const collect = (c: any) => {
      const t = (c?.filter ?? '').toString().trim();
      if (t) terms.push(t);
    };

    if (m.operator) {
      collect(m.condition1);
      collect(m.condition2);
    } else {
      collect(m);
    }

    if (!terms.length) {
      span.textContent = text;
      return span;
    }

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const uniq = Array.from(new Set(terms.map(escapeRegExp)));
    const re = new RegExp(`(${uniq.join('|')})`, 'gi');

    span.innerHTML = escapeHtml(text).replace(re, '<mark class="ag-hl">$1</mark>');
    return span;
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.gridReady.emit(this.gridApi);
  }

  onCellClicked(event: CellClickedEvent): void {
    const target = event.event?.target as HTMLElement;
    const actionType = target?.getAttribute('data-action-type');

    if (!actionType) return;

    switch (actionType) {
      case 'add':
        this.addFromPinnedRow();
        break;
      case 'edit':
        this.startEditRow(event);
        break;
      case 'update':
        this.updateRow(event);
        break;
      case 'cancel':
        this.cancelEdit(event);
        break;
      case 'delete':
        this.deleteRow(event.rowIndex!);
        break;
    }
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedRows = this.gridApi.getSelectedRows();
    this.selectionChanged.emit(selectedRows);
  }

  onFilterChanged(): void {
    // Refresh cells to update highlighting
    this.gridApi?.refreshCells({ force: true });
  }

  startEditRow(event: CellClickedEvent): void {
    this.editingRowId = event.node.id;
    this.editingRowData = { ...event.data };
    this.editingRowIndex = event.rowIndex!;
    this.gridApi?.refreshCells({ force: true });
  }

  updateRow(event: CellClickedEvent): void {
    this.rowUpdated.emit({
      rowData: event.data,
      index: event.rowIndex!,
    });
    this.editingRowId = null;
    this.editingRowData = null;
    this.editingRowIndex = -1;
    this.gridApi?.refreshCells({ force: true });
  }

  cancelEdit(event: CellClickedEvent): void {
    if (
      this.editingRowData &&
      this.editingRowIndex >= 0 &&
      this.editingRowIndex < this.rowData.length
    ) {
      this.rowData[this.editingRowIndex] = { ...this.editingRowData };
      this.rowData = [...this.rowData];
      this.gridApi?.setGridOption('rowData', this.rowData);
    }
    this.editingRowId = null;
    this.editingRowData = null;
    this.editingRowIndex = -1;
    this.gridApi?.refreshCells({ force: true });
  }

  deleteRow(rowIndex: number): void {
    if (confirm('Are you sure you want to delete this record?')) {
      this.rowDeleted.emit(rowIndex);
    }
  }

  addFromPinnedRow(): void {
    debugger;
    const pinnedData = this.pinnedTopRowData?.[0];
    if (!pinnedData) return;

    console.log('pinnedData:', JSON.stringify(pinnedData));

    // Validate required fields
    const requiredColumns = this.config.columns.filter((col) => col.required);
    const missingFields = requiredColumns.filter((col) => !pinnedData[col.field]);
    
    
    console.log('Missing Fields:', missingFields);
    if (missingFields.length > 0) {
      alert(`Please fill in: ${missingFields.map((col) => col.headerName).join(', ')}`);
      return;
    }

    const newRow = { ...pinnedData, isNewRow: false };
    this.rowAdded.emit(newRow);
    this.resetPinnedRow();
  }

  resetPinnedRow(): void {
    if (this.pinnedTopRowData?.length > 0) {
      const emptyRow: any = {};
      this.config.columns.forEach((col) => {
        if (col.type === 'dropdown' && col.dropdownOptions) {
          emptyRow[col.field] = col.dropdownOptions[0]?.id || '';
        } else {
          emptyRow[col.field] = '';
        }
      });
      this.pinnedTopRowData = [emptyRow];
      this.gridApi?.setGridOption('pinnedTopRowData', this.pinnedTopRowData);
    }
  }

  // Public methods for parent components
  refreshGrid(): void {
    this.gridApi?.refreshCells({ force: true });
  }

  getSelectedRows(): any[] {
    return this.gridApi?.getSelectedRows() || [];
  }

  clearSelection(): void {
    this.gridApi?.deselectAll();
  }
}
