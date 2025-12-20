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

import { AgGridDataService } from '@app/core/services/ag-grid-data.service';
import { SubDepartmentService } from '../services/subdepartment.service';
import { DivisionService } from '../services/division.services';
import { DepartmentService } from '../services/department.service';
import { SelectList } from '../interfaces/interfaces';


@Component({
  selector: 'app-ag-grid-wrapper',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
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
  public noRowsOverlay: string = '';

  divisions: Array<{ CODE: string; NAME: string }> = [];
  departments: Array<{ CODE: string; NAME: string }> = [];
  subdepartments: Array<{ CODE: string; NAME: string }> = []; // load if available

  ngOnInit(): void {
    this.getAllDivisions();
    this.loadDepartments();
    this.loadSubdepartments();
    // this.getAllDepartment();
    //this.getAllSubDepartments();
  }

  // Default Column Definitions: Apply configuration across all columns

  constructor(
    private gridService: AgGridDataService,
    private _departmentServices: DepartmentService,
    private _divisionServices: DivisionService,
    private _subDeparmentServices: SubDepartmentService
  ) {}

  columnDefs2 = [
    {
      field: 'division',
      headerName: 'Division',
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: this.divisions.map((d) => d.CODE),
        formatValue: (code: string) => this.divisions.find((d) => d.CODE === code)?.NAME || code,
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: this.departments.map((d) => d.CODE),
        formatValue: (code: string) => this.departments.find((d) => d.CODE === code)?.NAME || code,
      },
    },
    {
      field: 'subdepartment',
      headerName: 'Subdepartment',
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: this.subdepartments.map((d) => d.CODE),
        formatValue: (code: string) =>
          this.subdepartments.find((d) => d.CODE === code)?.NAME || code,
      },
    },
  ];

  // onCellValueChanged(event: any) {
  //   const colId = event.colDef.field;

  //   if (colId === 'division') {
  //     // When division changes, reset department and subdepartment
  //     event.data.department = null;
  //     event.data.subdepartment = null;

  //     // Force refresh to show empty cells
  //     this.gridApi.applyTransaction({ update: [event.data] });
  //   } else if (colId === 'department') {
  //     // When department changes, reset subdepartment
  //     event.data.subdepartment = null;

  //     this.gridApi.applyTransaction({ update: [event.data] });
  //   }

  //   console.log('Updated Cell:', event.data);
  //   // Call API to save updated row if needed
  // }

  onCellValueChanged(event: any) {
    const colId = event.colDef.field;

    if (colId === 'division') {
      event.data.department = null;
      event.data.subdepartment = null;
      this.gridApi.applyTransaction({ update: [event.data] });
    } else if (colId === 'department') {
      event.data.subdepartment = null;
      this.gridApi.applyTransaction({ update: [event.data] });
    }
  }

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

  // onCellValueChanged(event: any) {
  //   console.log('Updated Cell:', event.data);
  //   // Call update API here
  // }

  onFilterChanged() {
    this.loadData(1);
  }

  onSortChanged() {
    this.loadData(1);
  }

  getAllDepartment = () => {
    this._departmentServices.getDepartmentList().subscribe((res) => {
      if (res?.Data) {
        this.departments = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
      } else {
        this.departments = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };

  getAllDivisions = () => {
    this._divisionServices.getDivisionList().subscribe((res) => {
      if (res?.Data) {
        this.divisions = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
      } else {
        this.divisions = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };

  getAllSubDepartments = () => {
    this._subDeparmentServices.getSubDepartmentList().subscribe((res) => {
      if (res?.Data) {
        this.subdepartments = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
      } else {
        this.subdepartments = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };

  loadDepartments() {
    this._departmentServices.getDepartmentList().subscribe((res) => {
      if (res?.Data) {
        const allDeps = res.Data.map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
          DivisionCode: d.DivisionCode, // make sure this exists in your API response
        }));

        // Group departments by divisionCode
        this.departments = allDeps.reduce((acc: any, dep: any) => {
          (acc[dep.DivisionCode] = acc[dep.DivisionCode] || []).push(dep);
          return acc;
        }, {} as { [key: string]: any[] });
      }
    });
  }

  loadSubdepartments() {
    this._subDeparmentServices.getSubDepartmentList().subscribe((res) => {
      if (res?.Data) {
        const allSubs = res.Data.map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
          DepartmentCode: d.DepartmentCode, // make sure this exists in your API response
        }));

        // Group subdepartments by departmentCode
        this.subdepartments = allSubs.reduce((acc: any, sub: any) => {
          (acc[sub.DepartmentCode] = acc[sub.DepartmentCode] || []).push(sub);
          return acc;
        }, {} as { [key: string]: any[] });
      }
    });
  }
}
