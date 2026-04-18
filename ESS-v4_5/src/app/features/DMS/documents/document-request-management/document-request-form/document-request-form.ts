import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { CabinetSelection, ColumnToggle, SelectList } from '@app/shared/interfaces/interfaces';
import { DocumentRequestTypeService } from '@app/shared/services/document-request-type.service';
import { CompanyService } from '@app/shared/services/company.service';
import { DRDistributionList } from '../drdistribution-list/drdistribution-list';
import { DRUsersComponent } from '../drusers-component/drusers-component'; 
import { NotificationService } from '@app/shared/notification/notification.service';
import { TemplateService } from '@app/shared/services/template.service'; 
import { WorkflowStepService } from '@app/shared/services/workflow-step-service'; 
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { RevisionHistoryModal } from '../../revision-history-modal/revision-history-modal';
import { DocumentService } from '@app/shared/services/document.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { PermissionService } from '@app/shared/services/permission.service';

@Component({
  selector: 'app-document-request-form',
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
    NzInputModule,
    NzModalModule,
    DocumentTypeList,
    DRDistributionList,
    DRUsersComponent,
    DMSRichTextEdit, 
    CabinetStructureList,
  ],
  templateUrl: './document-request-form.html',
  styleUrl: './document-request-form.css',
})
export class DocumentRequestForm {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() draftData: any;

   // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'requestdocumentcreation';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType: string = '';
  inputJustificationValue?: string;
  documentName?: string = '';
  templateHtml: string = '';
  originalContentHtml: string = '';
  selectedTemplateType: string = '';
  templateFileUrl: string = '';
  draftFile: File | null = null;
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;
  totalDistributioinList = 0;
  totalWorkflowAuthorities = 0;
  totalDocuments = 0;
  totalPendingApprovals = 0;
  rowData: any[] = [];
  trainingContent: boolean = false;
  showExclusionTable = false;

  public noRowsOverlay: string = '';
  selectedCompany: string | null = null;
  selectedRequestType: string = '';
  selectedDocumentRequestType: string | null = null;
  showDocumentDiv: boolean = false;
  showDocumentCreationDiv: boolean = false;

  employees: any[] = [];
  selectedEmployee?: string = '';
  documentRequestsData: any[] = [];

  distributionListPayload: any[] = [];
  distributionUserList: any[] = [];
  selectedDocumentRow: any = null;

  companies: any[] = [];
  requestTypes: any[] = [];
  approvalSequenceData: any[] = [];

  filters: SelectList[] = [
    { CODE: '1', NAME: 'Over Due' },
    { CODE: '2', NAME: 'Less than 30 days' },
  ];

  selectedPageSize = 10;
  requestId: number = 0;
  submittedby: number = 0;
  loginEmpId: string = '';

  documentColumnDefs: ColDef[] = [
    {
      field: 'documentType',
      headerName: 'Document Type',
      cellEditor: 'agSelectCellEditor',
      pinned: 'left',
    },
    {
      field: 'documentName',
      headerName: 'Document Name',
      cellEditor: 'agSelectCellEditor',
      pinned: 'left',
    },
    {
      field: 'version',
      headerName: 'Version',
      pinned: 'left', // ✅ now correctly typed
    },
    {
      field: 'division',
      headerName: 'Division',
      cellEditor: 'agSelectCellEditor',
    },
    {
      field: 'department',
      headerName: 'Department',
      cellEditor: 'agSelectCellEditor',
    },
    {
      field: 'subdepartment',
      headerName: 'Sub-Department',
      cellEditor: 'agSelectCellEditor',
    },
    { field: 'nextReviewDate', headerName: 'Next Review Date' },
    { field: 'url', headerName: 'URL' },
    { field: 'requestCreatedBy', headerName: 'Request Created By' },
    { field: 'requestCreatedOn', headerName: 'Request Created On' },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created  By' },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On' },
    {
      field: 'approvalHistory',
      headerName: 'Approval History',
      editable: false,
      cellRenderer: (params: any) => {
        return `
          <span 
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
            ${params.value ? 'View' : 'View'}
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
        return `
          <span 
            style="color:#1976d2; cursor:pointer; text-decoration:underline"
            data-action="open"
          >
            ${params.value ? 'View' : 'View'}
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        this.openRevisionHistoryModal(event.data);
      },
    },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'version', label: 'Version', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subdepartment', label: 'Sub-Department', visible: true },
    { field: 'nextReviewDate', label: 'Next Review Date', visible: true },
    { field: 'url', label: 'URL', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
    { field: 'revisionHistory', label: 'Revision History', visible: true },
  ];

