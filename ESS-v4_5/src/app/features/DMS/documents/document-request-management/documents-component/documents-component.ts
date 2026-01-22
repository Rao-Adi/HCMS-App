import { Component } from '@angular/core';
import { LinkRenderer } from '@app/shared/ag-grid-renderers/link-renderer/link-renderer';
import { ColumnToggle } from '@app/shared/interfaces/interfaces';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RevisionHistoryModal } from '../../revision-history-modal/revision-history-modal';
import { ApprovalHistoryModal } from '../../approval-history-modal/approval-history-modal';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-documents-component',
  imports: [AgGridWrapper],
  templateUrl: './documents-component.html',
  styleUrl: './documents-component.css',
})
export class DocumentsComponent {
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
      field: 'documentType',
      headerName: 'Document Type',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing Division', 'Software Division', 'Finance Division', 'HR Division'],
      },
    },
    {
      field: 'documentName',
      headerName: 'Document Name',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing', 'IT', 'Finance', 'HR'],
      },
    },
    {
      field: 'version',
      headerName: 'Version',
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
    { field: 'nextReviewDate', headerName: 'Next Review Date' },
    { field: 'url', headerName: 'URL' },
    { field: 'requestCreatedBy', headerName: 'Request Created By' },
    { field: 'requestCreatedOn', headerName: 'Request Created On' },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created  By' },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On' },

    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      cellRendererSelector: () => ({
        component: LinkRenderer,
        params: {
          label: 'View',
          onClick: (rowData: any) => {
            this.openApprovalHistoryModal(rowData);
          },
        },
      }),
    },
    {
      field: 'revisionHistory',
      headerName: 'Revision History',
      cellRendererSelector: () => ({
        component: LinkRenderer,
        params: {
          label: 'View',
          onClick: (rowData: any) => {
            this.openRevisionHistoryModal(rowData);
          },
        },
      }),
    },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'version', label: 'Version', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'nextReviewDate', label: 'Next Review Date', visible: true },
    { field: 'url', label: 'URL', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
    { field: 'revisionHistory', label: 'Revision History', visible: true },
  ];

  workflowAuthoritiesData: any[] = [];

  constructor(private modal: NzModalService) {}
  ngOnInit() {
    this.loadData(this.pageSize);
  }

  GetAllDocuments(query: any) {}

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
  }

  openRevisionHistoryModal(row: any): void {
    this.modal.create({
      nzTitle: 'Revision History',
      nzContent: RevisionHistoryModal,
      nzData: {
        data: row, // 👈 this is what we’ll read inside modal
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });
  }

  openApprovalHistoryModal(row: any): void {
    this.modal.create({
      nzTitle: 'Approval History',
      nzContent: ApprovalHistoryModal,
      nzData: {
        data: row, // 👈 this is what we’ll read inside modal
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });
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
      documentType: ['SOP', 'IT Policy', 'Duideline'][i % 2],
      documentName: ['Assest Assignment SOP', 'Password Policy', 'Leave Policy'][i % 2],
      version: ['1.0', '2', '3.1', '4.0', '1.5'][i % 2],
      division: ['Marketing', 'IT', 'HR', 'Admin'][i % 2],
      department: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      subdepartment: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      nextReviewDate:['10-10-2022','11-12-2025','10-10-2026'][i%2],
      designation: ['Trainee Software Engineer', 'Solution Architect'][i % 2],
      requestCreatedOn: ['13 Aug 2024', '09 Aug 2024'][i % 2],
      previousVersionCreatedOn: ['13 Aug 2024', '09 Aug 2024'][i % 2],
      statusUpdatedOn: ['13 Aug 2024', '09 Aug 2024'][i % 2],
      url: ['https://abc.com'][i % 1],
    }));
  }
}
