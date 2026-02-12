import { Component } from '@angular/core';
import { ColumnToggle } from '@app/shared/interfaces/interfaces';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ObservationModalPopup } from '../observation-modal-popup/observation-modal-popup';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-my-pending-request-for-approval',
  imports: [AgGridWrapper, NzIconModule, NzSwitchModule, NzModalModule],
  templateUrl: './my-pending-request-for-approval.html',
  styleUrl: './my-pending-request-for-approval.css',
})
export class MyPendingRequestForApproval {
  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;

  workflowAuthoritiesData: any[] = [];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: true,
  };

  documentColumnDefs = [
    {
      field: 'documentTypeId',
      headerName: 'Document Type',
    },
    {
      field: 'requestId',
      headerName: 'Request Id',
    },
    {
      field: 'documentName',
      headerName: 'Document Name',
    },
    {
      field: 'observation',
      headerName: 'Observation',
      editable: false,
      cellRenderer: (params: any) => {
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          ${params.value ? 'Observation' : 'Observation'}
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openMandatoryCabinetModal(event.data);
      },
    },
    {
      field: 'justification',
      headerName: 'Justification',
    },
    {
      field: 'proposedDocumentNumber',
      headerName: 'Proposed Document Number',
    },
    {
      field: 'proposedVersionNumber',
      headerName: 'Proposed Versioin Number',
    },
    {
      field: 'division',
      headerName: 'Division',
      cellEditor: 'agSelectCellEditor',
    },
    {
      field: 'department',
      headerName: 'Department',
      cellEditor: 'agSelectCellEditor',
    },
    {
      field: 'subdepartment',
      headerName: 'Sub-Department',
      cellEditor: 'agSelectCellEditor',
    },
    { field: 'dateOfCreation', headerName: 'Date Of Creation' },
    { field: 'dateOfApproval', headerName: 'Date of Approval' },
    { field: 'requestCreatedBy', headerName: 'Request Created By' },
    { field: 'requestCreatedOn', headerName: 'Request Created On' },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By' },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On' },
    { field: 'approvalHistory', headerName: 'Approval History' },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'documentTypeId', label: 'document Type', visible: true },
    { field: 'requestId', label: 'Request Id', visible: true },
    { field: 'documentName', label: 'documentName', visible: true },
    { field: 'observation', label: 'Observation', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'proposedDocumentNumber', label: 'Proposed Document Number', visible: true },
    { field: 'proposedVersionNumber', label: 'Proposed Version Number', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'dateOfCreation', label: 'Date Of Creation', visible: true },
    { field: 'dateOfApproval', label: 'Date Of Approval', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
  ];

  constructor(private modal: NzModalService) {}

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

  handleGridAction(event: { action: string; rowData: any }) {
    if (event.action === 'VIEW_CABINET') {
      this.openMandatoryCabinetModal(event.rowData);
    }
  }

  openMandatoryCabinetModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Observation',
      nzContent: ObservationModalPopup,
      nzData: {
        name: 'Access Level',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  approve() {}
  disapprove() {}
  revert() {}
}
