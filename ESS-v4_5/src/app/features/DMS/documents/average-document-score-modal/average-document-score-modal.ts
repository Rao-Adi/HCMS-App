import { Component, Inject } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-average-document-score-modal',
  imports: [AgGridWrapper],
  templateUrl: './average-document-score-modal.html',
  styleUrl: './average-document-score-modal.css',
})
export class AverageDocumentScoreModal {
  averateDocumentScoreData: any[] = [];
  pageSize = 10;
  selectedPageSize = 10;
  totalRows = 0;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pendingAuthorizationColumnDefs: ColDef[] = [
    { field: 'user', headerName: 'User' },
    { field: 'role', headerName: 'Role' },
    {
      field: 'subDepartment',
      headerName: 'Sub-Department',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    {
      field: 'division',
      headerName: 'Division',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    {
      field: 'noOfAttempts',
      headerName: 'No. of Attempts',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    { field: 'score', headerName: 'Score' },
    { field: 'status', headerName: 'Status' },
  ];

  constructor(@Inject(NZ_MODAL_DATA) public modalData: any) {}

  ngOnInit() {
    this.loadData(this.pageSize);
  }

  loadData(pageNumber: number) {
    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.averateDocumentScoreData = allData.slice(start, end);
    this.totalRows = allData.length;

    // 🔹 REMOVE THIS when backend is ready
    // this.gridService.loadData(this.apiUrl, request).subscribe(...)
  }

  private getDummyData(): any[] {
    return Array.from({ length: 100 }).map((_, i) => ({
      documentName: `Policy Document ${i + 1}`,

      user: ['Jhon Doe', 'Jane Smith', 'Mike Johnson'][i % 3],
      role: ['Manager', 'Analyze', 'Coordinator', 'Developer'][i % 3],
      averageDocumentScore: ['11', '12', '13', '14', '15'][i % 3],
      division: ['Marketing Division', 'Software Division'][i % 4],
      department: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      noOfAttempts: `v${Math.floor(Math.random() * 5) + 1}.0`,
      subDepartment: ['Ops', 'Admin', 'Support'][i % 3],
      nextReviewDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
        .toISOString()
        .split('T')[0],
      uploadDocument: 'Upload',
    }));
  }
}
