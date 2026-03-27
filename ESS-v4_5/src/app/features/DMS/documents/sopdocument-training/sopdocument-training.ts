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
import { CabinetSelection, ColumnToggle, SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { MyPendingRequestForApproval } from '../my-approval-request/my-pending-request-for-approval/my-pending-request-for-approval';
import { DocumentTrainingService } from '@app/shared/services/document-training.service';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '@app/shared/notification/notification.service';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';

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
    MyPendingRequestForApproval,
    NzModalModule,
  ],
  templateUrl: './sopdocument-training.html',
  styleUrl: './sopdocument-training.css',
})
export class SOPDocumentTraining {
  selectedTab: string = 'Class Room';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';

  totalRows = 0;
  pageSize = 10;
  classRoomData: any[] = [];
  onlineData: any[] = [];
  totalClassRoom = 0;
  totalOnline = 0;

  constructor(
    private _documentTrainingService: DocumentTrainingService,
    private modal: NzModalService,
    private _notification: NotificationService,
  ) {}

  ngOnInit() {
    this.GetAllClassRooms({ pageNumber: 1, pageSize: this.pageSize });
    this.GetAllOnline({ pageNumber: 1, pageSize: this.pageSize });
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  classRoomColumnDefs = [
    { field: 'documentId', headerName: 'Document ID' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version' },
    {
      field: 'documentType',
      headerName: 'Document Type',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
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
    {
      field: 'nextReviewDate',
      headerName: 'Next Review Date',
      cellEditor: 'agDateCellEditor',
      // valueFormatter: (params: ValueFormatterParams<any, Date>) => {
      //   if (!params.value) {
      //     return '';
      //   }
      //   const month = params.value.getMonth() + 1;
      //   const day = params.value.getDate();
      //   return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${
      //     day < 10 ? '0' + day : day
      //   }`;
      // },
      // cellEditorParams: {
      //   max: new Date('2008-12-31'),
      // },
    },
    { field: 'uploadDocument', headerName: 'Upload Document' },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'documentTypeId', label: 'document Type', visible: true },
    { field: 'requestId', label: 'Request Id', visible: true },
    { field: 'documentName', label: 'documentName', visible: true },
    { field: 'viewDocument', label: 'Document Content', visible: true },
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
  }

  GetAllClassRooms(query: any = {}) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.divisionPageSize;
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
          this.totalClassRoom = res.Data.TotalCount;
          this.classRoomData = res.Data.Items.map((item: any) => ({
            ...item,
            documentId: item.DocumentId || item.documentId,
            companyId: item.CompanyId || item.companyId,
            documentName: item.DocumentName || item.documentName,
            version: item.Version || item.version || item.RowVersion || item.rowVersion,
            documentType: item.DocumentType || item.documentType,
            division: item.Division || item.division,
            department: item.Department || item.department,
            subDepartment: item.SubDepartment || item.subDepartment,
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
    const companyId = data.companyId || data.CompanyId || MASTER_DEFAULT_KEYS.COMPANYID;

    this._documentTrainingService
      .GetTrainingAssessmentDetails(docId, companyId)
      .subscribe((res) => {
        if (res?.Success) {
          this.modal.info({
            nzTitle: 'Assessment Details',
            nzContent: `Average Score: ${res.Data?.AverageScore ?? data.averageScore}% <br/><br/> Users Attempted: ${res.Data?.UserCount ?? 'N/A'}`,
            nzWidth: 500,
          });
        } else {
          this._notification.createNotification(
            'error',
            'Error',
            res?.Message || 'Failed to load assessment details.',
          );
        }
      });
  }

  acknowledgeAndSend(data: any) {
    const docId = data.documentId || data.DocumentId || data.Id;
    const companyId = data.companyId || data.CompanyId || MASTER_DEFAULT_KEYS.COMPANYID;
    const avgScore = Number(data.averageScore) || 0;

    if (avgScore < 80) {
      this.modal.confirm({
        nzTitle: 'Warning',
        nzContent: 'Average score is below 80%. Proceed to Authorization?',
        nzOnOk: () => this.executeAcknowledge(docId, companyId),
      });
    } else {
      this.executeAcknowledge(docId, companyId);
    }
  }

  executeAcknowledge(docId: string, companyId: string) {
    this._documentTrainingService
      .AcknowledgeAndSendForAuthorization(docId, companyId)
      .subscribe((res) => {
        if (res?.Success) {
          this._notification.createNotification(
            'success',
            'Success',
            'Document training acknowledged and sent for authorization.',
          );
          this.GetAllOnline({});
        } else {
          this._notification.createNotification(
            'error',
            'Error',
            res?.Message || 'Failed to send for authorization.',
          );
        }
      });
  }

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

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
  }
}
