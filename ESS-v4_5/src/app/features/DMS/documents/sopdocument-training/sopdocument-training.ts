import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, ColumnToggle, SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DocumentTrainingService } from '@app/shared/services/document-training.service';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { RevisionHistoryModal } from '../revision-history-modal/revision-history-modal';
import { DocumentService } from '@app/shared/services/document.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { LinkRenderer } from '@app/shared/ag-grid-renderers/link-renderer/link-renderer';
import { AverageDocumentScoreModal } from '../average-document-score-modal/average-document-score-modal';
import { DocumentTypeService } from '@app/shared/services/documentType.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';

@Component({
  selector: 'app-sopdocument-training',
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
    SafeTranslatePipe,
    CabinetStructureList,
    DocumentTypeList,
    NzModalModule,
    DMSRichTextEdit,
  ],
  templateUrl: './sopdocument-training.html',
  styleUrl: './sopdocument-training.css',
})
export class SOPDocumentTraining implements OnInit, OnDestroy {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('documentModalTpl') documentModalTpl!: TemplateRef<any>;

  private subscriptions: Subscription[] = [];

  selectedTab: string = 'Classroom';

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
  formId = 'trainingsop';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';
  selectedDocumentId: string | null = null;
  isGridVisible = false;
  hasSelectedRows = false;
  pageNumber = 1;

  totalRows = 0;
  pageSize = 10;
  classRoomData: any[] = [];
  onlineData: any[] = [];
  totalClassRoom = 0;
  totalOnline = 0;

  // Tab badge counts -- independent of the grid's own (filtered/paginated) totalClassRoom /
  // totalOnline above, so the badge always reflects the true pending-training count.
  classRoomPendingCount = 0;
  onlinePendingCount = 0;

  documentTypes: any[] = [];
  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 10; // default value

