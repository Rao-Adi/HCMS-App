import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CustomizeEmailAlertService } from '@app/shared/services/customize-email-alerts.service';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

interface AlertGridItem {
  id: number;
  isActive: boolean;
  alertName: string;
  scheduleFrequency: string;
  scheduleTime: string;
  recipientEmail: string;
  lastSavedBy: string;
  lastSavedOn: string | Date | null;
}

@Component({
  selector: 'app-personalized-email-alerts',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    NzCheckboxModule,
    CabinetStructureList,
    DocumentTypeList,
    ReactiveFormsModule,
    AgGridWrapper,
    NzModalModule,
  ],
  templateUrl: './personalized-email-alerts.html',
  styleUrl: './personalized-email-alerts.css',
})
export class PersonalizedEmailAlerts implements OnInit {
  alertForm!: FormGroup;
  showForm: boolean = false;

  // Grid Configuration
  pageSize = 10;
  selectedPageSize = 10;
  gridRowData: any[] = [];
  totalEmailAlerts = 0;

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';

  gridColumnDefs: ColDef[] = [
    { field: 'name', headerName: 'Alert Name', flex: 1 },
    { field: 'frequency', headerName: 'Frequency', width: 150 },
    { field: 'deliveryFormat', headerName: 'Delivery Format', flex: 1 },
  ];

  // Mock Dropdown Lists (Real app mein yeh APIs se ayengi)
  divisions = [
    { id: 1, name: 'Division A' },
    { id: 2, name: 'Division B' },
  ];
  departments = [
    { id: 1, name: 'IT' },
    { id: 2, name: 'HR' },
    { id: 5, name: 'Finance' },
  ];
  subDepartments = [
    { id: 1, name: 'Software Development' },
    { id: 2, name: 'QA' },
  ];
  documentTypes = [
    { id: 1, name: 'Invoice' },
    { id: 2, name: 'Contract' },
    { id: 3, name: 'Policy' },
  ];
  pendingStates = ['Approval', 'Review', 'Draft'];
  frequencies = ['Daily', 'Weekly', 'Monthly'];
  deliveryFormats = ['Embedded in Email Body', 'Send as Attachment'];

