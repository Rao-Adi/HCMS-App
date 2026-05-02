import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
  ],
  templateUrl: './sopdocument-training.html',
  styleUrl: './sopdocument-training.css',
})
export class SOPDocumentTraining {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

  selectedTab: string = 'Class Room';

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

  pageNumber = 1;

  totalRows = 0;
  pageSize = 10;
  classRoomData: any[] = [];
  onlineData: any[] = [];
  totalClassRoom = 0;
  totalOnline = 0;

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  constructor(
    private _documentTrainingService: DocumentTrainingService,
    private _documentService: DocumentService,
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  classRoomColumnDefs = [
    { field: 'documentId', headerName: 'Document ID', hide: true },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'version', headerName: 'Version' },
    { field: 'trainingMode', headerName: 'Training Mode' },
    { field: 'userAssigned', headerName: 'User Assigned' },
    { field: 'averageDocumentScore', headerName: 'Average Document Score' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'url', headerName: 'URL' },
    { field: 'requestCreatedBy', headerName: 'Request Created By' },
    { field: 'requestCreatedOn', headerName: 'Request Created On' },
    { field: 'preVersionOn', headerName: 'Prev. Version On' },
    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      editable: false,
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
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'documentType', label: 'Document Type', visible: true },
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
    { field: 'preVersionOn', label: 'Prev. Version On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
    { field: 'revisionHistory', label: 'Revision History', visible: true },
  ];

  onlineColumnDefs = [
    { field: 'documentId', headerName: 'Document ID' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version Number' },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'lmsStatus', headerName: 'LMS Status' },
    {
      field: 'averageScore',
      headerName: 'Average Score (%)',
      cellRenderer: (params: any) => {
        return `<span style="color:#1976d2; cursor:pointer; text-decoration:underline" data-action="view-score">${params.value != null ? params.value : 0}%</span>`;
      },
      onCellClicked: (event: any) => {
        if (event.event.target.getAttribute('data-action') === 'view-score') {
          this.viewAssessmentDetails(event.data);
        }
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      cellRenderer: (params: any) => {
        return `<button class="ant-btn ant-btn-primary ant-btn-sm" data-action="acknowledge">Acknowledge & Send</button>`;
      },
      onCellClicked: (event: any) => {
        if (event.event.target.getAttribute('data-action') === 'acknowledge') {
          this.acknowledgeAndSend(event.data);
        }
      },
    },
  ];

  companies: SelectList[] = [
    { CODE: '1', NAME: 'ATCO' },
    { CODE: '2', NAME: 'Softronic' },
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
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
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
        sortBy = query.sortModel[0].sort;
      }
    } else {
      // Otherwise, reset to page 1 for fresh filters
      this.pageNumber = 1;
    }

    const payload = {
      searchtext: searchText,
      sortby: sortBy,
      sortcolumn: sortColumn,
      isactive: true,
      pagenumber: this.pageNumber,
      pagesize: this.selectedPageSize || 10,
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
          this.totalClassRoom = res.Data.TotalCount;
          this.classRoomData = res.Data.Items.map((item: any) => ({
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
            proposedDocumentNumber: item.RequestNumber || item.requestNumber || item.documentnumber,
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
            createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdat || ''),
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
          this.classRoomData = [];
          this.totalClassRoom = 0;
        }
      });
  }

  GetAllOnline(query: any = {}) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.employeePageSize;
    const searchText = query?.searchText || '';

    this._documentTrainingService
      .GetAllDocumentTrainings(
        searchText,
        sort?.sort?.toUpperCase() || 'DESC',
        sort?.colId || 'Id',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalOnline = res.Data.TotalCount;
          this.onlineData = res.Data.Items.map((item: any) => ({
            ...item,
            documentId: item.DocumentId || item.documentId || item.Id || item.id,
            companyId: item.CompanyId || item.companyId,
            documentName: item.DocumentName || item.documentName,
            version: item.Version || item.version || item.RowVersion || item.rowVersion,
            documentType: item.DocumentType || item.documentType,
            division: item.Division || item.division,
            department: item.Department || item.department,
            subDepartment: item.SubDepartment || item.subDepartment,
            lmsStatus: item.LmsStatus || item.lmsStatus || 'Completed',
            averageScore: item.AverageScore || item.averageScore || 0,
          }));
        } else {
          this.onlineData = [];
          this.totalOnline = 0;
        }
      });
  }

  viewAssessmentDetails(data: any) {
    const docId = data.documentId || data.DocumentId || data.Id;

    this._documentTrainingService.GetTrainingAssessmentDetails(docId).subscribe((res) => {
      if (res?.Success) {
        let usersHtml = '';
        if (res.Data?.Users && Array.isArray(res.Data.Users) && res.Data.Users.length > 0) {
          usersHtml =
            '<ul style="margin-left: 20px; padding-left: 0;">' +
            res.Data.Users.map(
              (u: any) => `<li>${u.Name || u.name} - <strong>${u.Score || u.score}%</strong></li>`,
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

    switch (gridId) {
      case 'classroomGrid':
        this.divisionPageSize = pageSize;
        this.GetAllClassRooms({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'onlineGrid':
        this.employeePageSize = pageSize;
        this.GetAllOnline({
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

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    }
  }

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.id,
        entityType: 'Request',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  onSelectionChange(selectedRows: any[]): void {
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
            this.GetAllClassRooms({}); // Refresh the grid
            this.selectedDocumentId = null; // Clear the selection
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
}