  constructor(
    private _documentTrainingService: DocumentTrainingService,
    private _documentService: DocumentService,
    private _documentTypeService: DocumentTypeService,
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
    private _cabinetHierarchyService: CabinetHierarchyService,
    private _navigationCountsService: NavigationCountsService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
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

      this.classRoomColumnDefs = [
        ...this.leadingColumnDefs,
        ...activeLevelDefs.map((def) => ({ field: def.field, headerName: def.title })),
        ...this.trailingColumnDefs,
      ];

      this.columnToggles = [
        { field: 'documentName', label: 'Document Name', visible: true },
        { field: 'documentNumber', label: 'Document Number', visible: true },
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'version', label: 'Version', visible: true },
        { field: 'trainingMode', label: 'Training Mode', visible: true },
        { field: 'userAssigned', label: 'User Assigned', visible: true },
        { field: 'averageDocumentScore', label: 'Average Document Score', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'url', label: 'URL', visible: true },
        { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
        { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
        { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
        { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
        { field: 'approvalHistory', label: 'Approval History', visible: true },
        { field: 'revisionHistory', label: 'Revision History', visible: true },
      ];
    });

    // 1. First, load the document types list
    this._documentTypeService
      .GetAllDocumentTypes('', 'DESC', 'CreatedAt', true, 1, 1000)
      .subscribe((res) => {
        const items = Array.isArray(res?.Data) ? res.Data : (res?.Data?.Items ?? []);
        const sop = items.find((d: any) => (d.Code || d.code || '').toUpperCase() === 'DT-0001');

        this.documentTypes = items.map((d: any) => ({
          CODE: d.Code || d.code || d.CODE,
          NAME: d.Name || d.name || d.NAME,
        }));

        // 2. Select SOP ("DT-0001") by default
        if (sop) {
          this.selectedDocumentType = sop.Code || sop.code || 'DT-0001';
        } else {
          this.selectedDocumentType = 'DT-0001';
        }

        // 3. Then, load the grid by rendering it
        this.isGridVisible = true;
      });

    // Tab badges reflect the same shared count state the sidebar menu uses (see
    // NavigationCountsService), so this page and the "Training for SOP Documents" menu
    // item never disagree.
    this.subscriptions.push(
      this._navigationCountsService.documentsPendingTrainingCounts$.subscribe((counts) => {
        this.classRoomPendingCount = counts.classroom;
        this.onlinePendingCount = counts.online;
      }),
    );

    this.getTrainingPendingCounts();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getTrainingPendingCounts(): void {
    // Fetches through the shared service; the ngOnInit subscription above applies the result
    // to this page's tab badges, and main-layout's own subscription applies the same result
    // to the "Training for SOP Documents" sidebar badge.
    this._navigationCountsService.refreshDocumentsPendingTrainingCounts();
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subDepartment', label: 'Sub-Department' },
    4: { field: 'businessdomain', label: 'Business Domain' },
  };

  // Columns before the cabinet (Division/Department/...) columns
  private readonly leadingColumnDefs: ColDef[] = [
    { field: 'documentId', headerName: 'Document ID', hide: true },
    { field: 'documentNumber', headerName: 'Document Number' },
    {
      field: 'documentName',
      headerName: 'Document Name',
      editable: false, 
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        return `
          <span
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
                ${params.value || 'View'}
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        this.openDocumentModal(event.data);
      },
    },
    { field: 'documentType', headerName: 'Document Type', },
    { field: 'version', headerName: 'Version', flex: 1 },
    { field: 'trainingMode', headerName: 'Training Mode' },
    {
      field: 'userAssigned',
      headerName: 'User Assigned',
      flex: 1,
      cellRendererSelector: (params: any) => ({
        component: LinkRenderer,
        params: {
          label: params.value ?? 'View',
          onClick: () => {
            this.openTrainingProofModal(params.data);
          },
        },
      }),
    },
    {
      field: 'averageDocumentScore',
      headerName: 'Average Document Score',
      flex: 1,
      cellRendererSelector: (params: any) => ({
        component: LinkRenderer,
        params: {
          label: params.value ?? 'View',
          onClick: () => {
            this.openAverageScoreModal(params.data);
          },
        },
      }),
    },
  ];

  // Columns after the cabinet (Division/Department/...) columns
  private readonly trailingColumnDefs: ColDef[] = [
    {
      field: 'url',
      headerName: 'Url',
      editable: false,
      flex: 1,
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
    { field: 'requestCreatedBy', headerName: 'Request Created By', cellClass: 'audit-cell', minWidth: 150, flex: 1 },
    { field: 'requestCreatedOn', headerName: 'Request Created On', cellClass: 'audit-cell', minWidth: 150, flex: 1 },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On', minWidth: 150, flex: 1 },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By', minWidth: 150, flex: 1 },
    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      editable: false,
      minWidth: 120,
      flex: 1,
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
        this.openWorkflowDeatilsModal(event.data);
      },
    },
    {
      field: 'revisionHistory',
      headerName: 'Revision History',
      editable: false,
      minWidth: 120,
      flex: 1,
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        return `
        <span
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          Revision History
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openRevisionHistoryModal(event.data);
      },
    },
  ];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out
  // showing just the fixed columns until we know which levels are enabled.
  classRoomColumnDefs: ColDef[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit) alongside classRoomColumnDefs.
  columnToggles?: ColumnToggle[] = [
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'documentNumber', label: 'Document Number', visible: true },
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'version', label: 'Version', visible: true },
    { field: 'trainingMode', label: 'Training Mode', visible: true },
    { field: 'userAssigned', label: 'User Assigned', visible: true },
    { field: 'averageDocumentScore', label: 'Average Document Score', visible: true },
    { field: 'url', label: 'URL', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
    { field: 'revisionHistory', label: 'Revision History', visible: true },
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

  onDocumentTypeChange(value: any): void {
    this.selectedDocumentType = value;
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.fetchDataForCurrentTab();
    }
  }