  documentRevisionData: [] = [];

  constructor(
    private modal: NzModalService,
    private _documentRequestTypeService: DocumentRequestTypeService,
    private _companyService: CompanyService,
    private _notification: NotificationService,
    private _doumentRequestService: DocumentRequestService,
    private _documentTemplateService: TemplateService, 
    private _workflowStepService: WorkflowStepService,
    private _documentService: DocumentService,
    private _UtilitiesService: UtilitiesService,
    private _permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.GetLoginEmpId();

    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      
      this.getAllDocumentRequestTypes(); 
      this.getAllCompanies();
    });
  }
 
  GetLoginEmpId() {
    this.loginEmpId = localStorage.getItem('HRISEmpId') || '';
  }

  onRequestTypeChange(value: string | null): void {
    this.selectedDocumentRequestType = value;
    this.selectedDocumentRow = null;
    if (this.selectedDocumentRequestType == '1' || this.selectedDocumentRequestType == 'DRT-0001') {
      this.showDocumentCreationDiv = true;
      this.showDocumentDiv = false;
    } else if (
      this.selectedDocumentRequestType == '2' ||
      this.selectedDocumentRequestType == 'DRT-0002'
    ) {
      this.showDocumentDiv = true;
      this.showDocumentCreationDiv = true;
      this.GetAllApprovedDocuments('');
    } else {
      this.showDocumentDiv = true; // show document grid on obseletion as well.
      this.showDocumentCreationDiv = true;
    }
  }

  onCompanyChange(value: string | null) {
    this.selectedCompany = value;
  }

  loadWorkflowAuthorities(documentType: string) {
    const payLoad = {
      EntityType: 'Request',
      documentTypeCode: documentType,
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
    };
    this._workflowStepService.getWorkflowStepByDocumentTypeCode(payLoad).subscribe((res) => {
      this.showExclusionTable = true;
      this.approvalSequenceData = res?.Data ? res.Data : [];
    });
  }

  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    if (value != null) {
      this.selectedDocumentType = value;

      //Get Template
      this.GetTemplate(this.selectedDocumentType);

      this.loadWorkflowAuthorities(this.selectedDocumentType);
    } else {
      this.approvalSequenceData = [];
      this.selectedDocumentType = '';
      this.showExclusionTable = false;
    }
  }

  onDistributionChanged(list: any[]) {
    this.distributionListPayload = list;
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  getAllCompanies = () => {
    this._companyService.getCompanyList().subscribe((res) => {
      if (res) {
        this.companies = (res.Data ?? []).map((d: any) => ({
          id: d.Id,
          text: d.Value,
        }));
      } else {
        this.companies = [];
      }
    });
  };

  getAllDocumentRequestTypes = () => {
    this._documentRequestTypeService.getDocumentTypeList().subscribe((res) => {
      if (res) {
        this.requestTypes = (res.Data ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Value,
        }));
      } else {
        this.requestTypes = [];
      }
    });
  };

  GetTemplate(value: string) {
    this._documentTemplateService.getTemplateByDocumentTypeCode(value).subscribe({
      next: (response) => {
        this.selectedTemplateType =
          response.Data?.TemplateType?.toString() || response.Data?.templateType?.toString() || '';
        this.templateFileUrl =
          response.Data?.TemplateFileURL || response.Data?.templateFileUrl || '';
        this.templateHtml = response.Data?.TemplateContent || response.Data?.templateContent || '';
      },
      error: (err) => console.error(err),
    });

    if (value === 'Select') {
      this.trainingContent = true;
    }
  }

  downloadTemplate(): void {
    if (!this.selectedDocumentType) {
      this._notification.createNotification(
        'warning',
        'Template',
        'Please select a Document Type first.',
      );
      return;
    }

    this._documentTemplateService
      .DownloadTemplateByDocumentTypeCode(this.selectedDocumentType)
      .subscribe({
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
                  this._notification.createNotification(
                    'warning',
                    'Template',
                    res.Message || 'Template not available.',
                  );
                } catch {
                  this._notification.createNotification(
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
              this._notification.createNotification(
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
                this._notification.createNotification(
                  'error',
                  'Template',
                  res.Message || 'Failed to download template.',
                );
              } catch {
                this._notification.createNotification(
                  'error',
                  'Template',
                  'Failed to download template.',
                );
              }
            });
          } else {
            console.error('Error downloading template', err);
            this._notification.createNotification(
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

  DraftDocumentRequests() {
    if (!this.selectedDocumentRequestType) {
      this._notification.createNotification(
        'warning',
        'Validation',
        'Please select an Document Request Type.',
      );
      return;
    }
    if (!this.selectedCompany) {
      this._notification.createNotification('warning', 'Validation', 'Please select a Company.');
      return;
    }
    if (!this.documentName || this.documentName.trim() === '') {
      this._notification.createNotification('warning', 'Validation', 'Please enter Document Name.');
      return;
    }
    if (!this.selectedDocumentType) {
      this._notification.createNotification(
        'warning',
        'Validation',
        'Please select a Document Type.',
      );
      return;
    }
    if (!this.selectedDivisions) {
      this._notification.createNotification('warning', 'Validation', 'Please select a Division.');
      return;
    }
    if (!this.selectedDepartment) {
      this._notification.createNotification('warning', 'Validation', 'Please select a Department.');
      return;
    }
    if (!this.selectedSubDepartment) {
      this._notification.createNotification(
        'warning',
        'Validation',
        'Please select a Sub Department.',
      );
      return;
    }
    if (!this.selectedBusinessDomain) {
      this._notification.createNotification(
        'warning',
        'Validation',
        'Please select a Business Domain.',
      );
      return;
    }
    debugger;
    const cleanDistributionList = this.distributionListPayload.map((x: any) => ({
      divisionCode: x.level1Id || x.divisionCode,
      departmentCode: x.level2Id || x.departmentCode,
      subDepartmentCode: x.level3Id || x.subDepartmentCode,
      businessDomainCode: x.level4Id || x.businessDomainCode,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId || x.distributionTypeId,
    }));

    const formData = new FormData();
    formData.append('CompanyId', this.selectedCompany || '');
    formData.append('DocumentRequestTypeCode', this.selectedDocumentRequestType || '');
    if (this.selectedDocumentType) formData.append('documentTypeCode', this.selectedDocumentType);
    if (this.documentName) formData.append('documentName', this.documentName);
    if (this.inputJustificationValue)
      formData.append('justification', this.inputJustificationValue);
    if (this.templateHtml) formData.append('proposedContent', this.templateHtml);
    if (this.selectedDivisions) formData.append('divisionCode', this.selectedDivisions);
    if (this.selectedDepartment) formData.append('departmentCode', this.selectedDepartment);
    if (this.selectedSubDepartment)
      formData.append('subDepartmentCode', this.selectedSubDepartment);
    if (this.selectedBusinessDomain)
      formData.append('businessDomainCode', this.selectedBusinessDomain); 

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
      .map((u: any) => u.employeeCode || u.EmployeeCode || u.empcode || u.empid || u.userId)
      .filter((code) => code != null && code !== '')
      .map(String);

    userids.forEach((id: string, index: number) => {
      formData.append(`UserIds[${index}]`, id);
    });

    if (this.draftFile) {
      formData.append('DraftFile', this.draftFile);
    }

    this._doumentRequestService.CreateDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        if (response?.Success) {
          //clear all fields
          this.emptyFields();

          this._notification.createNotification(
            'success',
            'User',
            'Document drafted successfully!',
          );
        }
      },
      error: (err) => {
        this._notification.createNotification('error', 'Error', 'Failed to draft document.');
      },
    });
  }

  SubmitDocumentRequests() {
    
    if (!this.selectedDocumentRequestType) {
      this._notification.createNotification(
        'warning',
        'Validation',
        'Please select a Request Type.',
      );
      return;
    }
    if (!this.selectedCompany) {
      this._notification.createNotification('warning', 'Validation', 'Please select a Company.');
      return;
    }
    if (!this.documentName || this.documentName.trim() === '') {
      this._notification.createNotification('warning', 'Validation', 'Please enter Document Name.');
      return;
    }

    // UC-22: Revision Validation Checks
    if (this.selectedDocumentRequestType == '2' || this.selectedDocumentRequestType == 'DRT-0002') {
      if (!this.selectedDocumentRow) {
        this._notification.createNotification(
          'warning',
          'Validation',
          'Please select an existing document to revise.',
        );
        return;
      }

      // Mandatory Justification
      if (!this.inputJustificationValue || this.inputJustificationValue.trim() === '') {
        this._notification.createNotification(
          'warning',
          'Validation',
          'Justification is mandatory for a document revision.',
        );
        return;
      }

      // Special Requirement: Document Content must be altered
      if (this.templateHtml === this.originalContentHtml) {
        this._notification.createNotification(
          'warning',
          'Validation',
          'Document Content must be altered from the original version before submission.',
        );
        return;
      }
    }

    const cleanDistributionList = this.distributionListPayload.map((x: any) => ({
      divisionCode: x.level1Id || x.divisionCode,
      departmentCode: x.level2Id || x.departmentCode,
      subDepartmentCode: x.level3Id || x.subDepartmentCode,
      businessDomainCode: x.level4Id || x.businessDomainCode,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId || x.distributionTypeId,
    }));

    if (
      (this.selectedTemplateType === '1' || this.selectedTemplateType === '2') &&
      !this.draftFile
    ) {
      this._notification.createNotification(
        'warning',
        'Validation',
        'Please upload your drafted document before submitting.',
      );
      return;
    }

    const formData = new FormData();
    formData.append('CompanyId', this.selectedCompany || '');
    formData.append('DocumentRequestTypeCode', this.selectedDocumentRequestType || '');
    if (this.selectedDocumentType) formData.append('documentTypeCode', this.selectedDocumentType);
    if (this.documentName) formData.append('documentName', this.documentName);
    if (this.inputJustificationValue)
      formData.append('justification', this.inputJustificationValue);
    if (this.templateHtml) formData.append('proposedContent', this.templateHtml);
    if (this.selectedDivisions) formData.append('divisionCode', this.selectedDivisions);
    if (this.selectedDepartment) formData.append('departmentCode', this.selectedDepartment);
    if (this.selectedSubDepartment)
      formData.append('subDepartmentCode', this.selectedSubDepartment);
    if (this.selectedBusinessDomain)
      formData.append('businessDomainCode', this.selectedBusinessDomain); 

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
      .map((u: any) => u.employeeCode || u.EmployeeCode || u.empcode || u.empid || u.userId)
      .filter((code) => code != null && code !== '')
      .map(String);

    userids.forEach((id: string, index: number) => {
      formData.append(`UserIds[${index}]`, id);
    });

    if (this.draftFile) {
      formData.append('DraftFile', this.draftFile);
    }

    this._doumentRequestService.CreateAndSubmitDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        if (response?.Success) {
          //clear all fields
          this.emptyFields();
          this._notification.createNotification(
            'success',
            'User',
            'Document submitted successfully!',
          );
        }
      },
      error: (err) => {
        this._notification.createNotification('error', 'Error', 'Failed to submit document.');
      },
    });
  }

  emptyFields() {
    this.selectedRequestType = '';
    this.selectedDocumentRequestType = null;
    this.selectedCompany = '';
    this.documentName = '';
    this.inputJustificationValue = '';
    this.selectedDocumentType = '';
    this.selectedDivisions = '';
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.selectedBusinessDomain = '';
    this.templateHtml = '';
    this.originalContentHtml = '';
    this.selectedTemplateType = '';
    this.templateFileUrl = '';
    this.draftFile = null;
    this.distributionListPayload = [];
    this.distributionUserList = [];
    this.selectedDocumentRow = null;
    this.showDocumentDiv = false;
    this.showDocumentCreationDiv = false;
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
  }

  GetAllApprovedDocuments(query: any) {
    const payLoad = { 
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      documentTypeCode: this.selectedDocumentType, 
      RequestStatus: 'Approved',
      // pageNumber: this.currentGridQuery.pageNumber,
      // pageSize: this.currentGridQuery.pageSize,
      // sortModel: this.currentGridQuery.sortModel || [],
      // filterModel: this.currentGridQuery.filterModel || {},
      // searchTerm: this.currentGridQuery.searchTerm || '',
      // // Map to satisfy backend validation
      // sortBy: sortBy,
      // sortColumn: sortColumn,
      // searchText: this.currentGridQuery.searchTerm || '',
      empid: this.loginEmpId,
    };

    this._documentService.GetDocumentByStatus(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          this.totalRows = response.Data.TotalCount;
          this.documentRevisionData = response.Data.Items.map((item: any) => {
            // Helper to get value with case-insensitive fallback
            const get = (keys: string[], defaultValue: any = ''): any => {
              for (const key of keys) {
                if (item[key] !== undefined && item[key] !== null) return item[key];
                const lower = key.toLowerCase();
                if (item[lower] !== undefined && item[lower] !== null) return item[lower];
              }
              return defaultValue;
            };

            const createdAtRaw = get(['CreatedAt', 'createdAt', 'CreatedDate', 'createdDate']);
            const startedAtRaw = get(['StartedAt', 'startedAt']);

            return {
              // ──────────────────────────────────────────────
              // Identification & Request
              // ──────────────────────────────────────────────
              ExecutionId: get(['ExecutionId', 'executionId']),
              Id: get(['Id', 'id']),
              requestId: get(['Id', 'id']), // often same as Id
              stepId: get(['StepId', 'stepId']),
              stepOrder: get(['StepOrder', 'stepOrder']),
              ExecutionStatus: get(['ExecutionStatus', 'executionStatus'], 'Unknown'),

              // ──────────────────────────────────────────────
              // Document metadata
              // ──────────────────────────────────────────────
              documentType: get(['DocumentType', 'documentType']),
              documentTypeCode: get(['DocumentTypeCode', 'documentTypeCode']),
              documentName: get(['Title', 'title']),
              company: get(['Company', 'company'], ''),
              companyId: get(['CompanyId', 'companyId']),
              proposedDocumentNumber: get(['DocumentNumber', 'documentNumber']),
              proposedVersionNumber: get(['ProposedVersionNumber', 'proposedVersionNumber'], '1.0'), // fallback

              // ──────────────────────────────────────────────
              // Organizational context
              // ──────────────────────────────────────────────
              division: get(['Division']),
              department: get(['Department']),
              departmentId: get(['DepartmentCode', 'departmentCode']),
              subdepartment: get(['subdepartment', 'SubDepartment']),
              businessdomain: get(['BusinessDomain', 'businessDomain']),
              businessdomainId: get(['BusinessDomainCode', 'businessDomainCode']),
              version: get(['ProposedVersionNumber', 'proposedVersionNumber']),
              // ──────────────────────────────────────────────
              // Content / Justification
              // ──────────────────────────────────────────────

              proposedContent: get(['VersionContent', 'ProposedContent', 'Content'], ''),

              // ──────────────────────────────────────────────
              // Audit / History fields
              // ──────────────────────────────────────────────
              requestCreatedBy: get(['RequestCreatedBy', 'requestCreatedBy'], ''),
              dateOfCreation: this.formatDate(createdAtRaw), // ← see helper below
              requestCreatedOn: get(['RequestCreatedAt', 'requestCreatedAt']),
              startedAt: this.formatDate(startedAtRaw),

              // Previous version info (only if present in real payloads)
              previsousVersionCreatedBy: get(['RequestCreatedBy', 'requestCreatedBy'], ''),
              previousVersionCreatedOn: this.formatDate(
                get(['RequestCreatedAt', 'requestCreatedAt']),
              ),

              // ──────────────────────────────────────────────
              // Placeholder / missing fields from your original
              // (add real data source when available)
              // ──────────────────────────────────────────────
              observation: '', // ← not in sample → populate when available
              requestedBy: get(['RequestedBy', 'requestedBy'], get(['CreatedBy'])),
              dateOfApproval: '', // ← not present
              approvalHistory: '', //get(['VersionContent'], ''), // or format rich text if needed
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
            };
          });
        }
      },
      error: (err) => {
        this._notification.createNotification('error', 'Error', 'Failed to submit document.');
      },
    });
  }

  // Option 1: Simple custom method (no pipe dependency)
  private formatDate(value: string | null | undefined): string {
    if (!value) return '';

    // Input example: "02/21/2026 11:04:01"
    try {
      const [datePart, timePart = ''] = value.split(' ');
      const [month, day, year] = datePart.split('/');
      if (!year || !month || !day) return value;

      // Desired format example: 21-02-2026 11:04:01
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year} ${timePart.trim()}`.trim();
    } catch {
      return value; // fallback — show original if parsing fails
    }
  }

  onCellClicked(event: any): void {
    const row = event.data;

    this.selectedDocumentRow = row;

    this.requestId = row.Id;
    this.submittedby = row.submittedBy || row.sumbittedby;
    this.selectedCompany = row.companyId || row.company;
    // ✅ Populate form fields
    this.documentName = row.documentName;
    this.inputJustificationValue = row.justification;
    this.templateHtml = row.proposedContent;
    this.originalContentHtml = row.proposedContent || '';
    this.selectedDocumentType = row.documentType;
    this.selectedDivisions = row.division;
    this.selectedDepartment = row.department;
    this.selectedSubDepartment = row.subdepartment;
    this.selectedBusinessDomain = row.businessdomainId || row.businessdomain;

    // ✅ Populate Distribution List
    this.distributionListPayload = row.distributionListPayload || [];

    // ✅ Populate Users
    this.distributionUserList = row.distributionUserList || [];

    if (this.selectedDocumentType) {
      this.loadWorkflowAuthorities(this.selectedDocumentType);
    }
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

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Approval History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.Id,
        entityType: 'Document',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1000,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }
}
