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
import { CabinetSelection, SelectList } from '@app/shared/interfaces/interfaces';
import { DocumentRequestTypeService } from '@app/shared/services/document-request-type.service';
import { CompanyService } from '@app/shared/services/company.service';
import { DRDistributionList } from '../drdistribution-list/drdistribution-list';
import { DRUsersComponent } from '../drusers-component/drusers-component';
import { DocumentsComponent } from '../documents-component/documents-component';
import { NotificationService } from '@app/shared/notification/notification.service';
import { TemplateService } from '@app/shared/services/template.service';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { DocumentRequestService } from '@app/shared/services/document-request.service';

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
    DocumentsComponent,
    CabinetStructureList,
  ],
  templateUrl: './document-request-form.html',
  styleUrl: './document-request-form.css',
})
export class DocumentRequestForm {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() draftData: any;

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

  employees: any[] = [];
  selectedEmployee?: string = '';
  documentRequestsData: any[] = [];

  distributionListPayload: any[] = [];

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
    private _notification: NotificationService,
    private _doumentRequestService: DocumentRequestService,
    private _documentTemplateService: TemplateService,
    private _documentAttributeService: DocumentAttributeService,
    private _workflowStepService: WorkflowStepService,
  ) {}

  ngOnInit() {
    this.getAllDocumentRequestTypes();
    this.getAllCompanies();
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

  onCompanyChange(value: string | null) {
    this.selectedCompany = value;
  }

  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    if (value != null) {
      this.selectedDocumentType = value;

      //Get Template
      this.GetTemplate(this.selectedDocumentType);

      const payLoad = {
        companyId: MASTER_DEFAULT_KEYS.COMPANYID,
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
      CreatedByUserId: 1, // this will be bind with UserId
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
      CompanyId: this.selectedCompany,
      RequestId: this.selectedDocumentRequestType,
      SubmittedBy: this.selectedDocumentType || null,
      DistributionList: this.distributionListPayload,
      UserIds: [],
    };

    // const payLoad = {
    //   CompanyId: MASTER_DEFAULT_KEYS.COMPANYID,
    //   requestId: this.selectedDocumentRequestType,
    //   submittedBy: this.selectedDocumentType || null,
    // };

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
}
