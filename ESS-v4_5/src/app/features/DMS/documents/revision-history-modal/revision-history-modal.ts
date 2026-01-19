import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-revision-history-modal',
  imports: [AgGridWrapper],
  templateUrl: './revision-history-modal.html',
  styleUrl: './revision-history-modal.css',
})
export class RevisionHistoryModal {
  averateDocumentScoreData: any[] = [];
  pageSize = 10;
  selectedPageSize = 10;
  totalRows = 0;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pendingAuthorizationColumnDefs: ColDef[] = [
    { field: 'document', headerName: 'Document', flex: 1 },
    { field: 'version', headerName: 'Version' },
    {
      field: 'revisedBy',
      headerName: 'Revised By',
      flex: 1,
    },
    {
      field: 'revisedOn',
      headerName: 'Revised On',
      flex: 1,
    },
    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      flex: 1,
    },
  ];

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
      document: ['1', '2', '3', '4', '5'][i % 2],
      version: ['Jhon Doe', 'Jane Smith', 'Mike Johnson'][i % 2],
      revisedBy: ['Trainee Software Engineer', 'Solution Architect'][i % 2],
      revisedOn: ['13 Aug 2024', '09 Aug 2024'][i % 2],
      approvalHistory: ['Approved', 'Reject'][i % 2],
    }));
  }
}
