import { Component, Inject } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-revision-history-modal',
  imports: [AgGridWrapper],
  templateUrl: './revision-history-modal.html',
  styleUrl: './revision-history-modal.css',
})
export class RevisionHistoryModal {
  revisionHistoryData: any[] = []; // Changed to match likely HTML binding
  pageSize = 10;
  selectedPageSize = 10;
  totalRows = 0;
  averateDocumentScoreData: any[] = [];
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

  constructor(@Inject(NZ_MODAL_DATA) public modalData: any) {}

  ngOnInit() {
    this.loadData({ pageNumber: 1 });
  }

  GetAllDocuments(query: any) {
    this.loadData(query);
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.pageSize = event.pageSize;
    }
    this.loadData({ pageNumber: 1, pageSize: this.pageSize });
  }

  loadData(query: any = {}) {
    const pageNumber = Number(query.pageNumber) || 1;
    const pageSize = Number(query.pageSize) || this.pageSize;

    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * pageSize;
    const end = start + pageSize;

    this.revisionHistoryData = allData.slice(start, end);
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
