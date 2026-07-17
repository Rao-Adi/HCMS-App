import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { CabinetSelection, ColumnToggle } from '@app/shared/interfaces/interfaces'; 
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { ColDef } from 'ag-grid-community';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { DRUsersComponent } from '../drusers-component/drusers-component';
import { DRDistributionList } from '../drdistribution-list/drdistribution-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { NotificationToastService } from '@app/shared/notification/notification.service';
 
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
    NzSwitchModule,
    DRDistributionList,
    DRUsersComponent,
    DMSRichTextEdit,
  ],
  templateUrl: './draft-request-list.html',
  styleUrl: './draft-request-list.css',
})
export class DraftRequestList {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'create-update-document';

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
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

  selectedCompany: string = '';
  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType: string = '';
  selectedDocumentTypeCode: string = '';
  inputJustificationValue?: string;
  documentName?: string = '';
  templateHtml: string = '';
  selectedTemplateType: string = '';
  templateFileUrl: string = '';
  draftFileUrl: string = '';
  draftFile: File | null = null;

  requestId: number = 0;
  submittedby: number = 0;
  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

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
      headerName: 'Request Number',
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
    { field: 'createdOn', headerName: 'Last Saved On', cellClass: 'audit-cell' },
    {
      field: 'status',
      headerName: 'Status',
      editable: false,
      cellRenderer: (params: any) => {
        return `
          <span 
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
            ${params.value}
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        this.openObservationModal(event.data);
      },
    },
    { field: 'submittedby', headerName: 'Submitted By', hide: true },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'requestNumber', label: 'Request Number', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Title', visible: true },
    { field: 'justification', label: 'Justification', visible: true },
    { field: 'createdOn', label: 'Last Saved On', visible: true },
    { field: 'status', label: 'Status', visible: true },
  ];

  constructor(
    private modal: NzModalService,
    private _doumentRequestService: DocumentRequestService,
    private _notificationToasService: NotificationToastService,
    private _peoplePartnerService: PeoplePartnersService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      // this.getAllUsersList();
    });
  }

  GetAllDraftDocuments(query?: any) {
    const searchText = query?.searchText || query?.filterModel?.fname?.filter || '';

    if (query && typeof query === 'object') {
      this.currentGridQuery = query;
    } else {
      this.currentGridQuery.pageNumber = 1;
    }

    const sortModel = this.currentGridQuery.sortModel || [];
    let sortBy = 'DESC'; // Default sort order
    let sortColumn = 'Id'; // Default sort column (adjust if you have a different default column)
    if (sortModel.length > 0) {
      sortColumn = sortModel[0].colId;
      sortBy = sortModel[0].sort === 'asc' ? 'ASC' : 'DESC';
    }

    const payload = {
      status: 0, // 0 = Draft
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {}, 
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: searchText || '',
    };

    this._doumentRequestService.getMyDraftDocumentRequest(payload).subscribe({
      next: (response) => {
        if (response?.Success || response?.Data) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.documentRequestsData = items.map((item: any) => ({
            Id: item.id || item.Id,
            companyId: item.companyId || item.CompanyId,
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
            documentTypeCode: item.DocumentTypeCode || item.documentTypeCode,
            pendingWith: item.CurrentAssignedUser,
            sumbittedby: item.CreatedBy,
            status: item.IsReworked ? 'Reworked' : 'Draft',
            createdOn: new CustomDateFormatPipe().transform(item.CreatedAt || item.CreatedAt || ''),
            requestCreatedOn: new CustomDateFormatPipe().transform(
              item.createdAt || item.CreatedAt || '',
            ),
            previousVersionCreatedOn:
              item.draftContentLastModifiedAt || item.DraftContentLastModifiedAt || '',
            proposedVersionNumber: item.RowVersion || item.rowVersion,
            templateType: item.TemplateType || item.templateType,
            templateFileUrl: item.TemplateFileURL || item.templateFileUrl,
            draftFileUrl:
              item.DraftFileUrl ||
              item.draftFileUrl ||
              (String(item.TemplateType || item.templateType) === '1' ||
              String(item.TemplateType || item.templateType) === '2'
                ? item.ProposedContent
                : ''),
            // Map backend fields back to the frontend keys expected by the component
            distributionListPayload: (item.DistributionList || []).map((x: any) => ({
              ...x,
              level1Id: x.divisionCode || x.DivisionCode || x.level1Id,
              level2Id: x.departmentCode || x.DepartmentCode || x.level2Id,
              level3Id: x.subDepartmentCode || x.SubDepartmentCode || x.level3Id,
              level4Id: x.businessDomainCode || x.BusinessDomainCode || x.level4Id,
              roleId: x.roleId || x.RoleId,
              distributiontypeId:
                x.distributionTypeId || x.DistributionTypeId || x.distributiontypeId,
            })),
            distributionUserList: item.UserList,
          }));
        } else {
          this.documentRequestsData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this.documentRequestsData = [];
        this.totalRows = 0;
        this._notificationToasService.createNotification(
          'error',
          'Error',
          err?.Message || 'Failed to fetch draft documents.',
        );
      },
    });
  }

  getAllUsersList = () => {
    this._peoplePartnerService.GetEmployeeList().subscribe((res) => {
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

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.pageSize = event.pageSize;
      this.currentGridQuery.pageSize = this.pageSize;
    }
  }

  onDistributionChanged(list: any[]) {
    // Maintain frontend format to avoid breaking the UI bindings
    this.distributionListPayload = list;
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
    this.selectedDraftRequest = row;

    this.requestId = row.Id;
    this.submittedby = row.sumbittedby;
    this.selectedCompany = row.companyId;
    // ✅ Populate form fields
    this.documentName = row.documentName;
    this.inputJustificationValue = row.justification;
    this.templateHtml = row.proposedContent;
    this.selectedTemplateType = row.templateType?.toString() || '';
    this.templateFileUrl = row.templateFileUrl || '';
    this.draftFileUrl = row.draftFileUrl || '';
    this.selectedDocumentType = row.documentType;
    this.selectedDocumentTypeCode = row.documentTypeCode || '';
    this.selectedDivisions = row.division;
    this.selectedDepartment = row.department;
    this.selectedSubDepartment = row.subdepartment;
    this.selectedBusinessDomain = row.businessdomainId;

    // ✅ Populate Distribution List
    this.distributionListPayload = row.distributionListPayload || [];

    // ✅ Populate Users
    this.distributionUserList = row.distributionUserList || [];

    // console.log('Distribution:', this.distributionListPayload);
    // console.log('Users:', this.distributionUserList);
  }

  downloadDraft(): void {
    if (!this.requestId) {
      this._notificationToasService.createNotification(
        'warning',
        'Draft',
        'No drafted file available for download.',
      );
      return;
    }

    this._doumentRequestService.DownloadDraftDocument(this.requestId).subscribe({
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
                this._notificationToasService.createNotification(
                  'warning',
                  'Template',
                  res.Message || 'Template not available.',
                );
              } catch {
                this._notificationToasService.createNotification(
                  'error',
                  'Template',
                  'Failed to read response.',
                );
              }
            });
            return;
          }

          let filename = `Template_${this.selectedDocumentType}`;
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
          const url =
            typeof response?.Data === 'string'
              ? response.Data
              : response?.Data?.TemplateFileURL ||
                response?.Data?.templateFileUrl ||
                this.templateFileUrl;
          if (url) {
            window.open(url, '_blank');
          } else {
            this._notificationToasService.createNotification(
              'warning',
              'Template',
              'No file template available for download.',
            );
          }
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
              this._notificationToasService.createNotification(
                'error',
                'Template',
                res.Message || 'Failed to download template.',
              );
            } catch {
              this._notificationToasService.createNotification(
                'error',
                'Template',
                'Failed to download template.',
              );
            }
          });
        } else {
          console.error('Error downloading template', err);
          this._notificationToasService.createNotification(
            'error',
            'Template',
            'Failed to download template.',
          );
        }
      },
    });
  }

  onDraftFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList && fileList.length > 0) {
      this.draftFile = fileList[0];
    } else {
      this.draftFile = null;
    }
  }

  SubmiteDocumentRequests() {
    const cleanDistributionList = this.distributionListPayload.map((x: any) => ({
      divisionCode: x.level1Id || x.divisionCode,
      departmentCode: x.level2Id || x.departmentCode,
      subDepartmentCode: x.level3Id || x.subDepartmentCode,
      businessDomainCode: x.level4Id || x.businessDomainCode,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId || x.distributionTypeId,
    }));

    const userids = this.distributionUserList
      .map(
        (u: any) =>
          u.employeeCode ||
          u.EmployeeCode ||
          u.empcode ||
          u.empid ||
          u.userId ||
          u.UserId ||
          u.id ||
          u.Id,
      )
      .filter((code) => code != null && code !== '')
      .map(String);

    // Reverted back to JSON to resolve 415 Unsupported Media Type
    const payload = {
      CompanyId: this.selectedCompany,
      RequestId: this.requestId, 
      DistributionList: cleanDistributionList,
      UserIds: userids,
    };

    this._doumentRequestService.SubmitDraftDocumentRequest(payload).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notificationToasService.createNotification(
            'success',
            'User',
            'Document submitted successfully!',
          );
          this.GetAllDraftDocuments();
          this.selectedDraftRequest=null;
        }
      },
      error: (err) => {
        this._notificationToasService.createNotification('error', 'Error', 'Failed to submit document.');
      },
    });
  }

  UpdateDocumentRequests() {
    // debugger;
    const cleanDistributionList = this.distributionListPayload.map((x: any) => ({
      divisionCode: x.level1Id || x.divisionCode,
      departmentCode: x.level2Id || x.departmentCode,
      subDepartmentCode: x.level3Id || x.subDepartmentCode,
      businessDomainCode: x.level4Id || x.businessDomainCode,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId || x.distributionTypeId,
    }));

    const formData = new FormData();
    formData.append('CompanyId', this.selectedCompany?.toString() || '');
    formData.append('RequestId', this.requestId?.toString() || '');
    formData.append('DocumentName', this.documentName || '');
    formData.append('Justification', this.inputJustificationValue || '');
    formData.append('ProposedContent', this.templateHtml || '');
    formData.append('ModifiedByUserId', '1'); // this will be bind with UserId

    cleanDistributionList.forEach((item: any, index: number) => {
      if (item.divisionCode)
        formData.append(`DistributionList[${index}].divisionCode`, item.divisionCode);
      if (item.departmentCode)
        formData.append(`DistributionList[${index}].departmentCode`, item.departmentCode);
      if (item.subDepartmentCode)
        formData.append(`DistributionList[${index}].subDepartmentCode`, item.subDepartmentCode);
      if (item.businessDomainCode)
        formData.append(`DistributionList[${index}].businessDomainCode`, item.businessDomainCode);
      if (item.roleId) formData.append(`DistributionList[${index}].roleId`, item.roleId.toString());
      if (item.distributionTypeId)
        formData.append(
          `DistributionList[${index}].distributionTypeId`,
          item.distributionTypeId.toString(),
        );
    });

    const userids = this.distributionUserList
      .map(
        (u: any) =>
          u.employeeCode ||
          u.EmployeeCode ||
          u.empcode ||
          u.empid ||
          u.userId ||
          u.UserId ||
          u.id ||
          u.Id,
      )
      .filter((code) => code != null && code !== '')
      .map(String);

    userids.forEach((id: string, index: number) => {
      formData.append(`UserIds[${index}]`, id);
    });

    if (this.draftFile) {
      formData.append('DraftFile', this.draftFile);
    }

    this._doumentRequestService.UpdateDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        if (response?.Success) {
          this._notificationToasService.createNotification(
            'success',
            'User',
            'Document updated successfully!',
          );
          this.GetAllDraftDocuments();
        }
      },
      error: (err) => {
        this._notificationToasService.createNotification('error', 'Error', 'Failed to submit document.');
      },
    });
  }

  openObservationModal(rowData: any) {
    //console.log('Row clicked:', rowData);
    const modalRef = this.modal.create({
      nzTitle: 'Observation',
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: rowData.Id,
        entityType: 'Request',
        mode: 'view',
        action: 'Approver',
      },
      nzFooter: null,
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      if (!result) return;
    });
  }
}
