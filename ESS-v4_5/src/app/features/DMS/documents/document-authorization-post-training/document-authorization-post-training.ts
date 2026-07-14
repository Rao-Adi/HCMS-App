import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
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
import { UtilitiesService } from '@app/core/services/utilities.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';

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
    AgGridWrapper,
  ],
  templateUrl: './document-authorization-post-training.html',
  styleUrl: './document-authorization-post-training.css',
})
export class DocumentAuthorizationPostTraining {
  gridApi!: GridApi;
  selectedTab: string = 'Pending Authorization';

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'trainingauthorization';

  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedbusinessDomain: string = '';
  selectedDocumentType: string = '';
  selectedAuthorizationStatus: string = '1'; // Default to '1' (SOP)
  hasSelectedRows = false;
  loginEmpId: string = '';

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
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'version', label: 'Version', visible: true },
    { field: 'trainingMode', label: 'Training Mode', visible: true },
    { field: 'userAssigned', label: 'User Assigned', visible: true },
    { field: 'averageDocumentScore', label: 'Average Document Score', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subDepartment', label: 'Sub-Department', visible: true },
    { field: 'url', label: 'URL', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
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
    { field: 'documentType', headerName: 'Document Type', pinned: 'left', minWidth: 100, flex: 1 },
    { field: 'documentName', headerName: 'Document Name', pinned: 'left', flex: 1 },
    { field: 'version', headerName: 'Version', pinned: 'left', minWidth: 60, flex: 1 },
    { field: 'trainingMode', headerName: 'Training Mode', minWidth: 120, flex: 1 },
    {
      field: 'userAssigned',
      headerName: 'User Assigned',
      cellRendererSelector: (params: any) => ({
        component: LinkRenderer,
        params: {
          label: params.value ?? 'View',
          onClick: () => {
            this.openTrainingProofModal(params.data);
          },
        },
      }),
      minWidth: 150,
      flex: 1,
    },
    {
      field: 'averageDocumentScore',
      headerName: 'Average Document Score',
      cellRendererSelector: (params: any) => ({
        component: LinkRenderer,
        params: {
          label: params.value ?? 'View',
          onClick: () => {
            this.openAverageScoreModal(params.data);
          },
        },
      }),
      minWidth: 180,
      flex: 1,
    },
    {
      field: 'division',
      headerName: 'Division',
    },
    {
      field: 'department',
      headerName: 'Department',
    },
    {
      field: 'subDepartment',
      headerName: 'Sub-Department',
    },
    { field: 'url', headerName: 'URL' },
    { field: 'requestCreatedBy', headerName: 'Request Created By', cellClass: 'audit-cell' },
    { field: 'requestCreatedOn', headerName: 'Request Created On', cellClass: 'audit-cell' },
    {
      field: 'previousVersionCreatedBy',
      headerName: 'Previous Version Created  By',
      cellClass: 'audit-cell',
    },
    {
      field: 'previousVersionCreatedOn',
      headerName: 'Previous Version Created On',
      cellClass: 'audit-cell',
    },

    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      cellRendererSelector: (params: any) => ({
        component: LinkRenderer,
        params: {
          label: 'View',
          onClick: () => {
            this.openApprovalHistoryModal(params.data);
          },
        },
      }),
    },
    {
      field: 'revisionHistory',
      headerName: 'Revision History',
      cellRendererSelector: (params: any) => ({
        component: LinkRenderer,
        params: {
          label: 'View',
          onClick: () => {
            this.openRevisionHistoryModal(params.data);
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

  constructor(
    private modal: NzModalService,
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
    private _UtilitiesService: UtilitiesService,
    private _permissionService: PermissionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.GetLoginEmpId();
    });
  }

  GetLoginEmpId() {
    this.loginEmpId = this._UtilitiesService.GetEmpid() || '';
  }

  onTabChange(tab: string) {
    this.selectedTab = tab;
    this.emptyAllFields();
  }

  emptyAllFields() {
    this.selectedDivisions = '';
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.selectedbusinessDomain = '';
    this.selectedDocumentType = '';
    this.selectedAuthorizationStatus = '1';
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
    this.GetAllDocuments({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  GetAllDocuments(query: any) {
    var isAuthorized = false;
    if (this.selectedTab == 'Pending Authorization') {
      isAuthorized = false;
    } else {
      isAuthorized = true;
    }

    const sort = query.sortModel?.[0];
    const payload = {
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedbusinessDomain,
      documentTypeCode: this.selectedDocumentType,
      documentcategoryfilter: Number(this.selectedAuthorizationStatus),
      searchText: query?.searchTerm || '',
      sortBy: sort?.sort?.toUpperCase() || 'DESC',
      sortColumn: sort?.colId || 'Id',
      isActive: true,
      pageNumber: query?.pageNumber || 1,
      pageSize: query?.pageSize || this.pageSize,
      IsAuthorized: isAuthorized,
      actionType: this.selectedTab
    };

    // Show loading overlay natively
    if (this.gridApi) {
      this.gridApi.showLoadingOverlay();
    }

    this._documentService.GetPendingAuthorizations(payload).subscribe({
      next: (res: any) => {
        if (res?.Success && res?.Data) {
          const data = res.Data;
          const items = data.Items || (Array.isArray(data) ? data : []);

          if (items.length > 0) {
            this.totalRows = data.TotalCount ?? items.length;
            this.pendingAuthorizationData = items.map((item: any) => ({
              ...item,
              Id: item.id || item.Id,
              trainingMode: 'Class Room', //item.TrainingMode || item.trainingMode || (item.LmsStatus ? 'Online' : 'Class Room'),
              averageDocumentScore: item.averagescore || item.averagescore || 0,
              userAssigned: item.totalassigned || item.totalassigned,
              companyId: item.companyId || item.CompanyId,
              company: item.Company || item.company,
              requestNumber: item.RequestNumber || item.requestNumber,
              documentTypeCode: item.DocumentTypeCode || item.documenttypecode,
              documentType: item.DocumentType || item.documenttype,
              proposedDocumentNumber:
                item.RequestNumber || item.requestNumber || item.documentnumber,
              division: item.Division || item.division,
              divisionCode: item.DivisionCode || item.divisionCode || item.divisioncode,
              documentId: item.DocumentNumber || item.documentid,
              documentName: item.DocumentName || item.documentname || item.title,
              proposedContent: item.ProposedContent || item.proposedcontent || item.content,
              department: item.Department || item.department,
              departmentCode: item.DepartmentCode || item.departmentCode || item.departmentcode,
              subDepartment: item.subdepartment || item.subdepartment,
              subDepartmentCode:
                item.SubDepartmentCode || item.subDepartmentCode || item.subdepartmentcode,
              justification: item.Justification || item.justification,
              businessdomain: item.BusinessDomain || item.businessDomain || item.businessdomain,
              businessDomainCode:
                item.BusinessDomainCode || item.businessDomainCode || item.businessdomaincode,
              pendingWith: item.CurrentAssignedUser || item.currentassigneduser,
              sumbittedby: item.CreatedBy || item.createdby,
              status: item.IsReworked ? 'Reworked' : 'Draft',
              createdOn: new CustomDateFormatPipe().transform(
                item.CreatedAt || item.createdat || '',
              ),
              requestCreatedOn: new CustomDateFormatPipe().transform(
                item.CreatedAt || item.createdat || '',
              ),
              requestCreatedBy: item.createdbyname || item.createdByName,
              previousVersionCreatedBy: item.LastModifiedByName || item.lastmodifiedbyname,
              previousVersionCreatedOn: new CustomDateFormatPipe().transform(
                item.draftContentLastModifiedAt ||
                  item.DraftContentLastModifiedAt ||
                  item.lastmodifiedat ||
                  '',
              ),
              version: item.Version || item.version || item.RowVersion || item.rowVersion,
              nextReviewDate: new CustomDateFormatPipe().transform(
                item.NextReviewDate || item.nextreviewdate || '',
              ),
              url: item.DocumentURL || item.documenturl,
              proposedVersionNumber: item.RowVersion || item.rowVersion || item.version,
              templateType: item.TemplateType || item.templateType,
              templateFileUrl: item.TemplateFileURL || item.templateFileUrl,
            }));
          } else {
            if (this.gridApi) {
              this.gridApi.showNoRowsOverlay();
            }
            this.pendingAuthorizationData = [];
            this.totalRows = 0;
          }
        } else {
          this.pendingAuthorizationData = [];
          this.totalRows = 0;
        }
        if (this.gridApi) {
          this.gridApi.hideOverlay();
        }
      },
      error: (err) => {
        this.pendingAuthorizationData = [];
        this.totalRows = 0;
        if (this.gridApi) {
          this.gridApi.showNoRowsOverlay();
        }
        this.cdr.detectChanges();
        this._notificationToastService.createNotification(
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

  onAuthorizationStatusChange(statusId: string): void {
    this.selectedAuthorizationStatus = statusId;
    if (this.gridApi) {
      this.gridApi.setColumnsVisible(['trainingProof'], statusId === '1');
    }
    this.GetAllDocuments({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    // Direct update: fixes the grid freezing bug when pagination changes
    this.pageSize = pageSize;
    this.GetAllDocuments({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  openTrainingProofModal(row: any): void {
    // TODO: Implement logic to open training proof file/report
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

  approve(actionType: string): void {
    if (!this.gridApi) return;

    const selectedRows = this.gridApi.getSelectedRows();
    if (selectedRows.length === 0) {
      this._notificationToastService.createNotification(
        'warning',
        'Selection Required',
        'Please select at least one document to approve.',
      );
      return;
    }

    const documentToApprove = selectedRows[0]; // Processes one document at a time
    const docId = documentToApprove.Id || documentToApprove.id || documentToApprove.documentId;

    this.modal.confirm({
      nzTitle: `${actionType} Document`,
      nzContent: `Are you sure you want to ${actionType} the document: ${documentToApprove.documentName}?`,
      nzOnOk: () => {
        const payload = {
          documentId: docId,
          empId: this.loginEmpId,
          action: actionType,
          observation: `${actionType} via post-training screen`, // TODO: Collect via a form/modal wrapper if required by BL-011
        };

        this._documentService.AuthorizeDocumentPostTraining(payload).subscribe({
          next: (res) => {
            if (res?.Success) {
              this._notificationToastService.createNotification(
                'success',
                'Success',
                `Document ${actionType} successfully.`,
              );
              this.GetAllDocuments({ pageNumber: 1, pageSize: this.pageSize });
            } else {
              this._notificationToastService.createNotification(
                'error',
                'Error',
                res?.Message || 'Failed to authorize document.',
              );
            }
          },
          error: () =>
            this._notificationToastService.createNotification(
              'error',
              'Error',
              `Failed to ${actionType} document.`,
            ),
        });
      },
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
    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: row.id,
        entityType: 'Request',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
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

    this.GetAllDocuments({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }

  onSelectionChange(selectedRows: any): void {
    this.hasSelectedRows = selectedRows && selectedRows.length > 0;
  }
}
