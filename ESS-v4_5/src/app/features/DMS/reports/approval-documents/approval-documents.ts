import { CommonModule } from '@angular/common';
import { Component, ViewChild, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { BehaviorSubject } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, ColumnToggle, SelectList } from '@app/shared/interfaces/interfaces';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { PermissionService } from '@app/shared/services/permission.service';
import { DocumentService } from '@app/shared/services/document.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { WorkflowApprovalHistoryComponent } from '@app/shared/Dialog/workflow-approval-history-component/workflow-approval-history-component';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-approval-documents',
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
    NzModalModule,
    NzDatePickerModule,
    CabinetStructureList,
    DocumentTypeList,
  ],
  templateUrl: './approval-documents.html',
  styleUrl: './approval-documents.css',
  styles: [
    `
      nz-date-picker,
      nz-range-picker {
        margin: 0 8px 12px 0;
      }
    `,
  ],
})
export class ApprovalDocuments {
  @ViewChild('distributionListModalTpl') distributionListModalTpl!: TemplateRef<any>;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'viewapproved';

  plainFooter = 'plain extra footer';
  footerRender = (): string => 'extra footer';
  dateFormat = 'dd/MMM/yyyy';
  pageSize = 10;
  documentRequestsData: any[] = [];
  totalRows = 0;

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 1,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

  loading = false;
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser?: string;
  documentTypeData: any[] = [];

  selectedUserDistributions: any[] = [];

  requestCreators: SelectList[] = [
    { CODE: '1', NAME: 'Ali' },
    { CODE: '2', NAME: 'Ahmed' },
    { CODE: '3', NAME: 'Naveed' },
  ];

  authorityTypes: SelectList[] = [
    { CODE: '1', NAME: 'Reporting to Levels' },
    { CODE: '2', NAME: 'Employee' },
    { CODE: '3', NAME: 'Role' },
    { CODE: '4', NAME: 'Designation' },
    { CODE: '5', NAME: 'Head of Division' },
    { CODE: '6', NAME: 'Head of Department' },
    { CODE: '7', NAME: 'Head of Sub-Department' },
  ];

  columnToggles?: ColumnToggle[] = [
    { field: 'requestId', label: 'Request ID', visible: false },
    { field: 'documentType', label: 'Document Type', visible: true },
    { field: 'documentName', label: 'Document Name', visible: true },
    { field: 'version', label: 'Version', visible: true },
    { field: 'division', label: 'Division', visible: true },
    { field: 'department', label: 'Department', visible: true },
    { field: 'subDepartment', label: 'Sub-Department', visible: true },
    { field: 'url', label: 'URL', visible: true },
    { field: 'distributionList', label: 'Distribution List', visible: true },
    { field: 'requestCreatedBy', label: 'Request Created By', visible: true },
    { field: 'requestCreatedOn', label: 'Request Created On', visible: true },
    { field: 'previousVersionCreatedBy', label: 'Previous Version Created By', visible: true },
    { field: 'previousVersionCreatedOn', label: 'Previous Version Created On', visible: true },
    { field: 'approvalHistory', label: 'Approval History', visible: true },
    { field: 'revisionHistory', label: 'Revision History', visible: true },
  ];

