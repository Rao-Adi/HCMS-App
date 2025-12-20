import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzSwitchModule,
    AgGridWrapper,
  ],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  selectedTab: string = 'Upload';
  loading = false;
  switchValue1 = false;
  switchValue2 = false;
  // single state
  activeMode: 'manual' | 'integration' | null = null;

  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';

  constructor() {}

  ngOnInit() {
    this.loadData(this.pageSize);
  }
  clickSwitch(mode: 'manual' | 'integration'): void {
    if (this.loading) return;

    this.loading = true;

    setTimeout(() => {
      this.activeMode = mode;

      // mutually exclusive switches
      this.switchValue1 = mode === 'manual';
      this.switchValue2 = mode === 'integration';

      this.loading = false;
    }, 300); // keep UX fast
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  manuallyManageEmployeesColumnDefs = [
    { field: 'employeeCode', headerName: 'Employee Code' },
    { field: 'employeeName', headerName: 'Employee Name' },
    {
      field: 'division',
      headerName: 'Division',
      cellEditorParams: {
        values: ['Marketing', 'Software', 'HR', 'Finance', 'Operations', 'Admin'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      cellEditorParams: {
        values: ['Production', 'QA', 'R&D', 'Support', 'Management'],
      },
    },
    {
      field: 'subdepartment',
      headerName: 'Sub-Department',
      cellEditorParams: {
        values: ['Sub-Dept A', 'Sub-Dept B', 'Sub-Dept C'],
      },
    },
    {
      field: 'grade',
      headerName: 'Grade',
      cellEditorParams: {
        values: ['M.2', 'M.3', 'M.4', 'M.5', 'M.6', 'M.7'],
      },
    },
    {
      field: 'reportingManager',
      headerName: 'Reportin gManager',
      cellEditorParams: {
        values: ['Manager A', 'Manager B', 'Manager C', 'Manager D'],
      },
    },
    {
      field: 'dateofjoining',
      headerName: 'Date of Joining',
      cellEditor: 'agDateCellEditor',
      // valueFormatter: (params: ValueFormatterParams<any, Date>) => {
      //   if (!params.value) {
      //     return '';
      //   }
      //   const month = params.value.getMonth() + 1;
      //   const day = params.value.getDate();
      //   return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${
      //     day < 10 ? '0' + day : day
      //   }`;
      // },
      // cellEditorParams: {
      //   max: new Date('2008-12-31'),
      // },
    },
    { field: 'accessLevel', headerName: 'Access Level' },
  ];

  integrateWithPoeplePartnerColumnDefs = [
    { field: 'employeeCode', headerName: 'Employee Code' },
    { field: 'employeeName', headerName: 'Employee Name' },
    {
      field: 'division',
      headerName: 'Division',
      cellEditorParams: {
        values: ['Marketing', 'Software', 'HR', 'Finance', 'Operations', 'Admin'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      cellEditorParams: {
        values: ['Production', 'QA', 'R&D', 'Support', 'Management'],
      },
    },
    {
      field: 'subdepartment',
      headerName: 'Sub-Department',
      cellEditorParams: {
        values: ['Sub-Dept A', 'Sub-Dept B', 'Sub-Dept C'],
      },
    },
    {
      field: 'grade',
      headerName: 'Grade',
      cellEditorParams: {
        values: ['M.2', 'M.3', 'M.4', 'M.5', 'M.6', 'M.7'],
      },
    },
    {
      field: 'reportingManager',
      headerName: 'Reportin gManager',
      cellEditorParams: {
        values: ['Manager A', 'Manager B', 'Manager C', 'Manager D'],
      },
    },
    {
      field: 'dateofjoining',
      headerName: 'Date of Joining',
      cellEditor: 'agDateCellEditor',
      // valueFormatter: (params: ValueFormatterParams<any, Date>) => {
      //   if (!params.value) {
      //     return '';
      //   }
      //   const month = params.value.getMonth() + 1;
      //   const day = params.value.getDate();
      //   return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${
      //     day < 10 ? '0' + day : day
      //   }`;
      // },
      // cellEditorParams: {
      //   max: new Date('2008-12-31'),
      // },
    },
    { field: 'accessLevel', headerName: 'Access Level' },
  ];

  pageSize = 10;
  rowData: any[] = [];
  totalRows = 0;

  loadData(pageNumber: number) {
    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.rowData = allData.slice(start, end);
    this.totalRows = allData.length;

    // 🔹 REMOVE THIS when backend is ready
    // this.gridService.loadData(this.apiUrl, request).subscribe(...)
  }

  private getDummyData(): any[] {
    return Array.from({ length: 100 }).map((_, i) => ({
      documentId: `DOC-${i + 1}`,
      documentName: `Policy Document ${i + 1}`,
      version: `v${Math.floor(Math.random() * 5) + 1}.0`,
      documentType: ['Policy', 'SOP', 'Manual'][i % 3],
      division: ['North', 'South', 'East', 'West'][i % 4],
      department: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      subDepartment: ['Ops', 'Admin', 'Support'][i % 3],
      nextReviewDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
        .toISOString()
        .split('T')[0],
      uploadDocument: 'Upload',
    }));
  }
}
