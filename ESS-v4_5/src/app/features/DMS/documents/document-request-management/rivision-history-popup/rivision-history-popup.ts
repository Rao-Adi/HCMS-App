import { Component, Input } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper'; 
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-rivision-history-popup',
  imports: [AgGridWrapper],
  templateUrl: './rivision-history-popup.html',
  styleUrl: './rivision-history-popup.css',
})
export class RivisionHistoryPopup {
  @Input() data: any;

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
        field: 'employeeName',
        headerName: 'Employee Name',
        flex: 1
      },
  {
        field: 'employeeRole',
        headerName: 'Employee Role',
        flex: 1
      },
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
        employeeName: ['Raheel Ahmed','Shahzaib Moiz'][i % 2],
        employeeRole: ['Territory Sales Manager'][i % 1]
      }));
    }
  
    approve() {}
    disapprove() {}
    revert() {}
  }
  