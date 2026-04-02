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
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { DRDistributionList } from './drdistribution-list/drdistribution-list';
import { DRUsersComponent } from './drusers-component/drusers-component';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { DocumentsComponent } from './documents-component/documents-component';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { CabinetSelection, SelectList } from '@app/shared/interfaces/interfaces';
import { DocumentRequestTypeService } from '@app/shared/services/document-request-type.service';
import { CompanyService } from '@app/shared/services/company.service';
import { PendingRequestForApproval } from './pending-request-for-approval/pending-request-for-approval';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NotificationService } from '@app/shared/notification/notification.service';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { TemplateService } from '@app/shared/services/template.service';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestForm } from './document-request-form/document-request-form';
import { DraftRequestList } from './draft-request-list/draft-request-list';
import { UtilitiesService } from '@app/core/services/utilities.service';

@Component({
  selector: 'app-document-request-management',
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
    DocumentsComponent,
    CabinetStructureList,
    PendingRequestForApproval,
    DocumentRequestForm,
    DraftRequestList,
  ],
  templateUrl: './document-request-management.html',
  styleUrl: './document-request-management.css',
})
export class DocumentRequestManagement { 

  selectedTab: string = 'NewRequest';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType: string = '';
  inputJustificationValue?: string;
  documentName?: string = '';
  templateHtml: string = '';
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: true,
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
  loginEmpId: string = '';

  employees: any[] = [];
  selectedEmployee?: string = '';
  documentRequestsData: any[] = [];

  distributionListPayload: any[] = [];

  workflowAuthoritiesColumnDefs = [
    { field: 'approvalSequence', headerName: 'Approval Sequence', flex: 1 },
    { field: 'employeeCode', headerName: 'Employee Code', flex: 1 },
    { field: 'employeeName', headerName: 'Employee Name', flex: 1 },
    { field: 'division', headerName: 'Division', flex: 1 },
    { field: 'department', headerName: 'Department', flex: 1 },
    { field: 'subDepartment', headerName: 'Sub-Department', flex: 1 },
  ];

