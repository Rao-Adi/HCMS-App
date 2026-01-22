import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { DivisionList } from '@app/shared/Dropdowns/division-list/division-list';
import { SubDepartmentList } from '@app/shared/Dropdowns/sub-department-list/sub-department-list';
import { DepartmentList } from '@app/shared/Dropdowns/department-list/department-list';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { LinkRenderer } from '@app/shared/ag-grid-renderers/link-renderer/link-renderer';
import { AverageDocumentScoreModal } from '../average-document-score-modal/average-document-score-modal';
import { ApprovalHistoryModal } from '../approval-history-modal/approval-history-modal';
import { RevisionHistoryModal } from '../revision-history-modal/revision-history-modal';
import { ColumnToggle } from '../../../../shared/interfaces/interfaces';
import { ColumnDisplayOptionsComponent } from '@app/shared/ag-grid-wrapper/column-display-options-component/column-display-options-component';
import { MyPendingRequestForApproval } from '../document-request-management/my-pending-request-for-approval/my-pending-request-for-approval';

@Component({
  selector: 'app-document-authorization-post-training',
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
    NzModalModule,
    AgGridWrapper,
    DivisionList,
    SubDepartmentList,
    DepartmentList,
    DocumentTypeList,
    ColumnDisplayOptionsComponent,
    MyPendingRequestForApproval
  ],
  templateUrl: './document-authorization-post-training.html',
  styleUrl: './document-authorization-post-training.css',
})
export class DocumentAuthorizationPostTraining {
  gridApi!: GridApi;
  selectedTab: string = 'Pending Authorization';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedDocumentType?: string = '';

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';
  pageSize = 10;
  pendingAuthorizationData: any[] = [];
  totalRows = 0;
  authorizationStatues: any[] = [
    {
      id: '1',
      text: 'SOP',
    },
    { id: '2', text: 'Other Documents' },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'trainingMode', label: 'Training Mode', visible: true },
    { field: 'averageDocumentScore', label: 'Average Document Score', visible: true },
    { field: 'userAssinged', label: 'User Assigned', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subDepartment', label: 'Sub-Department', visible: true },
    { field: 'url', label: 'URL', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
    { field: 'revisionHistory', label: 'Revision History', visible: true },
  ];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  pendingAuthorizationColumnDefs: ColDef[] = [
    { field: 'documentType', headerName: 'Document Type', pinned: 'left' },
    { field: 'documentName', headerName: 'Document Name', pinned: 'left' },
    { field: 'version', headerName: 'Version', pinned: 'left' },
    {
      field: 'trainingMode',
      headerName: 'Training Mode',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    { field: 'userAssinged', headerName: 'User Assinged' },
    {
      field: 'averageDocumentScore',
      headerName: 'Average Document Score',
      cellRendererSelector: (params) => ({
        component: LinkRenderer,
        params: {
          label: params.value ?? 'View',
          onClick: (rowData: any) => {
            this.openAverageScoreModal(rowData);
          },
        },
      }),
    },
    {
      field: 'division',
      headerName: 'Division',
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
      field: 'subDepartment',
      headerName: 'Sub-Department',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
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

  UploadedDocColumnDefs = [
    { field: 'documentId', headerName: 'Document ID' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version Number' },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'nextReviewDate', headerName: 'Next Review Date' },
  ];

  companies: SelectList[] = [
    { CODE: '1', NAME: 'ATCO' },
    { CODE: '2', NAME: 'Softronic' },
  ];

  constructor(private modal: NzModalService) {}

  ngOnInit() {
    this.loadData(this.pageSize);
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
    this.applyColumnToggles();
  }

  
  applyColumnToggles() {
    if (!this.gridApi || !this.columnToggles) return;

    this.columnToggles.forEach((c) => {
      this.gridApi.setColumnsVisible([c.field], c.visible);
    });
  }

  loadData(pageNumber: number) {
    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pendingAuthorizationData = allData.slice(start, end);
    this.totalRows = allData.length;

    // 🔹 REMOVE THIS when backend is ready
    // this.gridService.loadData(this.apiUrl, request).subscribe(...)
  }

  private getDummyData(): any[] {
    return Array.from({ length: 100 }).map((_, i) => ({
      documentId: `DOC-${i + 1}`,
      documentName: `Policy Document ${i + 1}`,
      version: `v${Math.floor(Math.random() * 5) + 1}.0`,
      trainingMode: ['Online', 'Class room'][i % 3],
      userAssinged: ['1', '2', '3', '4', '5'][i % 3],
      averageDocumentScore: ['11', '12', '13', '14', '15'][i % 3],
      division: ['Marketing Division', 'Software Division'][i % 4],
      department: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      subDepartment: ['Ops', 'Admin', 'Support'][i % 3],
      nextReviewDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
        .toISOString()
        .split('T')[0],
      uploadDocument: 'Upload',
    }));
  }

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
  GetAllDocuments(query: any) {}

  GetAllUploadedDocuments(query: any) {}

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'documentGrid':
        this.divisionPageSize = pageSize;
        this.GetAllDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'authorizationStatusGrid':
        this.employeePageSize = pageSize;
        this.GetAllDocuments({
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

  openAverageScoreModal(row: any): void {
    this.modal.create({
      nzTitle: 'Average Document Score',
      nzContent: AverageDocumentScoreModal,
      nzData: {
        data: row, // 👈 this is what we’ll read inside modal
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });
  }

  openApprovalHistoryModal(row: any): void {
    this.modal.create({
      // nzTitle: 'Approval History',
      // nzContent: ApprovalHistoryModalComponent,
      // nzComponentParams: {
      //   data: row,
      // },
      // nzWidth: 800,
      nzTitle: 'Approval History',
      nzContent: ApprovalHistoryModal,
      nzData: {
        data: row, // 👈 this is what we’ll read inside modal
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });
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
}