  documentsColumnDefs = [
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'url', headerName: 'URL' },
    {
      field: 'distributionList',
      headerName: 'Distribution List',
      editable: false,
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
        this.openDistributionListModal(event.data);
      },
    },
    { field: 'requestCreatedBy', headerName: 'Request Created By' },
    { field: 'requestCreatedOn', headerName: 'Request Created On' },
    { field: 'previousVersionCreatedBy', headerName: 'Previous Version Created By' },
    { field: 'previousVersionCreatedOn', headerName: 'Previous Version Created On' },
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
            View
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
        this.openWorkflowDeatilsModal(event.data);
      },
    },
  ];

  radioValue = '';
  // single state

  constructor(
    private _permissionService: PermissionService,
    private _documentService: DocumentService,
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });
  }

  public noRowsOverlay: string = '';

  selectedAuthorityType: number | null = null;

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
  }

  selectedWorkflowExclude: number | null = null;
  onWorkflowExcludeChange(value: number | null): void {
    this.selectedWorkflowExclude = value;
  }

  GetAllPendingDocuments(query?: any) {
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

    const payLoad = {
      divisionCode: this.selectedDivisions,
      departmentCode: this.selectedDepartment,
      subDepartmentCode: this.selectedSubDepartment,
      businessDomainCode: this.selectedBusinessDomain,
      documentTypeCode: this.selectedDocumentType,
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      searchTerm: this.currentGridQuery.searchTerm || '',
      // Map to satisfy backend validation
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: this.currentGridQuery.searchTerm || '',
    };

    this._documentService.GetApprovedEffectiveDocuments(payLoad).subscribe({
      next: (response) => {
        if (response?.Success) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.documentRequestsData = items.map((item: any) => {
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
              RequestId: get(['requestid', 'Requestid']),
              documentId: get(['Id', 'id']), // often same as Id
              stepId: get(['StepId', 'stepId']),
              stepOrder: get(['StepOrder', 'stepOrder']),
              ExecutionStatus: get(['ExecutionStatus', 'executionStatus'], 'Unknown'),

              // ──────────────────────────────────────────────
              // Document metadata
              // ──────────────────────────────────────────────
              documentType: get(['DocumentType', 'documenttype']),
              documentTypeCode: get(['DocumentTypeCode', 'documenttypecode']),
              documentName: get(['Title', 'title', 'documentname']),
              version: get(['Version', 'version', 'proposedVersionNumber']),
              company: get(['Company', 'company'], ''),
              proposedDocumentNumber: get(['DocumentNumber', 'documentnumber']),
              proposedVersionNumber: get(['ProposedVersionNumber', 'proposedVersionNumber'], '1.0'), // fallback

              // ──────────────────────────────────────────────
              // Organizational context
              // ──────────────────────────────────────────────
              division: get(['Division', 'division']),
              department: get(['Department', 'department']),
              departmentId: get(['DepartmentCode', 'departmentcode']),
              subDepartment: get(['SubDepartment', 'subdepartment']),
              subDepartmentId: get(['SubDepartmentCode', 'subdepartmentcode']),
              businessDomain: get(['BusinessDomain', 'businessdomain']),
              businessDomainId: get(['BusinessDomainCode', 'businessdomaincode']),
              // ──────────────────────────────────────────────
              // Content / Justification
              // ──────────────────────────────────────────────

              proposedContent: get(['VersionContent', 'ProposedContent', 'Content'], ''),
              url: get(['DocumentURL', 'documenturl', 'DraftFileURL', 'draftFileURL']),

              // ──────────────────────────────────────────────
              // Audit / History fields
              // ──────────────────────────────────────────────
              requestCreatedBy: get(['CreatedByName', 'createdbyname', 'RequestCreatedBy']),
              dateOfCreation: new CustomDateFormatPipe().transform(createdAtRaw), // ← see helper below
              requestCreatedOn: new CustomDateFormatPipe().transform(
                get(['CreatedAt', 'createdat', 'RequestCreatedAt']),
              ),
              startedAt: new CustomDateFormatPipe().transform(startedAtRaw),

              // Previous version info (only if present in real payloads)
              previousVersionCreatedBy: get([
                'LastModifiedByName',
                'lastmodifiedbyname',
                'PreviousVersionCreatedBy',
              ]),
              previousVersionCreatedOn: new CustomDateFormatPipe().transform(
                get(['LastModifiedAt', 'lastmodifiedat', 'PreviousVersionCreatedOn']),
              ),

              // ──────────────────────────────────────────────
              // Placeholder / missing fields from your original
              // (add real data source when available)
              // ──────────────────────────────────────────────
              observation: '', // ← not in sample → populate when available
              requestedBy: get(['RequestedBy', 'requestedBy'], get(['CreatedBy'])),
              dateOfApproval: '', // ← not present
              approvalHistory: true, // Used to render the link in the cell
              distributionList: true,
              userDistributions: get(['UserDistributions', 'userdistributions', 'userDistributions'], []),
            };
          });
        } else {
          this.documentRequestsData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this.documentRequestsData = [];
        this.totalRows = 0;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          'Failed to fetch documents.',
        );
      },
    });
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
    this.selectedDocumentType = value;
  }

  GetAllDocuments(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'documentGrid':
        this.divisionPageSize = pageSize;
        this.GetAllDocuments({
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

  openWorkflowDeatilsModal(rowData: any) {
    //console.log('Row clicked:', rowData);
    const modalRef = this.modal.create({
      nzTitle: 'Workflow History',
      nzContent: WorkflowApprovalHistoryComponent,
      nzData: {
        id: rowData.RequestId,
        entityType: 'Document',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }

  openDistributionListModal(rowData: any) {
    this.selectedUserDistributions = rowData.userDistributions || [];
    this.modal.create({
      nzTitle: 'User Distributions',
      nzContent: this.distributionListModalTpl,
      nzFooter: null,
      nzWidth: 800,
    });
  }
}
