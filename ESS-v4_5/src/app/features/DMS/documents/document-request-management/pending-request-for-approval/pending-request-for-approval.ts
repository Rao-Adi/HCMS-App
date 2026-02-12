import { Component } from '@angular/core';
import { ColumnToggle } from '@app/shared/interfaces/interfaces';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-pending-request-for-approval',
  imports: [AgGridWrapper],
  templateUrl: './pending-request-for-approval.html',
  styleUrl: './pending-request-for-approval.css'
})
export class PendingRequestForApproval {
// Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: true,
  };

  documentColumnDefs = [
    {
      field: 'requestId',
      headerName: 'RequestId',
    },

    {
      field: 'division',
      headerName: 'Division',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing', 'IT', 'Finance', 'HR'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Digital Marketing', 'Software Marketing'],
      },
    },
    {
      field: 'subdepartment',
      headerName: 'Sub-Department',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Digital Marketing', 'Software Marketing'],
      },
    },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentTitle', headerName: 'Document Title' },
    { field: 'justification', headerName: 'Justification' },
    { field: 'createdOn', headerName: 'Created On' },
    { field: 'pendingWith', headerName: 'Pending with' },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'requestId', label: 'Request Id', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentTitle', label: 'Document Title', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'createdOn', label: ' Created On', visible: true },
    { field: 'pendingWith', label: 'Pending with', visible: true },
  ];

  workflowAuthoritiesData: any[] = [];

  constructor() {}

  ngOnInit() {
    this.loadData(this.pageSize);
  }

  GetAllDocuments(query: any) {}

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
  }

  loadData(pageNumber: number) {
    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.workflowAuthoritiesData = allData.slice(start, end);
    this.totalRows = allData.length;

    // 🔹 REMOVE THIS when backend is ready
    // this.gridService.loadData(this.apiUrl, request).subscribe(...)
  }

  private getDummyData(): any[] {
    return Array.from({ length: 100 }).map((_, i) => ({
      requestId: ['SOP', 'IT Policy', 'Duideline'][i % 2],
      division: ['Marketing', 'IT', 'HR', 'Admin'][i % 2],
      department: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      subdepartment: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      justification: ['test'][i % 1],
      documentType: ['SOP', 'Procedure'][i % 2],
      createdOn: ['13/Aug/2025', '09/Aug/2026'][i % 2],
      pendingWith: ['Finance Controller', 'Director Ops'][i % 2],
      documentTitle: ['Vechile Usage SOP', 'Vendor Payment Procedure'][i % 1],
    }));
  }

  approve() {}
  disapprove() {}
  revert() {}
}
