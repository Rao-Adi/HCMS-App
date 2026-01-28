import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms'; 
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { MyPendingRequestForApproval } from '../document-request-management/my-pending-request-for-approval/my-pending-request-for-approval';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';

@Component({
  selector: 'app-my-approval-document',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    AgGridWrapper,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule, 
    DocumentTypeList,
    MyPendingRequestForApproval,
    DMSRichTextEdit,
    CabinetStructureList
  ],
  templateUrl: './my-approval-document.html',
  styleUrl: './my-approval-document.css',
})
export class MyApprovalDocument {
  selectedTab: string = 'Pending';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedDocumentType?: string = '';

  constructor() {}

  ngOnInit() {}

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: true,
  };

  pageSize = 10;
  totalPendingDocuments = 0;
  totalApprovedDocuments = 0;
  totalDisApprovedDocuments = 0;
  rowData: any[] = [];
  public noRowsOverlay: string = '';

  companies: SelectList[] = [
    { CODE: '1', NAME: 'ATCO' },
    { CODE: '2', NAME: 'Softronic' },
  ];

  pendingDocumentsGridColumnDefs = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'requestId', headerName: 'Request Id' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'observation', headerName: 'Observation' },
    { field: 'justification', headerName: 'Justification' },
    { field: 'proposedDocumentNumber', headerName: 'Proposed Document Number' },
    { field: 'proposedVerion', headerName: 'Proposed Version' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment ', headerName: 'Sub-Department' },
    { field: 'dateOfCreation', headerName: 'Date of Creation' },
    { field: 'dateOfApproval', headerName: 'Date of Approval' },
    { field: 'requestedBy', headerName: 'Requested By' },
    { field: 'requestedOn', headerName: 'Requested On' },
    { field: 'previsousVersionCreatedBy', headerName: 'Previous Version Created By' },
    { field: 'previsousVersionCreatedOn', headerName: 'Previous Version Created On' },
    { field: 'approvalHistory', headerName: 'Approval History' },
  ];
  approvedDocumentsGridColumnDefs = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'requestId', headerName: 'Request Id' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'observation', headerName: 'Observation' },
    { field: 'justification', headerName: 'Justification' },
    { field: 'proposedDocumentNumber', headerName: 'Proposed Document Number' },
    { field: 'proposedVerion', headerName: 'Proposed Version' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment ', headerName: 'Sub-Department' },
    { field: 'dateOfCreation', headerName: 'Date of Creation' },
    { field: 'dateOfApproval', headerName: 'Date of Approval' },
    { field: 'requestedBy', headerName: 'Requested By' },
    { field: 'requestedOn', headerName: 'Requested On' },
    { field: 'previsousVersionCreatedBy', headerName: 'Previous Version Created By' },
    { field: 'previsousVersionCreatedOn', headerName: 'Previous Version Created On' },
    { field: 'approvalHistory', headerName: 'Approval History' },
  ];
  disapprovedDocumentsGridColumnDefs = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'requestId', headerName: 'Request Id' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'observation', headerName: 'Observation' },
    { field: 'justification', headerName: 'Justification' },
    { field: 'proposedDocumentNumber', headerName: 'Proposed Document Number' },
    { field: 'proposedVerion', headerName: 'Proposed Version' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment ', headerName: 'Sub-Department' },
    { field: 'dateOfCreation', headerName: 'Date of Creation' },
    { field: 'dateOfApproval', headerName: 'Date of Approval' },
    { field: 'requestedBy', headerName: 'Requested By' },
    { field: 'requestedOn', headerName: 'Requested On' },
    { field: 'previsousVersionCreatedBy', headerName: 'Previous Version Created By' },
    { field: 'previsousVersionCreatedOn', headerName: 'Previous Version Created On' },
    { field: 'approvalHistory', headerName: 'Approval History' },
  ];

  pendingDocumentData: any[] = [
    {
      documentType: 'SOP',
      requestId: 'REQ001',
      documentName: 'Document 1',
      observation: 'Observation',
      justification: 'Training Request',
      proposedDocumentNumber: 'DOC-SOP-QA-001',
      proposedVerion: '1.0',
      division: 'Marketing Division',
      department: 'Marketing',
      subDepartment: 'Digital Marketing',
      dateOfCreation: '2024-06-01',
      dateOfApproval: '2024-06-05',
      requestedBy: 'John Doe',
      requestedOn: '2024-06-01',
      previsousversionCreatedBy: 'Jane Smith',
    },
    {
      documentType: 'Policy',
      requestId: 'REQ002',
      documentName: 'Document 2',
      observation: 'Observation 2',
      justification: 'New Policy',
      proposedDocumentNumber: 'DOC-POL-HR-002',
      proposedVerion: '1.0',
      division: 'HR Division',
      department: 'HR',
      subDepartment: 'Employee Relations',
      dateOfCreation: '2024-06-02',
      dateOfApproval: '2024-06-06',
      requestedBy: 'Alice Johnson',
      requestedOn: '2024-06-02',
      previsousVersionCreatedBy: 'Bob Brown',
      previsousVersionCreatedOn: '2024-05-15',
      approvalHistory: 'Approved by Manager on 2024-06-06',
    },
    {
      documentType: 'Manual',
      requestId: 'REQ003',
      documentName: 'Document 3',
      observation: 'Observation 3',
      justification: 'Update Manual',
      proposedDocumentNumber: 'DOC-MAN-IT-003',
      proposedVerion: '2.0',
      division: 'Software Division',
      department: 'IT',
      subDepartment: 'Software Marketing',
      dateOfCreation: '2024-06-03',
      dateOfApproval: '2024-06-07',
      requestedBy: 'Charlie Davis',
      requestedOn: '2024-06-03',
      previsousVersionCreatedBy: 'Diana Evans',
      previsousVersionCreatedOn: '2024-05-20',
      approvalHistory: 'Approved by Manager on 2024-06-07',
    },
  ];

  onDivisionChange(value: string): void {
    this.selectedDivisions = value;
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
  }
  onDepartmentsChange(value: string): void {
    this.selectedDepartment = value;
    this.selectedSubDepartment = '';
  }
  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;
  }

  GetAllPendingDocuments(query: any) {}
  GetAllApprovedDocuments(query: any) {}
  GetAllDisApprovedDocuments(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'pendingGrid':
        this.divisionPageSize = pageSize;
        this.GetAllPendingDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;

      case 'approvedGrid':
        this.employeePageSize = pageSize;
        this.GetAllApprovedDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'disapprovedGrid':
        this.employeePageSize = pageSize;
        this.GetAllDisApprovedDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      default:
        break;
    }
  }
}
