import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { CabinetSelection, ColumnToggle } from '@app/shared/interfaces/interfaces';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { ColDef } from 'ag-grid-community';
import { TemplateService } from '@app/shared/services/template.service';
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
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

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
    CabinetStructureList,
  ],
  templateUrl: './draft-request-list.html',
  styleUrl: './draft-request-list.css',
})
export class DraftRequestList {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('fileInput') fileInput!: any;

  // Lets the parent (document-request-management.ts) know a draft moved out of Draft status
  // (submitted) or was otherwise saved, so it can refresh the "Draft Request" tab badge count —
  // that count lives on the parent and otherwise only refreshes on init / after creating a new
  // request from the other tab.
  @Output() draftRequestChanged = new EventEmitter<void>();

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
    flex: 1,
    minWidth: 100,
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
  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedBusinessDomain: string = '';
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
  loadingDraft = false;
  loadingSubmit = false;

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

  // field name each cabinet level maps to in the row data, keyed by level number
  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subdepartment', label: 'Sub-Department' },
    4: { field: 'businessdomain', label: 'Business Domain' },
  };

  private readonly fixedColumnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
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
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentName', headerName: 'Document Title' },
    {
      field: 'justification',
      headerName: 'Justification',
      editable: false,
      cellRenderer: (params: any) => {
        const val = params.value || (params.data && params.data.justification) || '';
        if (!val) return '<span>-</span>';
        return `
          <span
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open-justification"
          >
            Justification
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        const val = event.value || (event.data && event.data.justification);
        if (val) {
          this.openJustificationModal(val);
        }
      },
    },
  ];

  private readonly trailingColumnDefs: ColDef[] = [
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

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out
  // showing just the fixed columns until we know which levels are enabled.
  documentColumnDefs: ColDef[] = [...this.fixedColumnDefs, ...this.trailingColumnDefs];

  columnToggles?: ColumnToggle[] = [
    { field: 'requestNumber', label: 'Request Number', visible: true },
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
    private _documentTemplateService: TemplateService,
    private _cabinetHierarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      // this.getAllUsersList();
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

      this.documentColumnDefs = [
        ...this.fixedColumnDefs,
        ...activeLevelDefs.map((def) => ({ field: def.field, headerName: def.title })),
        ...this.trailingColumnDefs,
      ];

      this.columnToggles = [
        { field: 'requestNumber', label: 'Request Number', visible: true },
        { field: 'documentType', label: 'Document Type', visible: true },
        { field: 'documentName', label: 'Document Title', visible: true },
        { field: 'justification', label: 'Justification', visible: true },
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        { field: 'createdOn', label: 'Last Saved On', visible: true },
        { field: 'status', label: 'Status', visible: true },
      ];
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
            divisionCode: item.DivisionCode || item.divisionCode,
            documentId: item.DocumentNumber,
            documentName: item.DocumentName,
            proposedContent: item.ProposedContent,
            department: item.Department,
            departmentId: item.DepartmentCode,
            subdepartment: item.SubDepartment,
            subDepartmentCode: item.SubDepartmentCode || item.subDepartmentCode,
            justification:
              item.Justification || item.justification || item.Reason || item.reason || '',
            businessdomain: item.BusinessDomain || item.businessDomain || item.businessdomain,
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
            templateFileUrl:
              item.TemplateFileUrl || item.TemplateFileURL || item.templateFileUrl || '',
            draftFileUrl: item.DraftFileUrl || item.draftfileurl || item.draftFileUrl || '',
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

  // The actual file extension a drafted upload must match. Derived straight from the
  // template/existing-document URL rather than the TemplateType code, since TemplateType
  // is an unreliable classification (e.g. TemplateType 1 has been seen pointing at a .docx).
  get expectedTemplateExtension(): string {
    const url = this.templateFileUrl || this.draftFileUrl || '';
    if (!url) return '';
    try {
      const clean = decodeURIComponent(url).split('?')[0].split('#')[0];
      const parts = clean.split('.');
      return parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
    } catch {
      return '';
    }
  }

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
    this.selectedDivisions = row.divisionCode || row.division;
    this.selectedDepartment = row.departmentId || row.department;
    this.selectedSubDepartment = row.subDepartmentCode || row.subdepartment;
    this.selectedBusinessDomain = row.businessdomainId;

    if (this.selectedDocumentTypeCode) {
      this.GetTemplate(this.selectedDocumentTypeCode, true);
    }

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
        'Document Request (Draft)',
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
              : response?.Data?.TemplateFileUrl ||
                response?.Data?.TemplateFileURL ||
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

  GetTemplate(value: string, isRevision: boolean = false) {
    this._documentTemplateService.getTemplateByDocumentTypeCode(value).subscribe({
      next: (response: any) => {
        if (!response?.Success || !response?.Data || Object.keys(response.Data).length === 0) {
          this.selectedTemplateType = '';
          this.templateFileUrl = '';
          return;
        }

        this.selectedTemplateType =
          response.Data?.TemplateType?.toString() || response.Data?.templateType?.toString() || '';
        this.templateFileUrl =
          response.Data?.TemplateFileUrl ||
          response.Data?.TemplateFileURL ||
          response.Data?.templateFileUrl ||
          '';
      },
      error: (err) => {
        this.selectedTemplateType = '';
        this.templateFileUrl = '';
        console.error(err);
      },
    });
  }

  onDraftFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      this.draftFile = null;
      return;
    }

    const file = fileList[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const expectedExt = this.expectedTemplateExtension;

    if (expectedExt && ext !== expectedExt) {
      this._notificationToasService.createNotification(
        'warning',
        'Invalid File',
        `The document template is a .${expectedExt} file. Please upload a matching .${expectedExt} file.`,
      );
      event.target.value = '';
      this.draftFile = null;
      return;
    }

    this.draftFile = file;
  }

  getFileIconClass(filename: string | null | undefined): string {
    if (!filename) return 'bi-file-earmark-text text-primary';
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'bi-file-earmark-pdf text-danger';
      case 'doc':
      case 'docx':
        return 'bi-file-earmark-word text-primary';
      case 'xls':
      case 'xlsx':
        return 'bi-file-earmark-excel text-success';
      case 'ppt':
      case 'pptx':
        return 'bi-file-earmark-ppt text-warning';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'bi-file-earmark-image text-info';
      case 'zip':
      case 'rar':
        return 'bi-file-earmark-zip text-warning';
      default:
        return 'bi-file-earmark-text text-secondary';
    }
  }

  getDraftFileName(): string {
    if (this.draftFile) {
      return this.draftFile.name;
    }
    if (this.draftFileUrl) {
      try {
        const decoded = decodeURIComponent(this.draftFileUrl);
        const parts = decoded.split('/');
        return parts[parts.length - 1].split('?')[0];
      } catch (e) {
        const parts = this.draftFileUrl.split('/');
        return parts[parts.length - 1];
      }
    }
    return '';
  }

  reviewDraftedFile(): void {
    if (this.draftFile) {
      const fileURL = URL.createObjectURL(this.draftFile);
      window.open(fileURL, '_blank');
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    }
  }

  removeDraftedFile(): void {
    this.draftFile = null;
    this.draftFileUrl = '';
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
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

    // FormData so the user can update the Template file or HTML content at submit time,
    // same as UpdateDocumentRequests() below -- the backend endpoint now accepts multipart.
    const formData = new FormData();
    formData.append('CompanyId', this.selectedCompany?.toString() || '');
    formData.append('RequestId', this.requestId?.toString() || '');
    formData.append('DocumentRequestType', 'Request');
    formData.append('ProposedContent', this.templateHtml || '');

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

    userids.forEach((id: string, index: number) => {
      formData.append(`UserIds[${index}]`, id);
    });

    if (this.draftFile) {
      formData.append('DraftFile', this.draftFile);
    }

    this.loadingSubmit = true;
    this._doumentRequestService.SubmitDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        this.loadingSubmit = false;
        if (response?.Success) {
          this._notificationToasService.createNotification(
            'success',
            'Document Request (Draft)',
            'Document submitted successfully!',
          );
          // This grid binds (serverQuery), so it's server-side/infinite-row-model —
          // reassigning documentRequestsData directly (via GetAllDraftDocuments()) doesn't
          // actually push the change into AG Grid's rendered rows unless it's mid-request.
          // refresh() forces a real refetch of what's on screen; deselecting clears the now-
          // submitted row's selection so it can't be selected and submitted again.
          this.agGridWrapper?.gridApi?.deselectAll();
          this.agGridWrapper?.refresh();
          this.selectedDraftRequest = null;
          this.draftRequestChanged.emit();
        }
      },
      error: (err) => {
        this.loadingSubmit = false;
        this._notificationToasService.createNotification(
          'error',
          'Error',
          'Failed to submit document.',
        );
      },
    });
  }

  UpdateDocumentRequests() { 
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

    this.loadingDraft = true;
    this._doumentRequestService.UpdateDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        this.loadingDraft = false;
        if (response?.Success) {
          this._notificationToasService.createNotification(
            'success',
            'Document Request (Draft)',
            'Document updated successfully!',
          );
          // Same server-side-grid refresh as SubmiteDocumentRequests() — GetAllDraftDocuments()
          // alone doesn't reach AG Grid's rendered rows. Also clear the selection so the user
          // has to explicitly pick a row again instead of re-saving the same in-memory form.
          this.agGridWrapper?.gridApi?.deselectAll();
          this.agGridWrapper?.refresh();
          this.selectedDraftRequest = null;
          this.draftRequestChanged.emit();
        }
      },
      error: (err) => {
        this.loadingDraft = false;
        this._notificationToasService.createNotification(
          'error',
          'Error',
          'Failed to submit document.',
        );
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
        decision:'Reworked'
      },
      nzFooter: null,
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((result) => {
      if (!result) return;
    });
  }

  openJustificationModal(justificationText: string): void {
    const text = justificationText || 'No justification provided.';
    const modalRef = this.modal.create({
      nzTitle: 'Justification',
      nzContent: `<div style="padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${text}</div>`,
      nzClosable: true,
      nzMaskClosable: true,
      nzFooter: [
        {
          label: 'Close',
          type: 'primary',
          onClick: () => modalRef.destroy(),
        },
      ],
      nzWidth: 600,
    });
  }
}
