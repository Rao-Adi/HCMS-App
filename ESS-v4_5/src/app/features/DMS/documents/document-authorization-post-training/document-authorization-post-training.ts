import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, ViewChild, TemplateRef } from '@angular/core';
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
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';

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
    DMSRichTextEdit,
  ],
  templateUrl: './document-authorization-post-training.html',
  styleUrl: './document-authorization-post-training.css',
})
export class DocumentAuthorizationPostTraining {
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;

  gridApi!: GridApi;
  selectedTab: string = 'Pending Authorization';

  pendingCount = 0;
  authorizedCount = 0;
  rejectedCount = 0;

  documentId: number = 0;
  currentDocumentName: string = '';
  templateHtml: string = '';
  draftFileUrl: string = '';
  safeDraftFileUrl?: SafeResourceUrl;
  isPdf: boolean = false;
  isDocx: boolean = false;

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
  // True while an approve/reject call is in flight -- disables the Approve/Reject buttons so a
  // second click can't fire a duplicate request before the first response comes back.
  isProcessingAction = false;
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
    { id: '2', text: 'Other Documents' },
    { id: '1', text: 'SOP' },
  ];

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subDepartment', label: 'Sub-Department' },
    4: { field: 'businessdomain', label: 'Business Domain' },
  };

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit).
  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentnumber', label: 'Document Number', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'version', label: 'Version', visible: true },
    { field: 'trainingMode', label: 'Training Mode', visible: true },
    { field: 'userAssigned', label: 'User Assigned', visible: true },
    { field: 'averageDocumentScore', label: 'Average Document Score', visible: true },
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

  // Columns before the cabinet (Division/Department/...) columns
  private readonly leadingColumnDefs: ColDef[] = [
    { field: 'documentType', headerName: 'Document Type', pinned: 'left' },
    { field: 'documentnumber', headerName: 'Document Number', pinned: 'left', flex: 1 },
    { field: 'documentName', headerName: 'Document Name', pinned: 'left', flex: 1 },
    { field: 'version', headerName: 'Version', pinned: 'left', minWidth: 60, flex: 1 },
    { field: 'trainingMode', headerName: 'Training Mode', minWidth: 120, flex: 1 },
    {
      field: 'userAssigned',
      headerName: 'User Assigned',
      editable: false,
      cellRendererSelector: (params: any) => ({
        component: LinkRenderer,
        params: {
          label: params.value ?? 'View',
          onClick: () => {
            this.openTrainingProofModal(params.data);
          },
        },
      }),
      minWidth: 100,
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
      minWidth: 100,
      flex: 1,
    },
  ];

  // Columns after the cabinet (Division/Department/...) columns
  private readonly trailingColumnDefs: ColDef[] = [
    // { field: 'url', headerName: 'URL' },
    {
      field: 'url',
      headerName: 'Url',
      editable: false,
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        return `
          <span
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
               View
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        this.openDocumentModal(event.data);
      },
    },
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
      editable: false,
      minWidth: 120,
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          Approval History
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openApprovalHistoryModal(event.data);
      },
    },
    {
      field: 'revisionHistory',
      headerName: 'Revision History',
      cellRendererSelector: (params: any) => ({
        component: LinkRenderer,
        params: {
          label: 'Revision History',
          onClick: () => {
            this.openRevisionHistoryModal(params.data);
          },
        },
      }),
    },
  ];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out
  // showing just the fixed columns until we know which levels are enabled.
  pendingAuthorizationColumnDefs: ColDef[] = [
    ...this.leadingColumnDefs,
    ...this.trailingColumnDefs,
  ];

  constructor(
    private modal: NzModalService,
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
    private _UtilitiesService: UtilitiesService,
    private _permissionService: PermissionService,
    private cdr: ChangeDetectorRef,
    private _cabinetHierarchyService: CabinetHierarchyService,
    private _navigationCountsService: NavigationCountsService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.GetLoginEmpId();
    });

    // Only show Division/Department/Sub-Department/Business Domain columns for cabinet
    // levels that are currently Enabled (CabinetLevel.isActive), labeled with whichever
    // title is configured for that level.
    this._cabinetHierarchyService.loadDropdownHierarchy().subscribe((levels) => {
      const activeLevelDefs = levels
        .filter((level) => level.isActive && this.cabinetLevelFields[level.level])
        .map((level) => ({
          ...this.cabinetLevelFields[level.level],
          title: level.title,
        }));

      this.pendingAuthorizationColumnDefs = [
        ...this.leadingColumnDefs,
        ...activeLevelDefs.map((def) => ({ field: def.field, headerName: def.title })),
        ...this.trailingColumnDefs,
      ];

      this.columnToggles = [
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentnumber', label: 'Document Number', visible: true },
        { field: 'documentName', label: 'Document Name', visible: true },
        { field: 'version', label: 'Version', visible: true },
        { field: 'trainingMode', label: 'Training Mode', visible: true },
        { field: 'userAssigned', label: 'User Assigned', visible: true },
        { field: 'averageDocumentScore', label: 'Average Document Score', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'url', label: 'URL', visible: true },
        { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
        { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
        { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
        { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
        { field: 'approvalHistory', label: 'Approval History', visible: true },
        { field: 'revisionHistory', label: 'Revision History', visible: true },
      ];
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
    this.selectedDocumentType = value;
    if (this.gridApi) {
      this.gridApi.refreshInfiniteCache();
    }
  }

  GetAllDocuments(query: any) {
    this.getDocumentRequestCounts();

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
      searchText: query?.searchText || query?.searchTerm || '',
      sortBy: sort?.sort?.toUpperCase() || 'DESC',
      sortColumn: sort?.colId || 'Id',
      isActive: true,
      pageNumber: query?.pageNumber || 1,
      pageSize: query?.pageSize || this.pageSize,
      IsAuthorized: isAuthorized,
      actionType: this.selectedTab,
    };

    // Show loading overlay natively
    if (this.gridApi) {
      this.gridApi.showLoadingOverlay();
    }

    this._documentService.GetPendingAuthorizations(payload).subscribe({
      next: (res: any) => {
        let items: any[] = [];
        if (res?.Success && res?.Data) {
          const data = res.Data;
          items = data.Items || (Array.isArray(data) ? data : []);

          if (items.length > 0) {
            this.totalRows = data.TotalCount ?? items.length;
            this.pendingAuthorizationData = items.map((item: any) => ({
              ...item,
              Id: item.id || item.Id,
              trainingMode: item.trainingmode == 1 ? 'Class Room' : 'Online', //item.TrainingMode || item.trainingMode || (item.LmsStatus ? 'Online' : 'Class Room'),
              averageDocumentScore: item.averagescore || item.averagescore || 0,
              userAssigned: item.totalassigned || item.totalassigned,
              companyId: item.companyId || item.CompanyId,
              company: item.Company || item.company,
              requestNumber: item.RequestNumber || item.requestNumber,
              documentnumber: item.Documentnumber || item.documentnumber,
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
              previousVersionCreatedBy:
                item.PreviousVersionCreatedBy || item.previousversioncreatedby,
              previousVersionCreatedOn: new CustomDateFormatPipe().transform(
                item.previousversioncreatedon ||
                  item.Previousversioncreatedon ||
                  item.PreviousVersionCreatedon ||
                  '',
              ),
              version: item.Version || item.version || item.RowVersion || item.rowVersion,
              nextReviewDate: new CustomDateFormatPipe().transform(
                item.NextReviewDate || item.nextreviewdate || '',
              ),
              url: item.DocumentURL || item.documenturl,
              proposedVersionNumber: item.RowVersion || item.rowVersion || item.version,
              templateType: item.TemplateType || item.templateType,
              templateFileUrl:
                item.TemplateFileUrl || item.TemplateFileURL || item.templateFileUrl || '',
            }));
          } else {
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
        if (items.length === 0) {
          if (this.gridApi) {
            this.gridApi.showNoRowsOverlay();
          }
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
      this.gridApi.refreshInfiniteCache();
    }
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
      nzTitle: 'User Assigned',
      nzContent: AverageDocumentScoreModal,
      nzData: {
        data: row, // 👈 this is what we’ll read inside modal
        trainingMode: '0',
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

    const actionLabel =
      actionType === 'APPROVED' ? 'Approve' : actionType === 'REJECTED' ? 'Reject' : actionType;
    const actionColor = actionType === 'APPROVED' ? '#28a745' : '#dc3545';

    this.modal.confirm({
      nzTitle: `${actionLabel} Document`,
      nzContent: `<b style="color: ${actionColor}">${actionLabel}</b> the document: ${documentToApprove.documentName}?`,
      nzOnOk: () => {
        const payload = {
          documentId: docId,
          empId: this.loginEmpId,
          action: actionType,
          observation: `${actionType} via post-training screen`, // TODO: Collect via a form/modal wrapper if required by BL-011
        };

        this.isProcessingAction = true;

        this._documentService.AuthorizeDocumentPostTraining(payload).subscribe({
          next: (res) => {
            this.isProcessingAction = false;
            if (res?.Success) {
              this._notificationToastService.createNotification(
                'success',
                'Success',
                `Document ${actionType} successfully.`,
              );
              // Clear the tracked selection state and the grid's own checkbox selection
              // immediately -- don't rely on the approved/rejected row simply disappearing
              // from the next fetch to disable the Approve/Reject buttons.
              this.hasSelectedRows = false;
              if (this.gridApi) {
                this.gridApi.deselectAll();
                this.gridApi.refreshInfiniteCache();
              }
              // Updates the "Training Authorization" sidebar badge.
              this._navigationCountsService.refreshTrainingAuthorizationCount();
            } else {
              this._notificationToastService.createNotification(
                'error',
                'Error',
                res?.Message || 'Failed to authorize document.',
              );
            }
          },
          error: () => {
            this.isProcessingAction = false;
            this._notificationToastService.createNotification(
              'error',
              'Error',
              `Failed to ${actionType} document.`,
            );
          },
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
        trainingMode: '0',
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
        entityType: 'Document',
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

    if (this.gridApi) {
      this.gridApi.refreshInfiniteCache();
    }
  }

  onSelectionChange(selectedRows: any): void {
    this.hasSelectedRows = selectedRows && selectedRows.length > 0;
  }

  getDocumentRequestCounts() {
    const payload = {
      divisionCode: this.selectedDivisions || null,
      departmentCode: this.selectedDepartment || null,
      subDepartmentCode: this.selectedSubDepartment || null,
      businessDomainCode: this.selectedbusinessDomain || null,
      documentTypeCode: this.selectedDocumentType || null,
      documentcategoryfilter: Number(this.selectedAuthorizationStatus) || 1,
      searchText: '',
      isActive: true,
    };

    this._documentService.GetPendingAuthorizationCount(payload).subscribe({
      next: (res: any) => {
        if (res && res.Success && res.Data) {
          this.pendingCount = res.Data.PendingCount ?? 0;
          this.authorizedCount = res.Data.AuthorizedCount ?? 0;
          this.rejectedCount = res.Data.RejectedCount ?? 0;
        }
      },
      error: (err) => console.error('Failed to load authorization counts', err),
    });
  }

  openDocumentModal(rowData: any) {
    this.templateHtml = rowData.proposedContent || '';
    this.currentDocumentName = rowData.documentName || rowData.DocumentName || '';
    let fileUrl = rowData.url || '';

    if (fileUrl && fileUrl.trim()) {
      // This logic is incorrect as it prepends the API base URL.
      // The correct logic uses window.location.origin.
      if (!fileUrl.startsWith('http')) {
        const origin = window.location.origin;
        const relativeUrl = fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl;
        fileUrl = origin + relativeUrl;
      }
      this.draftFileUrl = fileUrl;
    } else {
      this.draftFileUrl = '';
    }

    this.isPdf = false;
    this.isDocx = false;
    this.safeDraftFileUrl = undefined;

    this.modal.create({
      nzTitle: 'Document Content',
      nzContent: this.documentModalTpl,
      nzFooter: null,
      nzWidth: '50%',
      nzStyle: { top: '20px' },
    });
  }

  downloadDraft(): void {
    const idToDownload = this.documentId;
    this._documentService.DownloadDocumentTemplate(idToDownload).subscribe({
      next: (response: any) => {
        const body = response?.body || response;
        let blob: Blob | null = null;

        if (body instanceof Blob) {
          blob = body;
        } else if (body instanceof ArrayBuffer) {
          blob = new Blob([body]);
        }

        if (blob) {
          if (blob.type === 'application/json' || blob.type === 'application/problem+json') {
            blob.text().then((text) => {
              try {
                const res = JSON.parse(text);
                this._notificationToastService.createNotification(
                  'warning',
                  'Draft',
                  res.Message || 'Draft not available.',
                );
              } catch {
                this._notificationToastService.createNotification(
                  'error',
                  'Draft',
                  'Failed to read response.',
                );
              }
            });
            return;
          }

          let filename = `Draft_${this.currentDocumentName || this.documentId}`;
          const contentDisposition =
            response?.headers?.get('content-disposition') ||
            response?.headers?.get('Content-Disposition');
          if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          this._notificationToastService.createNotification(
            'warning',
            'Draft',
            'No drafted file available for download.',
          );
        }
      },
      error: (err: any) => {
        if (
          err.error instanceof Blob &&
          (err.error.type === 'application/json' || err.error.type === 'application/problem+json')
        ) {
          err.error.text().then((text: string) => {
            try {
              const res = JSON.parse(text);
              this._notificationToastService.createNotification(
                'error',
                'Draft',
                res.Message || 'Failed to download draft.',
              );
            } catch {
              this._notificationToastService.createNotification(
                'error',
                'Draft',
                'Failed to download draft.',
              );
            }
          });
        } else {
          console.error('Error downloading draft', err);
          this._notificationToastService.createNotification(
            'error',
            'Draft',
            'Failed to download draft.',
          );
        }
      },
    });
  }
}
