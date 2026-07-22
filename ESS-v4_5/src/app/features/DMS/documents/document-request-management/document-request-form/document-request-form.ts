import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
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
import { TemplateService } from '@app/shared/services/template.service';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { RevisionHistoryModal } from '../../revision-history-modal/revision-history-modal';
import { PermissionService } from '@app/shared/services/permission.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

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
  @Output() requestCreated = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  isSubmitting = false;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'requestdocumentcreation';

  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedBusinessDomain: string = '';
  selectedDocumentType: string = '';
  inputJustificationValue?: string;
  documentName?: string = '';
  templateHtml: string = '';
  originalContentHtml: string = '';
  selectedTemplateType: string = '';
  templateFileUrl: string = '';
  draftFileUrl: string = '';
  draftFile: File | null = null;
  displayDocumentType: string = '';
  displayDivision: string = '';
  displayDepartment: string = '';
  displaySubDepartment: string = '';
  displayBusinessDomain: string = '';
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

  pageSize = 10;
  totalRows = 0;
  trainingContent: boolean = false;
  showExclusionTable = false;

  public noRowsOverlay: string = '';
  selectedCompany: string | null = null;
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
  pageNumber = 1;

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
    private _notificationToasService: NotificationToastService,
    private _doumentRequestService: DocumentRequestService,
    private _documentTemplateService: TemplateService,
    private _workflowStepService: WorkflowStepService,
    private _permissionService: PermissionService,
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
    const currentCompany = this.selectedCompany; // Preserve company selection if already chosen
    this.emptyFields(); // Clears out all the form fields, grids, and selections

    this.selectedDocumentRequestType = value;
    this.selectedCompany = currentCompany;

    if (this.selectedDocumentRequestType == '1' || this.selectedDocumentRequestType == 'DRT-0001') {
      this.showDocumentCreationDiv = true;
      this.showDocumentDiv = false;
    } else if (
      this.selectedDocumentRequestType == '2' ||
      this.selectedDocumentRequestType == 'DRT-0002'
    ) {
      this.showDocumentDiv = true;
      this.GetEffectiveDocumentsForRevision('');
      this.showDocumentCreationDiv = true;
    } else {
      this.showDocumentDiv = true; // show document grid on obseletion as well.
      this.showDocumentCreationDiv = true;
    }
  }

  onCompanyChange(value: string | null) {
    this.selectedCompany = value;
  }

  loadWorkflowAuthorities(documentType: string) {
    if (!documentType) {
      this.approvalSequenceData = [];
      this.showExclusionTable = false;
      return;
    }

    const payLoad = {
      EntityType: 'Request',
      documentTypeCode: documentType,
      divisionCode: this.selectedDivisions || '',
      departmentCode: this.selectedDepartment || '',
      subDepartmentCode: this.selectedSubDepartment || '',
      businessDomainCode: this.selectedBusinessDomain || '',
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
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? '';
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? '';
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? '';
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? '';

    if (this.selectedDocumentType) {
      this.loadWorkflowAuthorities(this.selectedDocumentType);
    }
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

  GetTemplate(value: string, isRevision: boolean = false) {
    this._documentTemplateService.getTemplateByDocumentTypeCode(value).subscribe({
      next: (response: any) => {
        if (!response?.Data) {
          this.selectedTemplateType = '';
          this.templateFileUrl = '';
          if (!isRevision) {
            this.templateHtml = '';
          }
          this._notificationToasService.createNotification(
            'warning',
            'Template Missing',
            'Please first upload the template against this Document Type. Document request cannot be created.',
          );
          return;
        }

        this.selectedTemplateType =
          response.Data?.TemplateType?.toString() || response.Data?.templateType?.toString() || '';
        this.templateFileUrl =
          response.Data?.TemplateFileURL || response.Data?.templateFileUrl || '';

        if (!isRevision) {
          this.templateHtml =
            response.Data?.TemplateContent || response.Data?.templateContent || '';
        }
      },
      error: (err) => console.error(err),
    });

    if (value === 'Select') {
      this.trainingContent = true;
    }
  }

  downloadTemplate(): void {
    if (!this.selectedDocumentType) {
      this._notificationToasService.createNotification(
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
              err?.error?.Message || err?.Message || 'Failed to download template.',
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
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please select an Document Request Type.',
      );
      return;
    }
    if (!this.selectedCompany) {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please select a Company.',
      );
      return;
    }
    if (!this.documentName || this.documentName.trim() === '') {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please enter Document Name.',
      );
      return;
    }
    if (!this.selectedDocumentType) {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please select a Document Type.',
      );
      return;
    }
    if (!this.inputJustificationValue) {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please enter Justification.',
      );
      return;
    }
    if (!this.selectedTemplateType) {
      this._notificationToasService.createNotification(
        'warning',
        'Template Missing',
        'Please first upload the template against this Document Type.',
      );
      return;
    }
    // if (!this.selectedDivisions) {
    //   this._notificationToasService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select a Division.',
    //   );
    //   return;
    // }
    // if (!this.selectedDepartment) {
    //   this._notificationToasService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select a Department.',
    //   );
    //   return;
    // }
    // if (!this.selectedSubDepartment) {
    //   this._notificationToasService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select a Sub Department.',
    //   );
    //   return;
    // }
    // if (!this.selectedBusinessDomain) {
    //   this._notificationToasService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please select a Business Domain.',
    //   );
    //   return;
    // }

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

    this.isSubmitting = true;
    this._doumentRequestService.CreateDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response?.Success) {
          //clear all fields
          this.emptyFields();
          this.requestCreated.emit();
          this._doumentRequestService.refreshCounts$.next();

          this._notificationToasService.createNotification(
            'success',
            'User',
            'Document drafted successfully!',
          );
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this._notificationToasService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to draft document.',
        );
      },
    });
  }

  SubmitDocumentRequests() {
    if (!this.selectedDocumentRequestType) {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please select a Request Type.',
      );
      return;
    }
    if (!this.selectedCompany) {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please select a Company.',
      );
      return;
    }
    if (!this.documentName || this.documentName.trim() === '') {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please enter Document Name.',
      );
      return;
    }
    if (!this.selectedDocumentType) {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please select a Document Type.',
      );
      return;
    }
    if (!this.inputJustificationValue || this.inputJustificationValue.trim() === '') {
      this._notificationToasService.createNotification(
        'warning',
        'Validation',
        'Please enter Justification.',
      );
      return;
    }

    if (!this.selectedTemplateType) {
      this._notificationToasService.createNotification(
        'warning',
        'Template Missing',
        'Please first upload the template against this Document Type.',
      );
      return;
    }

    // UC-22: Revision Validation Checks
    if (this.selectedDocumentRequestType == '2' || this.selectedDocumentRequestType == 'DRT-0002') {
      if (!this.selectedDocumentRow) {
        this._notificationToasService.createNotification(
          'warning',
          'Validation',
          'Please select an existing document to revise.',
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

    // if (
    //   (this.selectedTemplateType === '1' || this.selectedTemplateType === '2') &&
    //   !this.draftFile
    // ) {
    //   this._notificationToasService.createNotification(
    //     'warning',
    //     'Validation',
    //     'Please upload your drafted document before submitting.',
    //   );
    //   return;
    // }

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

    this.isSubmitting = true;
    this._doumentRequestService.CreateAndSubmitDraftDocumentRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response?.Success) {
          //clear all fields
          this.emptyFields();
          this.requestCreated.emit();
          this._doumentRequestService.refreshCounts$.next();
          this._notificationToasService.createNotification(
            'success',
            'User',
            'Document Request submitted successfully!',
          );
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this._notificationToasService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to submit document.',
        );
      },
    });
  }

  emptyFields() {
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
    this.draftFileUrl = '';
    this.draftFile = null;
    this.displayDocumentType = '';
    this.displayDivision = '';
    this.displayDepartment = '';
    this.displaySubDepartment = '';
    this.displayBusinessDomain = '';
    this.distributionListPayload = [];
    this.distributionUserList = [];
    this.selectedDocumentRow = null;
    this.showDocumentDiv = false;
    this.showDocumentCreationDiv = false;
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
  }

  downloadDraft(): void {
    if (this.draftFileUrl) {
      window.open(this.draftFileUrl, '_blank');
    } else {
      this._notificationToasService.createNotification(
        'warning',
        'Download',
        'No existing document available for download.',
      );
    }
  }

  GetEffectiveDocumentsForRevision(query?: any) {
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

    this._doumentRequestService.GetEffectiveDocumentsForRevision(payload).subscribe({
      next: (response) => {
        if (response?.Success || response?.Data) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.documentRevisionData = items.map((item: any) => ({
            Id: item.id || item.Id,
            companyId: item.companyId || item.CompanyId,
            company: item.Company || item.company,
            requestNumber: item.RequestNumber || item.requestNumber,
            documentTypeCode: item.DocumentTypeCode || item.documenttypecode,
            documentType: item.DocumentType || item.documenttype,
            proposedDocumentNumber: item.RequestNumber || item.requestNumber || item.documentnumber,
            stepId: item.StepId || item.stepId,
            stepOrder: item.StepOrder || item.stepOrder,
            startedAt: item.StartedAt || item.startedAt,
            division: item.Division || item.division,
            divisionCode: item.DivisionCode || item.divisionCode || item.divisioncode,
            documentId: item.DocumentNumber || item.documentid,
            documentName: item.DocumentName || item.documentname || item.title,
            proposedContent: item.ProposedContent || item.proposedcontent || item.content,
            department: item.Department || item.department,
            departmentCode: item.DepartmentCode || item.departmentCode || item.departmentcode,
            subdepartment: item.SubDepartment || item.subdepartment,
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
            requestCreatedBy: item.CreatedByName || item.createdByName,
            // previousVersionCreatedBy: item.LastModifiedByName || item.lastmodifiedbyname,
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
            draftFileUrl:
              item.DraftFileUrl ||
              item.draftFileUrl ||
              (String(item.TemplateType || item.templateType) === '1' ||
              String(item.TemplateType || item.templateType) === '2'
                ? item.ProposedContent || item.proposedcontent
                : ''),
            // Map backend fields back to the frontend keys expected by the component
            distributionListPayload: (item.DistributionList || item.distributionList || []).map(
              (x: any) => ({
                ...x,
                level1Id: x.divisionCode || x.DivisionCode || x.level1Id,
                level2Id: x.departmentCode || x.DepartmentCode || x.level2Id,
                level3Id: x.subDepartmentCode || x.SubDepartmentCode || x.level3Id,
                level4Id: x.businessDomainCode || x.BusinessDomainCode || x.level4Id,
                roleId: x.roleId || x.RoleId,
                distributiontypeId:
                  x.distributionTypeId || x.DistributionTypeId || x.distributiontypeId,
              }),
            ),
            distributionUserList: item.UserList || item.userList || [],
          }));
        } else {
          this.documentRevisionData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this.documentRevisionData = [];
        this.totalRows = 0;
        this._notificationToasService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to fetch draft documents.',
        );
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
    this.documentName = row.documentName || row.title || '';
    this.inputJustificationValue = row.justification;
    this.templateHtml = row.proposedContent || row.content || '';
    this.originalContentHtml = row.proposedContent || row.content || '';

    this.selectedTemplateType = row.templateType?.toString() || '';
    this.templateFileUrl = row.templateFileUrl || '';
    this.draftFileUrl = row.draftFileUrl || row.url || '';

    this.displayDocumentType = row.documentType || '';
    this.displayDivision = row.division || '';
    this.displayDepartment = row.department || '';
    this.displaySubDepartment = row.subdepartment || row.subDepartment || '';
    this.displayBusinessDomain = row.businessdomain || row.businessDomain || '';

    this.selectedDocumentType = row.documentTypeCode || row.documentType;
    this.selectedDivisions = row.divisionCode || row.level1Id || row.division;
    this.selectedDepartment = row.departmentCode || row.level2Id || row.department;
    this.selectedSubDepartment = row.subDepartmentCode || row.level3Id || row.subdepartment;
    this.selectedBusinessDomain = row.businessDomainCode || row.level4Id || row.businessdomainId;

    // ✅ Populate Distribution List
    this.distributionListPayload = row.distributionListPayload || [];

    // ✅ Populate Users
    this.distributionUserList = row.distributionUserList || [];

    if (this.selectedDocumentType) {
      this.GetTemplate(this.selectedDocumentType, true); // <--- Add this line
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
        entityType: 'Request',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1000,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  reviewDraftedFile(): void {
    if (this.draftFile) {
      const fileURL = URL.createObjectURL(this.draftFile);
      window.open(fileURL, '_blank');
      // Revoke the object URL after some time to free up memory
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
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

  removeDraftedFile(): void {
    this.draftFile = null;
    this.draftFileUrl = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