  GetAllClassRooms(query: any = {}) {
    let searchText = '';
    let sortColumn = '';
    let sortBy = 'DESC';

    // If grid triggers the query, extract pagination parameters
    if (query && typeof query === 'object') {
      if (query.pageNumber) this.pageNumber = query.pageNumber;
      if (query.pageSize) this.selectedPageSize = query.pageSize;
      searchText = query.searchText || '';
      if (query.sortModel && query.sortModel.length > 0) {
        sortColumn = query.sortModel[0].colId;
        sortBy = query.sortModel[0].sort?.toUpperCase() || 'DESC';
      }
    } else {
      // Otherwise, reset to page 1 for fresh filters
      this.pageNumber = 1;
    }

    const pageNumber = this.pageNumber || 1;
    const pageSize = this.selectedPageSize || this.divisionPageSize || 10;

    const payload = {
      searchtext: searchText,
      sortby: sortBy,
      sortcolumn: sortColumn,
      isactive: true,
      pagenumber: pageNumber,
      pagesize: pageSize,
      divisioncode: this.selectedDivisions || '',
      departmentcode: this.selectedDepartment || '',
      subdepartmentcode: this.selectedSubDepartment || '',
      businessdomaincode: this.selectedBusinessDomain || '',
      documenttypecode: this.selectedDocumentType || '',
      Requeststatus: this.selectedTab,
    };

    this._documentService
      .GetDocumentsPendingTrainingAcknowledgmentAsync(payload)
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalClassRoom = res.Data.TotalCount;
          this.classRoomData = res.Data.Items.map((item: any) => ({
            ...item,
            Id: item.id || item.Id,
            requestId: item.requestId || item.RequestId,
            trainingMode: 'Class Room', //item.TrainingMode || item.trainingMode || (item.LmsStatus ? 'Online' : 'Class Room'),
            averageDocumentScore: item.averagescore || item.averagescore || 0,
            userAssigned: item.totalassigned || item.totalassigned,
            companyId: item.companyId || item.CompanyId,
            company: item.Company || item.company,
            requestNumber: item.RequestNumber || item.requestNumber,
            documentTypeCode: item.DocumentTypeCode || item.documenttypecode,
            documentType: item.DocumentType || item.documenttype,
            proposedDocumentNumber: item.RequestNumber || item.requestNumber || item.documentnumber,
            division: item.Division || item.division,
            divisionCode: item.DivisionCode || item.divisionCode || item.divisioncode,
            documentId: item.documentid || item.documentid,
            documentNumber: item.DocumentNumber || item.documentnumber,
            documentName: item.DocumentName || item.documentname || item.title,
            proposedContent:
              item.ProposedContent ||
              item.proposedcontent ||
              item.VersionContent ||
              item.versioncontent ||
              item.content,
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
            status: item.IsReworked ? 'Reverted' : 'Draft',
            createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdat || ''),
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
          this.classRoomData = [];
          this.totalClassRoom = 0;
        }
      });
  }

  GetAllOnline(query: any = {}) {
    let searchText = '';
    let sortColumn = '';
    let sortBy = 'DESC';

    // If grid triggers the query, extract pagination parameters
    if (query && typeof query === 'object') {
      if (query.pageNumber) this.pageNumber = query.pageNumber;
      if (query.pageSize) this.selectedPageSize = query.pageSize;
      searchText = query.searchText || '';
      if (query.sortModel && query.sortModel.length > 0) {
        sortColumn = query.sortModel[0].colId;
        sortBy = query.sortModel[0].sort?.toUpperCase() || 'DESC';
      }
    } else {
      // Otherwise, reset to page 1 for fresh filters
      this.pageNumber = 1;
    }

    const pageNumber = this.pageNumber || 1;
    const pageSize = this.selectedPageSize || this.divisionPageSize || 10;

    const payload = {
      searchtext: searchText,
      sortby: sortBy,
      sortcolumn: sortColumn,
      isactive: true,
      pagenumber: pageNumber,
      pagesize: pageSize,
      divisioncode: this.selectedDivisions || '',
      departmentcode: this.selectedDepartment || '',
      subdepartmentcode: this.selectedSubDepartment || '',
      businessdomaincode: this.selectedBusinessDomain || '',
      documenttypecode: this.selectedDocumentType || '',
      requeststatus: this.selectedTab,
    };

    this._documentService
      .GetDocumentsPendingTrainingAcknowledgmentAsync(payload)
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalOnline = res.Data.TotalCount;
          this.onlineData = res.Data.Items.map((item: any) => ({
            ...item,
            Id: item.id || item.Id,
            requestId: item.requestId || item.RequestId,
            trainingMode: 'Online',
            averageDocumentScore: item.averagescore || item.averagescore || 0,
            userAssigned: item.totalassigned || item.totalassigned,
            companyId: item.companyId || item.CompanyId,
            company: item.Company || item.company,
            requestNumber: item.RequestNumber || item.requestNumber,
            documentTypeCode: item.DocumentTypeCode || item.documenttypecode,
            documentType: item.DocumentType || item.documenttype,
            proposedDocumentNumber: item.RequestNumber || item.requestNumber || item.documentnumber,
            division: item.Division || item.division,
            divisionCode: item.DivisionCode || item.divisionCode || item.divisioncode,
            documentId: item.DocumentNumber || item.documentid,
            documentNumber: item.DocumentNumber || item.documentnumber,
            documentName: item.DocumentName || item.documentname || item.title,
            proposedContent:
              item.ProposedContent ||
              item.proposedcontent ||
              item.VersionContent ||
              item.versioncontent ||
              item.content,
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
            status: item.IsReworked ? 'Reverted' : 'Draft',
            createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdat || ''),
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
          this.onlineData = [];
          this.totalOnline = 0;
        }
      });
  }

  viewAssessmentDetails(data: any) {
    const docId = data.documentId || data.DocumentId || data.Id;
    const trainingMode = this.selectedTab === 'Classroom' ? '1' : '2';
    this._documentTrainingService
      .GetTrainingAssessmentDetails(docId, trainingMode)
      .subscribe((res) => {
        if (res?.Success) {
          let usersHtml = '';
          if (res.Data?.Users && Array.isArray(res.Data.Users) && res.Data.Users.length > 0) {
            usersHtml =
              '<ul style="margin-left: 20px; padding-left: 0;">' +
              res.Data.Users.map(
                (u: any) =>
                  `<li>${u.Name || u.name} - <strong>${u.Score || u.score}%</strong></li>`,
              ).join('') +
              '</ul>';
          } else {
            usersHtml = `<p>Users Attempted: ${res.Data?.UserCount ?? 'N/A'}</p>`;
          }

          this.modal.info({
            nzTitle: 'Assessment Details',
            nzContent: `
            <p><strong>Average Score:</strong> ${res.Data?.AverageScore ?? data.averageScore}%</p>
            <p><strong>User Performance:</strong></p>
            ${usersHtml}
          `,
            nzWidth: 500,
          });
        } else {
          this._notificationToastService.createNotification(
            'error',
            'Error',
            res?.Message || 'Failed to load assessment details.',
          );
        }
      });
  }

  acknowledgeAndSend(data: any) {
    const docId = data.documentId || data.DocumentId || data.Id;
    const avgScore = Number(data.averageScore) || 0;
    // Assuming data.participation exists to check if participation < 100%
    // If not returned by your grid endpoint, you may just leave it checking avgScore.
    const participation = Number(data.participation ?? 100);

    if (avgScore < 80 || participation < 100) {
      this.modal.confirm({
        nzTitle: 'Warning',
        nzContent:
          'Warning: Average score is below 80% or participation is incomplete. Proceed to Authorization?',
        nzOnOk: () => this.executeAcknowledge(docId),
      });
    } else {
      this.executeAcknowledge(docId);
    }
  }

  executeAcknowledge(docId: string) {
    this._documentTrainingService.AcknowledgeAndSendForAuthorization(docId).subscribe((res) => {
      if (res?.Success) {
        this._notificationToastService.createNotification(
          'success',
          'Success',
          'Document training acknowledged and sent for authorization.',
        );
        this.GetAllOnline({});
      } else {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          res?.Message || 'Failed to send for authorization.',
        );
      }
    });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
    this.selectedPageSize = pageSize;

    switch (gridId) {
      case 'documentGrid':
        this.divisionPageSize = pageSize;
        this.GetAllClassRooms({
          pageNumber: 1,
          pageSize: pageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'onlineGrid':
        this.employeePageSize = pageSize;
        this.GetAllOnline({
          pageNumber: 1,
          pageSize: pageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      default:
        break;
    }
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.fetchDataForCurrentTab();
    }
  }

  fetchDataForCurrentTab() {
    if (this.selectedTab === 'Classroom' || this.selectedTab === 'Class Room') {
      this.GetAllClassRooms({});
    } else if (this.selectedTab === 'Online') {
      this.GetAllOnline({});
    }
  }

  openWorkflowDeatilsModal(rowData: any) {
    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.requestid || rowData.RequestId,
        entityType: 'Request',
        decision:'Approved'
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  openRevisionHistoryModal(rowData: any): void {
    this.modal.create({
      nzTitle: 'Revision History',
      nzContent: RevisionHistoryModal,
      nzData: {
        data: rowData, // 👈 this is what we’ll read inside modal
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });
  }

  openTrainingProofModal(row: any): void {
    // TODO: Implement logic to open training proof file/report
    this.modal.create({
      nzTitle: 'User Assigned',
      nzContent: AverageDocumentScoreModal,
      nzData: {
        data: row, // 👈 this is what we’ll read inside modal
        trainingMode: this.selectedTab === 'Classroom' ? '1' : '2',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });
  }

  openAverageScoreModal(row: any): void {
    this.modal.create({
      nzTitle: 'Average Document Score',
      nzContent: AverageDocumentScoreModal,
      nzData: {
        data: row, // 👈 this is what we’ll read inside modal
        trainingMode: this.selectedTab === 'Classroom' ? '1' : '2',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: '70%',
    });
  }

  onSelectionChange(selectedRows: any[]): void {
    this.hasSelectedRows = selectedRows && selectedRows.length > 0;
    if (selectedRows && selectedRows.length > 0) {
      this.selectedDocumentId =
        selectedRows[0].documentId || selectedRows[0].DocumentId || selectedRows[0].Id;
    } else {
      this.selectedDocumentId = null;
    }
  }

  approve() {
    if (!this.selectedDocumentId) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a document to approve.',
      );
      return;
    }

    this._documentTrainingService
      .AcknowledgeAndSendForAuthorization(this.selectedDocumentId)
      .subscribe({
        next: (response) => {
          if (response?.Success) {
            this._notificationToastService.createNotification(
              'success',
              'Request',
              response.Message,
            );
            this.selectedDocumentId = null;
            // Clear both the tracked selection state and the grid's own checkbox
            // selection immediately — don't rely on the approved record simply
            // disappearing from the next fetch to disable the Approve button.
            this.hasSelectedRows = false;
            this.agGridWrapper?.gridApi?.deselectAll();
            if (this.agGridWrapper) {
              // Server-side (infinite-model) grid: refresh() invalidates AG Grid's
              // own cache and re-requests data, unlike calling GetAllClassRooms()
              // directly, which only updates the parent's array without AG Grid
              // ever re-pulling it — the grid kept showing the stale, pre-approval
              // rows even though the fetch itself succeeded.
              this.agGridWrapper.refresh();
            } else {
              this.GetAllClassRooms({});
            }
            this.getTrainingPendingCounts();
          }
        },
        error: (err) => {
          this._notificationToastService.createNotification(
            'error',
            'Request',
            err.error?.Message || 'Failed to take action on the request.',
            // 'Failed to create workflow step.',
          );
        },
      });
  }

  openDocumentModal(rowData: any) {
    this.templateHtml = rowData.proposedContent || '';
    this.documentId = rowData.Id;
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

    if (this.draftFileUrl) {
      // A real file exists -- download it directly instead of routing through a modal
      // whose only content in that case was a "Download Document" button.
      this.downloadDraft();
      return;
    }

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
