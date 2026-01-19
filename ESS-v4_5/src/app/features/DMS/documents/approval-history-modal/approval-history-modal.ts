import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-approval-history-modal',
  imports: [AgGridWrapper],
  templateUrl: './approval-history-modal.html',
  styleUrl: './approval-history-modal.css',
})
export class ApprovalHistoryModal {
  averateDocumentScoreData: any[] = [];
  pageSize = 10;
  selectedPageSize = 10;
  totalRows = 0;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pendingAuthorizationColumnDefs: ColDef[] = [
    { field: 'approvalSequence', headerName: 'Approval Sequence' },
    { field: 'empArroalAuthority', headerName: 'Employee (Approval Authority)' },
    {
      field: 'designation',
      headerName: 'Designation',
    },
    {
      field: 'recievedOn',
      headerName: 'Recieved On',
    },
    {
      field: 'statusUpdatedOn',
      headerName: 'Status Updated On',
    },

    { field: 'status', headerName: 'Status' },
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
      approvalSequence: ['1', '2', '3', '4', '5'][i % 2],
      empArroalAuthority: ['Jhon Doe', 'Jane Smith', 'Mike Johnson'][i % 2],
      designation: ['Trainee Software Engineer','Solution Architect'][i % 2],
      recievedOn: ['13 Aug 2024', '09 Aug 2024'][i % 2],
      statusUpdatedOn: ['13 Aug 2024', '09 Aug 2024'][i % 2], 
      status: ['Approved', 'Reject'][i % 2], 
    }));
  }
}