  workflowAuthoritiesData: any[] = [
    {
      approvalSequence: 1,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
    {
      approvalSequence: 2,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
    {
      approvalSequence: 3,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
  ];

  companies: any[] = [];
  requestTypes: any[] = [];
  approvalSequenceData: any[] = [];

  filters: SelectList[] = [
    { CODE: '1', NAME: 'Over Due' },
    { CODE: '2', NAME: 'Less than 30 days' },
  ];

  constructor(
    private modal: NzModalService,
    private _documentRequestTypeService: DocumentRequestTypeService,
    private _companyService: CompanyService,
    private _doumentRequestService: DocumentRequestService,
    private _notification: NotificationService,
    private _documentTemplateService: TemplateService,
    private _documentAttributeService: DocumentAttributeService,
    private _workflowStepService: WorkflowStepService,
    private _UtilitiesService: UtilitiesService,
  ) {}

  ngOnInit() {
    this.getAllDocumentRequestTypes();
    this.getAllCompanies();
    this.GetLoginEmpId();
  }

  GetLoginEmpId() {
    this.loginEmpId = this._UtilitiesService.GetEmpid() || '';
  }
 
  onRequestTypeChange(value: string | null): void {
    this.selectedDocumentRequestType = value;
    if (this.selectedDocumentRequestType == '1' || this.selectedDocumentRequestType == 'DRT-0001') {
      this.showDocumentCreationDiv = true;
      this.showDocumentDiv = false;
    } else if (
      this.selectedDocumentRequestType == '2' ||
      this.selectedDocumentRequestType == 'DRT-0002'
    ) {
      this.showDocumentDiv = true;
      this.showDocumentCreationDiv = true;
    } else {
      this.showDocumentDiv = false;
      this.showDocumentCreationDiv = true;
    }
  }

  selectedWorkflowExclude: string | null = null;
  onWorkflowExcludeChange(value: string | null): void {
    this.selectedWorkflowExclude = value;
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
    if (value != null) {
      this.selectedDocumentType = value;

      //Get Template
      this.GetTemplate(this.selectedDocumentType);

      const payLoad = { 
        EntityType: 'Request',
        documentTypeCode: this.selectedDocumentType,
        divisionCode: this.selectedDivisions,
        departmentCode: this.selectedDepartment,
        subDepartmentCode: this.selectedSubDepartment,
        businessDomainCode: this.selectedBusinessDomain,
      };
      this._workflowStepService
        .getWorkflowStepByDocumentTypeCode(
          payLoad,
          // value,
          // this.selectedDocumentRequestType == '1' || this.selectedDocumentRequestType == 'DRT-0001'
          //   ? 1
          //   : this.selectedDocumentRequestType == '2' ||
          //       this.selectedDocumentRequestType == 'DRT-0002'
          //     ? 2
          //     : 3,
        )
        .subscribe((res) => {
          // console.log('User Details:', res);
          this.showExclusionTable = true;
          // this.totalDistribution = res?.Data ? res.Data.length : 0;
          this.approvalSequenceData = res?.Data ? res.Data : [];
        });
    } else {
      this.approvalSequenceData = [];
      this.selectedDocumentType = '';
      this.showExclusionTable = false;
    }
  }

  GetTemplate(value: string) {
    this._documentTemplateService.getTemplateByDocumentTypeCode(value).subscribe({
      next: (response) => {
        this.templateHtml = response.Data.TemplateContent;
        // Promise.resolve().then(() => {
        //   this.templateHtml = response.Data.TemplateContent;
        // });
      },
      error: (err) => console.error(err),
    });

    if (value === 'Select') {
      this.trainingContent = true;
    }
  }

  onCompanyChange(value: string | null) {
    this.selectedCompany = value;
  }

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

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

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
    const payLoad = {
      CompanyId: this.selectedCompany,
      DocumentRequestTypeCode: this.selectedDocumentRequestType,
      documentTypeCode: this.selectedDocumentType || null,
      documentName: this.documentName || '',
      justification: this.inputJustificationValue || '',
      proposedContent: this.templateHtml || '',
      divisionCode: this.selectedDivisions || null,
      departmentCode: this.selectedDepartment || null,
      subDepartmentCode: this.selectedSubDepartment || null,
      businessDomainCode: this.selectedBusinessDomain || null,
      CreatedByUserId: this.loginEmpId,
      distributionList: this.distributionListPayload,
      userids: [],
    };

    this._doumentRequestService.CreateDraftDocumentRequest(payLoad).subscribe({
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

  SubmiteDocumentRequests() {
    const payLoad = {
      requestId: this.selectedDocumentRequestType,
      submittedBy: this.selectedDocumentType || null,
    };

    this._doumentRequestService.SubmitDraftDocumentRequest(payLoad).subscribe({
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

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  GetAllPendingDocuments(query: any) {
    const payload = {
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      employeeCode: this.selectedEmployee,
    };
    this._doumentRequestService.getMyPendingDocumentRequest(payload).subscribe({
      next: (response) => {
        if (response?.Success) {
          if (response?.Data) {
            this.totalRows = response.Data.TotalCount;
            this.documentRequestsData = response.Data.map((item: any) => ({
              Id: item.id || item.Id,
              requestId: item.Id || item.id,
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
              requestCreatedBy: item.createdBy || item.CreatedBy || '',
              dateOfCreation: new CustomDateFormatPipe().transform(
                item.createdAt || item.CreatedAt || '',
              ),
              requestCreatedOn: new CustomDateFormatPipe().transform(
                item.createdAt || item.CreatedAt || '',
              ),
              previousVersionCreatedOn:
                item.draftContentLastModifiedAt || item.DraftContentLastModifiedAt || '',
              proposedVersionNumber: item.RowVersion || item.rowVersion,
            }));
          } else {
          }
        }
      },
      error: (err) => {
        this._notification.createNotification(
          'error',
          'Error',
          err?.Message || 'Failed to fetch pending documents.',
        );
      },
    });
  }
 

  emptyFields() {
    this.selectedRequestType = '';
    this.selectedCompany = '';
    this.documentName = '';
    this.inputJustificationValue = '';
    this.selectedDocumentType = '';
    this.selectedDivisions = '';
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.selectedBusinessDomain = '';
    this.templateHtml = '';
  }

  onDistributionChanged(list: any[]) {
    this.distributionListPayload = list;
  }
}
