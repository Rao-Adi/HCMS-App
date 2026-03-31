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
import { CabinetSelection, SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { LinkRenderer } from '@app/shared/ag-grid-renderers/link-renderer/link-renderer';
import { AverageDocumentScoreModal } from '../average-document-score-modal/average-document-score-modal';
import { ApprovalHistoryModal } from '../approval-history-modal/approval-history-modal';
import { RevisionHistoryModal } from '../revision-history-modal/revision-history-modal';
import { ColumnToggle } from '../../../../shared/interfaces/interfaces';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { MyPendingRequestForApproval } from '../my-approval-request/my-pending-request-for-approval/my-pending-request-for-approval';
import { DocumentService } from '@app/shared/services/document.service'; 
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { NotificationService } from '@app/shared/notification/notification.service';

@Component({
  selector: 'app-document-authorization-post-training',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule, 
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    NzModalModule,
    DocumentTypeList,
    MyPendingRequestForApproval,
    CabinetStructureList,
    AgGridWrapper
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
  selectedbusinessDomain?: string = '';
  selectedDocumentType?: string = '';
  selectedAuthorizationStatus: string = '1'; // Default to '1' (SOP)

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
    { field: 'trainingProof', label: 'Training Proof', visible: true },
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
      field: 'trainingProof',
      headerName: 'Training Proof',
      cellRendererSelector: () => ({
        component: LinkRenderer,
        params: {
          label: 'View Proof',
          onClick: (rowData: any) => {
            this.openTrainingProofModal(rowData);
          },
        },
      }),
    },
    {
      field: 'trainingMode',
      headerName: 'Training Mode' 
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
      headerName: 'Division' 
    },
    {
      field: 'department',
      headerName: 'Department' 
    },
    {
      field: 'subDepartment',
      headerName: 'Sub-Department' 
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

  constructor(private modal: NzModalService,
    private _documentService: DocumentService,
    private _notification: NotificationService
  ) {}

  ngOnInit() { 
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
    this.applyColumnToggles();
    // Set initial visibility of the Training Proof column based on default status
    this.gridApi.setColumnsVisible(['trainingProof'], this.selectedAuthorizationStatus === '1');
  }

  applyColumnToggles() {
    if (!this.gridApi || !this.columnToggles) return;

    this.columnToggles.forEach((c) => {
      this.gridApi.setColumnsVisible([c.field], c.visible);
    });
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

  GetAllDocuments(query: any) {
    const sort = query.sortModel?.[0];
    const payload = {
      companyid:MASTER_DEFAULT_KEYS.COMPANYID,
      documentcategoryfilter: Number(this.selectedAuthorizationStatus),
      searchText: query?.searchTerm || '',
      sortBy: sort?.sort?.toUpperCase() || 'DESC',
      sortColumn: sort?.colId || 'Id',
      isActive: true,
      pageNumber: query?.pageNumber || 1,
      pageSize: query?.pageSize || this.pageSize,
    };

    this._documentService.GetPendingAuthorizations(payload).subscribe({
      next: (res: any) => {
        if (res?.Success && res?.Data) {
          const data = res.Data;
          const items = data.Items || (Array.isArray(data) ? data : []);
          this.totalRows = data.TotalCount ?? items.length;
          this.pendingAuthorizationData = items.map((item: any) => ({
            ...item,
            documentId: item.documentid || item.DocumentId || item.documentId || item.Id || item.id,
            documentNumber: item.documentnumber,
            documentName: item.title || item.DocumentName || item.documentName,
            version: item.version || item.Version || item.RowVersion || item.rowVersion,
            documentType: item.documenttype || item.DocumentType || item.documentType,
            documentTypeCode: item.documenttypecode,
            trainingProof: item.trainingproofurl,
            division: item.divisionname || item.Division || item.division,
            department: item.departmentname || item.Department || item.department,
            subDepartment: item.subdepartmentname || item.SubDepartment || item.subDepartment,
            businessDomain: item.businessdomain,
            requestCreatedBy: item.initiator,
            requestCreatedOn: this.formatDate(item.createdat)
          }));
        } else {
          this.pendingAuthorizationData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this.pendingAuthorizationData = [];
        this.totalRows = 0;
        this._notification.createNotification(
          'error',
          'Error',
          err?.Message || 'Failed to fetch pending authorizations.',
        );
      },
    });
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return value;
    }
  }

  GetAllUploadedDocuments(query: any) {}
  
  onAuthorizationStatusChange(statusId: string): void {
    this.selectedAuthorizationStatus = statusId;
    if (this.gridApi) {
      this.gridApi.setColumnsVisible(['trainingProof'], statusId === '1');
    }
  }

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

  openTrainingProofModal(row: any): void {
    // TODO: Implement logic to open training proof file/report
    console.log('Opening training proof for:', row);
  }

  approve(): void {
    if (!this.gridApi) return;
    
    const selectedRows = this.gridApi.getSelectedRows();
    if (selectedRows.length === 0) {
      this._notification.createNotification('warning', 'Selection Required', 'Please select at least one document to approve.');
      return;
    }
    
    const documentToApprove = selectedRows[0]; // Processes one document at a time

    this.modal.confirm({
      nzTitle: 'Approve Document',
      nzContent: `Are you sure you want to authorize the document: ${documentToApprove.documentName}?`,
      nzOnOk: () => {
        const payload = {
          documentId: documentToApprove.documentId,
          companyId: MASTER_DEFAULT_KEYS.COMPANYID,
          userId: '1', // TODO: Make dynamic based on the logged-in user
          observation: 'Authorized via post-training screen' // TODO: Collect via a form/modal wrapper if required by BL-011
        };

        this._documentService.AuthorizeDocumentPostTraining(payload).subscribe({
          next: (res) => {
            if (res?.Success) {
              this._notification.createNotification('success', 'Success', 'Document authorized successfully.');
              this.GetAllDocuments({ pageNumber: 1, pageSize: this.pageSize });
            } else {
              this._notification.createNotification('error', 'Error', res?.Message || 'Failed to authorize document.');
            }
          },
          error: () => this._notification.createNotification('error', 'Error', 'Failed to authorize document.')
        });
      }
    });
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

  onHierarchyChange(values: CabinetSelection[]) {
      this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
      this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
      this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
      this.selectedbusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
    }
}
