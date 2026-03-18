import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { InputCellRenderer } from '@app/shared/ag-grid-renderers/input-cell-renderer/input-cell-renderer';
import { DropdownCellRenderer } from '@app/shared/ag-grid-renderers/dropdown-cell-renderer/dropdown-cell-renderer';
import { HighlightCellRenderer } from '@app/shared/ag-grid-renderers/highlight-cell-renderer/highlight-cell-renderer';

@Component({
  selector: 'app-aggrid-inline-editing-test',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    AgGridAngular,
    NzDatePickerModule,
    NzUploadModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCheckboxModule,
    NzCollapseModule,
  ],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './aggrid-inline-editing-test.html',
  styleUrl: './aggrid-inline-editing-test.css',
})
export class AGGridInlineEditingTest {
  editingRowId: any = null;
  percentage: string = '%';
  workforceGridApi!: GridApi;
  planningGridApi!: GridApi;
  rowIndexForUpdate = 0;
  Rs: string = 'Rs.';

  AddnewPositionPlanning = new NewPositionPlanning();
  EditnewPositionPlanning = new NewPositionPlanning();
  newPositionPlanning = new NewPositionPlanning();
  newPositionPlanningGrid: NewPositionPlanning[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    cellRenderer: (p: ICellRendererParams) => this.highlightByFilter(p),
    cellStyle: { display: 'flex', alignItems: 'center' },
  };

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
      params.column?.getColId?.() ??
      params.colDef?.colId ??
      (params.colDef?.field as string | undefined) ??
      '';

    const fm = api.getFilterModel?.() || {};
    const m = colId ? (fm as any)[colId] : undefined;

    if (!m) {
      span.textContent = text;
      return span;
    }

    // Handle date filters
    const isDateEntry = (e: any) =>
      e?.filterType === 'date' ||
      e?.condition1?.filterType === 'date' ||
      e?.condition2?.filterType === 'date';

    if (isDateEntry(m)) {
      const cellDate = this.toDate(params.value);
      if (!cellDate) {
        span.textContent = text;
        return span;
      }

      const atMidnight = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

      const matchCond = (cond: any): boolean => {
        if (!cond) return false;
        const type = cond.type;
        const from = this.toDate(cond.dateFrom);
        const to = this.toDate(cond.dateTo);
        const cell = atMidnight(cellDate);
        const f = from ? atMidnight(from) : undefined;
        const t = to ? atMidnight(to) : undefined;

        switch (type) {
          case 'equals':
            return f !== undefined && cell === f;
          case 'lessThan':
            return f !== undefined && cell < f;
          case 'greaterThan':
            return f !== undefined && cell > f;
          case 'inRange':
            return f !== undefined && t !== undefined && cell >= f && cell <= t;
          default:
            return false;
        }
      };

      const matched = m.operator
        ? m.operator === 'AND'
          ? matchCond(m.condition1) && matchCond(m.condition2)
          : matchCond(m.condition1) || matchCond(m.condition2)
        : matchCond(m);

      span.innerHTML = matched
        ? `<mark class="ag-hl">${escapeHtml(text)}</mark>`
        : escapeHtml(text);
      return span;
    }

    // Handle text filters
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

  private toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  pinnedTopRowDataPlanning: NewPositionPlanning[] = [
    {
      divisionId: 0,
      division: '',
      departmentId: 0,
      department: '',
      subDepartmentId: 0,
      subDepartment: '',
      roleId: 0,
      role: '',
      headCountCurrent: 0,
      headCountRevised: 0,
      grossSalaryCurrent: '',
      incrementProposed: '',
      grossSalaryRevised: '',
      grossSalaryRevisedHeadCount: '',
      grossSalaryTotal: '',
      monthOfHiringId: 0,
      monthOfHiringName: '',
      noOfMonths: 0,
      isNewRow: true,
    },
  ];