  // Available Tokens/Variables for Template Editor
  dynamicTokens = [
    { token: '{DocumentName}', label: 'Document Name' },
    { token: '{DocumentLink}', label: 'Document Link' },
    { token: '{DocumentType}', label: 'Document Type' },
    { token: '{PendingDays}', label: 'Pending Days' },
    { token: '{ReviewDays}', label: 'Review Days' },
    { token: '{Status}', label: 'Status' },
    { token: '{RecipientName}', label: 'Recipient Name' },
  ];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pendingRequestApprovalColumnDefs: ColDef[] = [
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'alertName', headerName: 'Alert Name', flex: 1 },
    { field: 'schedule', headerName: 'Schedule', flex: 1 },
    { field: 'lastSavedBy', headerName: 'Last Saved By', flex: 1 },
    { field: 'lastSavedOn', headerName: 'Last Saved On', flex: 1 },
  ];

  currentUserEmail = 'asad.iqbal@atcolab.com';
  // Grid Data Array matching image_846444.png structure
  alertsList: AlertGridItem[] = [];

  constructor(
    private fb: FormBuilder,
    private _notificationToastService: NotificationToastService,
    private _customizeEmailAlertService: CustomizeEmailAlertService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.GetAllCustomizeEmailAlerts();
  }

  private initForm(): void {
    this.alertForm = this.fb.group({
      companyId: [1, Validators.required], // Set default/current tenant context
      name: ['', [Validators.required, Validators.maxLength(255)]],

      // Cabinet Scope
      divisionId: [null],
      departmentId: [null],
      subDepartmentId: [null],
      documentType_id: [null],

      // Filter Criteria
      pendingState: ['Approval'],
      pendingDays: [''],
      reviewWithinDays: [''],
      inactiveDays: [''],
      statusChangedTo: [null],
      lookbackDays: [''],

      // Recipient Settings
      recipientType: ['self'], // 'self' or 'custom'
      customEmails: [''], // Comma separated string or tags
      ccEmails: [''],

      // Schedule Settings
      frequency: ['Daily', Validators.required],
      sendAtTime: ['09:00', Validators.required],

      // Format & Templates
      deliveryFormat: ['Embedded in Email Body', Validators.required],
      emailSubject: ['', Validators.required],
      emailBody: ['', Validators.required],
    });
  }

  // Token Insertion logic inside textareas
  insertToken(token: string, targetField: 'emailSubject' | 'emailBody'): void {
    const currentValue = this.alertForm.get(targetField)?.value || '';
    this.alertForm.get(targetField)?.setValue(currentValue + ' ' + token);
  }

  onCreateNew(): void {
    this.showForm = true;
    this.alertForm.reset();
    // Set default initial values for the form
    this.alertForm.patchValue({
      companyId: 1,
      recipientType: 'self',
      frequency: 'Daily',
      sendAtTime: '09:00',
      deliveryFormat: 'Embedded in Email Body',
    });
  }

  onBackToGrid(): void {
    this.showForm = false;
  }

  onCancel(): void {
    console.log('Cancelled');
    this.onBackToGrid();
  }

  onSaveAlert(): void {
    if (this.alertForm.valid) {
      const formValue = this.alertForm.value;

      const recipients: any[] = [];
      if (formValue.recipientType === 'self') {
        recipients.push({
          emailaddress: this.currentUserEmail,
          recipienttype: 'To',
          isself: true,
        });
      } else {
        if (formValue.customEmails) {
          const toEmails = formValue.customEmails.split(',').map((e: string) => e.trim()).filter((e: string) => e);
          toEmails.forEach((email: string) => {
            recipients.push({ emailaddress: email, recipienttype: 'To', isself: false });
          });
        }
        if (formValue.ccEmails) {
          const ccEmails = formValue.ccEmails.split(',').map((e: string) => e.trim()).filter((e: string) => e);
          ccEmails.forEach((email: string) => {
            recipients.push({ emailaddress: email, recipienttype: 'Cc', isself: false });
          });
        }
      } 
      const payload = {
        name: formValue.name,
        isactive: true,
        pendingstate: formValue.pendingState || '',
        pendingdays: Number(formValue.pendingDays) || 0,
        reviewwithindays: Number(formValue.reviewWithinDays) || 0,
        inactivedays: Number(formValue.inactiveDays) || 0,
        statuschangedto: formValue.statusChangedTo || '',
        lookbackdays: Number(formValue.lookbackDays) || 0,
        frequency: formValue.frequency || '',
        sendattime: formValue.sendAtTime || '',
        deliveryformat: formValue.deliveryFormat || '',
        emailsubject: formValue.emailSubject || '',
        emailbody: formValue.emailBody || '',
        scopes: [
          {
            divisioncode: this.selectedDivisions || '',
            departmentcode: this.selectedDepartment || '',
            subdepartmentcode: this.selectedSubDepartment || '',
            businessdomaincode: this.selectedBusinessDomain || '',
          },
        ],
        recipients: recipients,
      };

      console.log('Production Ready API Payload Context:', payload);

      this._customizeEmailAlertService.create(payload).subscribe({
        next: (res) => {
          if (res?.Success) {
            this._notificationToastService.createNotification('success', 'Success', 'Alert created successfully.');
            this.showForm = false;
            this.GetAllCustomizeEmailAlerts();
          } else {
            this._notificationToastService.createNotification('error', 'Error', res?.Message || 'Failed to create alert.');
          }
        },
        error: (err) => {
          this._notificationToastService.createNotification('error', 'Error', 'An error occurred while creating the alert.');
        },
      });
    } else {
      // Mark all fields to trigger visual CSS error borders
      this.alertForm.markAllAsTouched();
    }
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    // this.divisionPageSize = pageSize;
    // this.GetAllDistributionList({
    //   pageNumber: 1,
    //   pageSize: this.selectedPageSize,
    //   sortModel: [], // or your current sort/filter model
    //   filterModel: {},
    // });
  }

  GetAllCustomizeEmailAlerts(query: any = {}) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.pageSize;
    const searchText = query?.searchText || '';

    const payload: any = {
      searchText: searchText,
      sortBy: sort?.sort?.toUpperCase() || 'DESC',
      sortColumn: sort?.colId || 'Id',
      pageNumber: pageNumber,
      pageSize: pageSize,
    };

    this._customizeEmailAlertService.GetAllCustomizeEmailAlerts(payload).subscribe({
      next: (res: any) => {
        if (res?.Success && res.Data?.Items) {
          this.totalEmailAlerts = res.Data.TotalCount;
          this.alertsList = res.Data.Items.map((item: any) => ({
            id: item.Id || item.id,
            isActive: item.IsActive ?? item.isActive ?? false,
            alertName: item.Name || item.name || 'Unknown',
            scheduleFrequency: item.Frequency || item.frequency || 'N/A',
            scheduleTime: item.SendAtTime || item.sendAtTime || 'N/A',
            recipientEmail: 'Configured Recipients', // Add default string as the response payload does not natively provide recipient email summaries
            lastSavedBy: item.CreatedByName || item.CreatedBy || item.createdBy || 'Unknown',
            lastSavedOn: item.UpdatedAt || item.updatedAt || item.CreatedAt || item.createdAt || null
          }));
        } else {
          this.alertsList = [];
          this.totalEmailAlerts = 0;
        }
      },
      error: (err: any) => {
        this.alertsList = [];
        this.totalEmailAlerts = 0;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to load email alerts',
        );
      },
    });
  }

  onSelectionChange(selectedRows: any[]) {
    // this.hasSelectedRows = selectedRows && selectedRows.length > 0;
    // this.selectedRow = selectedRows && selectedRows.length > 0 ? selectedRows[0] : null;
  }

  // Action Triggers
  onToggleStatus(alert: AlertGridItem): void {
    console.log(`Alert ID ${alert.id} status changed to: ${alert.isActive}`);
    // execution logic to call backend service endpoint updates
  }

  onEditAlert(alert: AlertGridItem): void {
    console.log('Editing Alert Configuration:', alert.id);
    // routing link navigation logic or modal open trigger
  }

  onDeleteAlert(alert: AlertGridItem): void {
    this.modal.confirm({
      nzTitle: 'Confirm Delete',
      nzContent: `Are you sure you want to delete "${alert.alertName}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.alertsList = this.alertsList.filter((item) => item.id !== alert.id);
        console.log('Alert Configuration deleted successfully from index logic');
      },
    });
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }

  // selectedTab: string = 'Filtering Criteria';

  // // --- PERMISSION FLAGS ---
  // canAdd = false;
  // canEdit = false;
  // canDelete = false;
  // formId = 'emailalertpolicy';

  // pageSize = 10;
  // rowData: any[] = [];
  // totalRows = 0;
  // checked = true;

  // selectedDivisions?: string = '';
  // selectedDepartment?: string = '';
  // selectedSubDepartment?: string = '';
  // selectedBusinessDomain?: string = '';
  // selectedDocumentType?: string = '';

  // constructor(private _permissionService: PermissionService) {}

  // ngOnInit() {
  //   this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
  //     this.canAdd = permissions.canAdd;
  //     this.canEdit = permissions.canEdit;
  //     this.canDelete = permissions.canDelete;
  //   });
  // }

  // // Default Column Definitions: Apply configuration across all columns
  // defaultColDef: ColDef = {
  //   filter: true,
  //   cellDataType: false,
  // };
  // public noRowsOverlay: string = '';

  // emailFrequencies: SelectList[] = [
  //   { CODE: '1', NAME: 'Marketing Division' },
  //   { CODE: '2', NAME: 'Software Division' },
  // ];
  // companies: SelectList[] = [
  //   { CODE: '1', NAME: 'ATCO' },
  //   { CODE: '2', NAME: 'Softronic' },
  // ];
  // emailtobesend: SelectList[] = [
  //   { CODE: '1', NAME: 'Marketing' },
  //   { CODE: '2', NAME: 'IT' },
  //   { CODE: '3', NAME: 'Finance' },
  //   { CODE: '4', NAME: 'HR' },
  // ];
  // emailnumberdays: SelectList[] = [
  //   { CODE: '1', NAME: '1' },
  //   { CODE: '2', NAME: '2' },
  // ];

  // atributeTypes: SelectList[] = [
  //   { CODE: '1', NAME: 'Submit date' },
  //   { CODE: '2', NAME: 'Document Descriptoin' },
  //   { CODE: '3', NAME: 'Contract Type' },
  // ];

  // selectedAuthorityType: number | null = null;

  // onAuthorityTypeChange(value: number | null): void {
  //   this.selectedAuthorityType = value;
  // }

  // onDivisionChange(value: string): void {
  //   this.selectedDivisions = value;
  //   this.selectedDepartment = '';
  //   this.selectedSubDepartment = '';
  // }
  // onDepartmentsChange(value: string): void {
  //   this.selectedDepartment = value;
  //   this.selectedSubDepartment = '';
  // }

  // onDocumentTypeChange(value: string): void {
  //   // this.loading = true;
  //   this.selectedDocumentType = value;
  // }

  // onHierarchyChange(values: CabinetSelection[]) {
  //   this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
  //   this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
  //   this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
  //   this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  // }
}
