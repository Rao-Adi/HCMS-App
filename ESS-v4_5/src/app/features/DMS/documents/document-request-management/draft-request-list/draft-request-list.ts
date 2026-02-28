import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { CabinetSelection, ColumnToggle } from '@app/shared/interfaces/interfaces';
import { NotificationService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { UserService } from '@app/shared/services/user-service';
import { ColDef } from 'ag-grid-community';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { DocumentRequestForm } from '../document-request-form/document-request-form';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DRUsersComponent } from '../drusers-component/drusers-component';
import { DRDistributionList } from '../drdistribution-list/drdistribution-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';

export enum DocumentRequestStatus {
  Draft = 0,
  Submitted = 1,
  InApproval = 2,
  Approved = 3,
  Rejected = 4,
}

@Component({
  selector: 'app-draft-request-list',
  imports: [
    CommonModule,
    FormsModule,
    AgGridWrapper,
    SafeTranslatePipe,
    NzSelectModule,
    DRDistributionList,
    DRUsersComponent,
    DMSRichTextEdit,
    CabinetStructureList,
  ],
  templateUrl: './draft-request-list.html',
  styleUrl: './draft-request-list.css',
})
export class DraftRequestList {
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: true,
  };

  selectedDraftRequest: any;
  showExclusionTable = false;
  employees: any[] = [];
  selectedEmployee?: string = '';
  selectedStatus: number = 0;
  documentRequestsData: any[] = [];
  approvalSequenceData: any[] = [];
  distributionListPayload: any[] = [];
  distributionUserList: any[] = [];

  selectedCompany: string ='';
  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType: string = '';
  inputJustificationValue?: string;
  documentName?: string = '';
  templateHtml: string = '';

  selectedPageSize = 1; // default value

  requestId: number = 0;
  submittedby: number = 0;
  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;

  DocumentRequestStatusOptions = [
    { value: DocumentRequestStatus.Draft, label: 'Draft' },
    { value: DocumentRequestStatus.Submitted, label: 'Submitted' },
    { value: DocumentRequestStatus.InApproval, label: 'In Approval' },
    { value: DocumentRequestStatus.Approved, label: 'Approved' },
    { value: DocumentRequestStatus.Rejected, label: 'Rejected' },
  ];

  documentColumnDefs = [
    {
      field: 'id',
      headerName: 'Id',
      hide: true,
    },
     {
      field: 'companyId',
      headerName: 'companyId',
      hide: true,
    },
    {
      field: 'requestNumber',
      headerName: 'RequestNumber',
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
      field: 'subdepartment',
      headerName: 'Sub-Department',
    },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentName', headerName: 'Document Title' },
    { field: 'justification', headerName: 'Justification' },
    { field: 'createdOn', headerName: 'Created On', flex:1 },
    { field: 'sumbittedby', headerName: 'sumbittedby', hide: true },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'requestNumber', label: 'Request Id', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Title', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'createdOn', label: ' Created On', visible: true },
  ];

  constructor(
    private _doumentRequestService: DocumentRequestService,
    private _notification: NotificationService,
    private _userService: UserService,
  ) {}

  ngOnInit() {
    this.getAllUsersList();
  }

  GetAllDraftDocuments() {
    const companyId = MASTER_DEFAULT_KEYS.COMPANYID;
    const employeeCode = this.selectedEmployee;

    this._doumentRequestService.getMyDraftDocumentRequest(companyId, employeeCode).subscribe({
      next: (response) => {
        if (response?.Data) {
          this.totalRows = response.Data.TotalCount;
          this.documentRequestsData = response.Data.map((item: any) => ({
            Id: item.id || item.Id,
            companyId : item.companyId || item.CompanyId,
            requestNumber: item.RequestNumber || item.requestNumber,
            documentType: item.DocumentType || item.documentType,
            proposedDocumentNumber: item.RequestNumber || item.requestNumber,
            stepId: item.StepId || item.stepId,
            stepOrder: item.StepOrder || item.stepOrder,
            startedAt: item.StartedAt || item.startedAt,
            division: item.Division,
            documentId: item.DocumentNumber,
            documentName: item.DocumentName,
            proposedContent: item.ProposedContent,
            department: item.Department,
            departmentId: item.DepartmentCode,
            subdepartment: item.SubDepartment,
            justification: item.Justification,
            businessdomainId: item.BusinessDomainCode,
            pendingWith: item.CurrentAssignedUser,
            sumbittedby: item.CreatedBy,
            createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.CreatedAt || ''),
            requestCreatedOn: new CustomDateFormatPipe().transform(
              item.createdAt || item.CreatedAt || '',
            ),
            previousVersionCreatedOn:
              item.draftContentLastModifiedAt || item.DraftContentLastModifiedAt || '',
            proposedVersionNumber: item.RowVersion || item.rowVersion,
            distributionListPayload: item.DistributionList,
            distributionUserList: item.UserList,
          }));
        } else {
        }
      },
      error: (err) => {
        this._notification.createNotification(
          'error',
          'Error',
          err?.Message || 'Failed to fetch draft documents.',
        );
      },
    });
  }

  getAllUsersList = () => {
    this._userService.getUserList().subscribe((res) => {
      if (res?.Data) {
        this.employees = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
      } else {
        this.employees = [];
      }
    });
  };

  GetAllDocuments(query: any) {}

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
  }

  onDistributionChanged(list: any[]) {
    const cleanList = list.map((x) => ({
      divisionCode: x.level1Id,
      departmentCode: x.level2Id,
      subDepartmentCode: x.level3Id,
      businessDomainCode: x.level4Id,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId,
    }));
    this.distributionListPayload = cleanList;
  }

  onEmployeeChange(value: string): void {
    this.selectedEmployee = value;
    if (value != null) {
      this.GetAllDraftDocuments();
    }
  }
  onStatusChange(value: number): void {
    this.selectedStatus = value;
  }

  onSelectionChange(selectedRows: any): void {
    this.requestId = selectedRows[0].id;
    this.submittedby = selectedRows[0].sumbittedby;
    // this.hasSelectedRows = selectedRows && selectedRows.length > 0;
    // this.templateHtml = selectedRows[0]?.proposedContent || '';
    // this.stepId = selectedRows[0]?.stepId || 0; // Assuming stepId is part of rowData
  }

  onCellClicked(event: any): void {
    const row = event.data;
    debugger;
    this.selectedDraftRequest = row;

    this.requestId = row.Id;
    this.submittedby = row.sumbittedby;
    this.selectedCompany = row.companyId;
    // ✅ Populate form fields
    this.documentName = row.documentName;
    this.inputJustificationValue = row.justification;
    this.templateHtml = row.proposedContent;
    this.selectedDocumentType = row.documentType;
    this.selectedDivisions = row.division;
    this.selectedDepartment = row.department;
    this.selectedSubDepartment = row.subdepartment;
    this.selectedBusinessDomain = row.businessdomainId;

    // ✅ Populate Distribution List
    this.distributionListPayload = row.distributionListPayload || [];

    // ✅ Populate Users
    this.distributionUserList = row.distributionUserList || [];

    console.log('Distribution:', this.distributionListPayload);
    console.log('Users:', this.distributionUserList);
  }

  SubmiteDocumentRequests() {
    debugger;
    const payLoad = {
      CompanyId: this.selectedCompany,
      requestid:  this.requestId ,
      submittedby: 1, // this will be bind with UserId
      distributionlist: this.distributionListPayload,
      userlist: [],
    };

    this._doumentRequestService.SubmitDraftDocumentRequest(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notification.createNotification(
            'success',
            'User',
            'Document submitted successfully!',
          );
          this.GetAllDraftDocuments();
        }
      },
      error: (err) => {
        this._notification.createNotification('error', 'Error', 'Failed to submit document.');
      },
    });
  }

  UpdateDocumentRequests() {
    debugger;
    const payLoad = {
      companyId: this.selectedCompany,
      requestid:  this.requestId , 
      documentname: this.documentName || '',
      justification: this.inputJustificationValue || '',
      proposedcontent: this.templateHtml || '', 
      modifiedbyuserid: 1, // this will be bind with UserId
      distributionlist: this.distributionListPayload,
      userlist: [],
    };

    this._doumentRequestService.UpdateDraftDocumentRequest(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notification.createNotification(
            'success',
            'User',
            'Document updated successfully!',
          );
          this.GetAllDraftDocuments();
        }
      },
      error: (err) => {
        this._notification.createNotification('error', 'Error', 'Failed to submit document.');
      },
    });
  }
}