  planningColumnDefs: ColDef[] = [
    {
      headerName: 'Actions',
      field: 'actions',
      pinned: 'left',
      minWidth: 100,
      maxWidth: 120,
      editable: false,
      filter: false,
      sortable: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      cellRenderer: (params: any) => {
        if (params.node.rowPinned === 'top') {
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
            <svg style="width: 16px; height: 16px; cursor: pointer; fill: #28a745;" viewBox="0 0 448 512" title="Update" data-action-type="update">
              <path data-action-type="update" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
            </svg>
            <svg style="width: 14px; height: 14px; cursor: pointer; fill: #6c757d;" viewBox="0 0 384 512" title="Cancel" data-action-type="cancel">
              <path data-action-type="cancel" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
            </svg>
          </div>
        `;
        } else {
          return `
          <div style="display: flex; gap: 15px; align-items: center;">
            <svg style="width: 14px; height: 14px; cursor: pointer; fill: #555;" viewBox="0 0 512 512" title="Edit" data-action-type="edit">
              <path data-action-type="edit" d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/>
            </svg>
            <svg style="width: 14px; height: 14px; cursor: pointer; fill: #555;" viewBox="0 0 448 512" title="Delete" data-action-type="delete">
              <path data-action-type="delete" d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
            </svg>
          </div>
        `;
        }
      },
    },
    {
      field: 'division',
      headerName: 'Division',
      minWidth: 180,
      cellRendererSelector: (params: any) => {
        if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
          return {
            component: DropdownCellRenderer,
            params: {
              options: this.RevisedDivisions,
              value: params.data?.divisionId,
              onValueChange: (value: number, data: any) => {
                const matched = this.RevisedDivisions.find((d) => d.id === value);
                data.division = matched?.text ?? '';
                data.divisionId = value;
              },
            },
          };
        }
        return { component: HighlightCellRenderer };
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      minWidth: 180,
      cellRendererSelector: (params: any) => {
        if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
          return {
            component: DropdownCellRenderer,
            params: {
              options: this.RevisedDepartments,
              value: params.data?.departmentId, // Pass current selected ID
              onValueChange: (value: number, data: any) => {
                const matched = this.RevisedDepartments.find((d) => d.id === value);
                data.department = matched?.text ?? '';
                data.departmentId = value;
              },
            },
          };
        }
        return { component: HighlightCellRenderer };
      },
    },
    {
      field: 'subDepartment',
      headerName: 'Sub-Department',
      minWidth: 180,
      cellRendererSelector: (params: any) => {
        if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
          return {
            component: DropdownCellRenderer,
            params: {
              options: this.RevisedSubDepartments,
              value: params.data?.subDepartmentId, // Pass current selected ID
              onValueChange: (value: number, data: any) => {
                const matched = this.RevisedSubDepartments.find((d) => d.id === value);
                data.subDepartment = matched?.text ?? '';
                data.subDepartmentId = value;
              },
            },
          };
        }
        return { component: HighlightCellRenderer };
      },
    },
    {
      field: 'role',
      headerName: 'Role',
      minWidth: 180,
      cellRendererSelector: (params: any) => {
        if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
          return {
            component: DropdownCellRenderer,
            params: {
              options: this.RevisedRoles,
              value: params.data?.roleId, // Pass current selected ID
              onValueChange: (value: number, data: any) => {
                const matched = this.RevisedRoles.find((r) => r.id === value);
                data.role = matched?.text ?? '';
                data.roleId = value;
              },
            },
          };
        }
        return { component: HighlightCellRenderer };
      },
    },
    {
      field: 'headCountCurrent',
      headerName: 'HeadCount (Current)',
      minWidth: 160,
      cellRendererSelector: (params: any) => {
        if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
          return {
            component: InputCellRenderer,
            params: {
              prefix: '',
              suffix: '',
              onValueChange: (value: number, data: any) => {
                data.headCountCurrent = value;
              },
            },
          };
        }
        return { component: HighlightCellRenderer };
      },
    },
    {
      field: 'useraname',
      headerName: 'username',
      minWidth: 160,
      cellRendererSelector: (params: any) => {
        if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
          return {
            component: InputCellRenderer,
            params: {
              prefix: '',
              suffix: '',
              onValueChange: (value: string, data: any) => {
                data.headCountCurrent = value;
              },
            },
          };
        }
        return { component: HighlightCellRenderer };
      },
    },
    // {
    //   field: 'headCountRevised',
    //   headerName: 'HeadCount (Revised)',
    //   minWidth: 160,
    //   cellRendererSelector: (params: any) => {
    //     if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
    //       return {
    //         component: InputCellRenderer,
    //         params: {
    //           prefix: '',
    //           suffix: '',
    //           onValueChange: (value: number, data: any) => {
    //             data.headCountRevised = value;
    //           },
    //         },
    //       };
    //     }
    //     return { component: HighlightCellRenderer };
    //   },
    // },
    // {
    //   field: 'grossSalaryCurrent',
    //   headerName: 'Gross Salary (Current)',
    //   minWidth: 170,
    //   cellRendererSelector: (params: any) => {
    //     if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
    //       return {
    //         component: InputCellRenderer,
    //         params: {
    //           prefix: this.Rs + ' ',
    //           suffix: '',
    //           onValueChange: (value: number, data: any) => {
    //             data.grossSalaryCurrent = this.Rs + ' ' + value.toLocaleString();
    //           },
    //         },
    //       };
    //     }
    //     return { component: HighlightCellRenderer };
    //   },
    // },
    // {
    //   field: 'incrementProposed',
    //   headerName: 'Increment Proposed',
    //   minWidth: 170,
    //   cellRendererSelector: (params: any) => {
    //     if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
    //       return {
    //         component: InputCellRenderer,
    //         params: {
    //           prefix: this.Rs + ' ',
    //           suffix: '',
    //           onValueChange: (value: number, data: any) => {
    //             data.incrementProposed = this.Rs + ' ' + value.toLocaleString();
    //           },
    //         },
    //       };
    //     }
    //     return { component: HighlightCellRenderer };
    //   },
    // },
    // {
    //   field: 'grossSalaryRevised',
    //   headerName: 'Gross Salary (Revised)',
    //   minWidth: 170,
    //   cellRendererSelector: (params: any) => {
    //     if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
    //       return {
    //         component: InputCellRenderer,
    //         params: {
    //           prefix: this.Rs + ' ',
    //           suffix: '',
    //           onValueChange: (value: number, data: any) => {
    //             data.grossSalaryRevised = this.Rs + ' ' + value.toLocaleString();
    //           },
    //         },
    //       };
    //     }
    //     return { component: HighlightCellRenderer };
    //   },
    // },
    // {
    //   field: 'grossSalaryRevisedHeadCount',
    //   headerName: 'Gross Salary (Revised HC)',
    //   minWidth: 180,
    //   cellRendererSelector: (params: any) => {
    //     if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
    //       return {
    //         component: InputCellRenderer,
    //         params: {
    //           prefix: this.Rs + ' ',
    //           suffix: '',
    //           onValueChange: (value: number, data: any) => {
    //             data.grossSalaryRevisedHeadCount = this.Rs + ' ' + value.toLocaleString();
    //           },
    //         },
    //       };
    //     }
    //     return { component: HighlightCellRenderer };
    //   },
    // },
    // {
    //   field: 'grossSalaryTotal',
    //   headerName: 'Gross Salary (Total)',
    //   minWidth: 170,
    //   cellRendererSelector: (params: any) => {
    //     if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
    //       return {
    //         component: InputCellRenderer,
    //         params: {
    //           prefix: this.Rs + ' ',
    //           suffix: '',
    //           onValueChange: (value: number, data: any) => {
    //             data.grossSalaryTotal = this.Rs + ' ' + value.toLocaleString();
    //           },
    //         },
    //       };
    //     }
    //     return { component: HighlightCellRenderer };
    //   },
    // },
    {
      field: 'monthOfHiringId',
      headerName: 'Month of Hiring',
      minWidth: 160,
      cellRendererSelector: (params: any) => {
        if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
          // Check if headcount is same - disable dropdown
          const isDisabled = params.data?.headCountCurrent === params.data?.headCountRevised;

          return {
            component: DropdownCellRenderer,
            params: {
              options: this.Months,
              value: params.data?.monthOfHiringId,
              disabled: isDisabled, // Pass disabled flag
              onValueChange: (value: number, data: any) => {
                const matched = this.Months.find((m) => m.id === value);
                data.monthOfHiringId = value;
                data.monthOfHiringName = matched?.text ?? '';
              },
            },
          };
        }
        return { component: HighlightCellRenderer };
      },
      valueFormatter: (params) => {
        const month = this.Months.find((m) => m.id === params.value);
        return month?.text || '';
      },
    },
    // {
    //   field: 'noOfMonths',
    //   headerName: 'No. of Months',
    //   minWidth: 140,
    //   headerComponent: NoOfMonthsHeaderComponent,
    //   cellRendererSelector: (params: any) => {
    //     if (params.node.rowPinned === 'top' || this.editingRowId === params.node.id) {
    //       return {
    //         component: InputCellRenderer,
    //         params: {
    //           prefix: '',
    //           suffix: '',
    //           onValueChange: (value: number, data: any) => {
    //             data.noOfMonths = value;
    //           },
    //         },
    //       };
    //     }
    //     return { component: HighlightCellRenderer };
    //   },
    // },
  ];

  onFilterChanged(): void {
    // Refresh cells to update highlighting
    this.workforceGridApi?.refreshCells({ force: true });
    this.planningGridApi?.refreshCells({ force: true });
  }

  onPlanningGridReady(event: GridReadyEvent): void {
    this.planningGridApi = event.api;
  }

  resetPinnedRow(): void {
    this.pinnedTopRowDataPlanning = [
      {
        divisionId: 0,
        division: '',
        departmentId: 0,
        department: '',
        subDepartmentId: 0,
        subDepartment: '',
        roleId: 0,
        role: '',
        headCountCurrent: 0,
        headCountRevised: 0,
        grossSalaryCurrent: '',
        incrementProposed: '',
        grossSalaryRevised: '',
        grossSalaryRevisedHeadCount: '',
        grossSalaryTotal: '',
        monthOfHiringId: 0,
        monthOfHiringName: '',
        noOfMonths: 0,
        isNewRow: true,
      },
    ];
    this.planningGridApi?.setGridOption('pinnedTopRowData', this.pinnedTopRowDataPlanning);
  }

  onPlanningCellClicked(event: CellClickedEvent): void {
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

  startEditRow(event: CellClickedEvent): void {
    this.editingRowId = event.node.id;
    this.EditnewPositionPlanning = { ...event.data };
    this.rowIndexForUpdate = event.rowIndex!;
    this.planningGridApi?.refreshCells({ force: true });
  }
  updateRow(event: CellClickedEvent): void {
    this.editingRowId = null;
    this.newPositionPlanningGrid = [...this.newPositionPlanningGrid];
    this.planningGridApi?.setGridOption('rowData', this.newPositionPlanningGrid);
    this.planningGridApi?.refreshCells({ force: true });
  }
  cancelEdit(event: CellClickedEvent): void {
    if (this.EditnewPositionPlanning && this.rowIndexForUpdate >= 0) {
      this.newPositionPlanningGrid[this.rowIndexForUpdate] = { ...this.EditnewPositionPlanning };
    }
    this.editingRowId = null;
    this.planningGridApi?.setGridOption('rowData', this.newPositionPlanningGrid);
    this.planningGridApi?.refreshCells({ force: true });
  }
  deleteRow(rowIndex: number): void {
    if (confirm('Are you sure you want to delete this record?')) {
      this.newPositionPlanningGrid.splice(rowIndex, 1);
      this.newPositionPlanningGrid = [...this.newPositionPlanningGrid];
      this.planningGridApi?.setGridOption('rowData', this.newPositionPlanningGrid);
    }
  }

  addFromPinnedRow(): void {
    const pinnedData = this.pinnedTopRowDataPlanning[0];

    if (!pinnedData.division || !pinnedData.department) {
      alert('Please fill Division and Department');
      return;
    }
    const structuredPayload: NewPositionPlanningPayload = {
      id: this.generateNewId(),
      division: {
        id: pinnedData.divisionId,
        text: pinnedData.division,
      },
      department: {
        id: pinnedData.departmentId,
        text: pinnedData.department,
      },
      subDepartment: {
        id: pinnedData.subDepartmentId,
        text: pinnedData.subDepartment,
      },
      role: {
        id: pinnedData.roleId,
        text: pinnedData.role,
      },
      monthOfHiring: {
        id: pinnedData.monthOfHiringId,
        text: pinnedData.monthOfHiringName,
      },
      headCountCurrent: pinnedData.headCountCurrent || 0,
      headCountRevised: pinnedData.headCountRevised || 0,
      grossSalaryCurrent: this.parseNumericValue(pinnedData.grossSalaryCurrent),
      incrementProposed: this.parseNumericValue(pinnedData.incrementProposed),
      grossSalaryRevised: this.parseNumericValue(pinnedData.grossSalaryRevised),
      grossSalaryRevisedHeadCount: this.parseNumericValue(pinnedData.grossSalaryRevisedHeadCount),
      grossSalaryTotal: this.parseNumericValue(pinnedData.grossSalaryTotal),
      noOfMonths: pinnedData.noOfMonths || 0,
    };
    console.log('=== NEW POSITION PLANNING DATA ===');
    console.log('Structured JSON Payload:', JSON.stringify(structuredPayload, null, 2));
    console.log('Raw Pinned Data:', pinnedData);

    const newRow: NewPositionPlanning = { ...pinnedData, isNewRow: false };
    this.newPositionPlanningGrid = [newRow, ...this.newPositionPlanningGrid];
    this.planningGridApi?.setGridOption('rowData', this.newPositionPlanningGrid);

    this.resetPinnedRow();
  }

  generateNewId(): number {
    return Date.now();
  }

  parseNumericValue(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      return (
        parseFloat(
          value
            .replace(/Rs\.?\s*/gi, '')
            .replace(/,/g, '')
            .trim()
        ) || 0
      );
    }
    return 0;
  }

  RevisedRoles: SelectOption[] = [
    { id: 0, text: '--Select--' },
    { id: 1, text: 'Developer' },
    { id: 2, text: 'Senior Developer' },
    { id: 3, text: 'Quality Assurance' },
    { id: 4, text: 'Data Engineer' },
    { id: 5, text: 'HR Specialist' },
    { id: 6, text: 'HR Manager' },
    { id: 7, text: 'Senior Quality Assurance' },
    { id: 8, text: 'Quality Analyst' },
  ];

  RevisedDivisions: SelectOption[] = [
    { id: 0, text: '--Select--' },
    { id: 1, text: 'Software Division' },
    { id: 2, text: 'Quality Management Upload' },
    { id: 3, text: 'Development' },
    { id: 4, text: 'Pharma' },
  ];

  RevisedDepartments: SelectOption[] = [
    { id: 0, text: '--Select--' },
    { id: 1, text: 'Quality Assurance Manager' },
    { id: 2, text: 'Marketing' },
    { id: 3, text: 'HR Sub-Dept' },
    { id: 4, text: 'Software Department' },
  ];

  RevisedSubDepartments: SelectOption[] = [
    { id: 0, text: '--Select--' },
    { id: 1, text: 'Payroll Group S1' },
    { id: 2, text: 'HCMS Payroll Group' },
    { id: 3, text: 'Grade SQA' },
    { id: 4, text: 'QC Department' },
  ];

  Revisions: SelectOption[] = [
    { id: 0, text: 'Role' },
    { id: 1, text: 'Division' },
    { id: 2, text: 'Department' },
    { id: 3, text: 'Sub-Department' },
    { id: 4, text: 'Grade' },
  ];

  Months: SelectOption[] = [
    { id: 0, text: '-Unknown-' },
    { id: 1, text: 'January' },
    { id: 2, text: 'February' },
    { id: 3, text: 'March' },
    { id: 4, text: 'April' },
    { id: 5, text: 'May' },
    { id: 6, text: 'June' },
    { id: 7, text: 'July' },
    { id: 8, text: 'August' },
    { id: 9, text: 'September' },
    { id: 10, text: 'October' },
    { id: 11, text: 'November' },
    { id: 12, text: 'December' },
  ];
}

interface SelectOption {
  id: number;
  text: string;
}

class Workforceplanning {
  empCode: string = '';
  name: string = '';
  division: string = '';
  revisedDivisionId: number = 0;
  revisedDivision: string = '';
  department: string = '';
  revisedDepartmentId: number = 0;
  revisedDepartment: string = '';
  subDepartment: string = '';
  revisedSubDepartmentId: number = 0;
  revisedSubDepartment: string = '';
  grade: string = '';
  designation: string = '';
  revisedDesignationId: number = 0;
  revisedDesignation: string = '';
  role: string = '';
  revisedRoleId: number = 0;
  revisedRole: string = '';
  currentSalary: number = 0;
  revisedSalary: number = 0;
  lastIncrementDate: any;
  LastIncrementAgo: string = '';
  location: string = '';
  isResigned: boolean = false;
  isPromoted: boolean = false;
  performanceAmount: number = 0;
  performancePercentage: number = 0;
  promotionAmount: number = 0;
  promotionPercentage: number = 0;
  adjustmentAmount: number = 0;
  adjustmentPercentage: number = 0;
  IncrementAmount: number = 0;
  IncrementPercentage: number = 0;
}
class WorkforceData {
  RevisionHeadcountId: number = 0;
  RevisionSalaryId: number = 0;
  RevisionsHeadCountName: string = '';
  RevisionsSalaryName: string = '';
  directReportersId: number = 0;
  directReportersName: string = '';
  employeesId: number = 0;
  employeesName: string = '';
  appraisalYearId: number = 0;
  appraisalYearName: string = '';
  divisionId: number = 0;
  division: string = '';
  departmentId: number = 0;
  department: string = '';
  roleId: number = 0;
  role: string = '';
}
class NewPositionPlanning {
  divisionId: number = 0;
  division: string = '';
  departmentId: number = 0;
  department: string = '';
  subDepartmentId: number = 0;
  subDepartment: string = '';
  roleId: number = 0;
  role: string = '';
  headCountCurrent: number = 0;
  headCountRevised: number = 0;
  grossSalaryCurrent: string = '';
  incrementProposed: string = '';
  grossSalaryRevised: string = '';
  grossSalaryRevisedHeadCount: string = '';
  grossSalaryTotal: string = '';
  monthOfHiringId: number = 0;
  monthOfHiringName: string = '';
  noOfMonths: number = 0;
  isNewRow: boolean = false;
}
interface NewPositionPlanningPayload {
  id?: number;
  division: { id: number; text: string };
  department: { id: number; text: string };
  subDepartment: { id: number; text: string };
  role: { id: number; text: string };
  monthOfHiring: { id: number; text: string };
  headCountCurrent: number;
  headCountRevised: number;
  grossSalaryCurrent: number;
  incrementProposed: number;
  grossSalaryRevised: number;
  grossSalaryRevisedHeadCount: number;
  grossSalaryTotal: number;
  noOfMonths: number;
}
