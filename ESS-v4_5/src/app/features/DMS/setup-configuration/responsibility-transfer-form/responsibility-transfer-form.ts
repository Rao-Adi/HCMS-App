import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { BehaviorSubject } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { UserService } from '@app/shared/services/user-service';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { NotificationService } from '@app/shared/notification/notification.service';
import { ResponsibilityTransferService } from '@app/shared/services/responsibility-transfer.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';

@Component({
  selector: 'app-responsibility-transfer-form',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    AgGridWrapper,
    NzDatePickerModule,
    NzUploadModule,
    NzCheckboxModule,
    NzInputModule,
    NzModalModule,
  ],
  templateUrl: './responsibility-transfer-form.html',
  styleUrl: './responsibility-transfer-form.css',
})
export class ResponsibilityTransferForm {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

  public noRowsOverlay: string = '';
  footerRender = (): string => 'extra footer';
  dateFormat = 'dd/MMM/yyyy';
  selectedTab: string = 'Request';
  switchValue1 = false;
  switchValue2 = false;
  loading = false;
  showExclusionTable = false;
  searchChange$ = new BehaviorSubject('');

  attachment: File | null = null;

  selectedEmployeeFrom?: any = '';
  selectedEmployeeTo?: any = '';
  selectedReasonForTransfer?: any = '';
  selectedEffectiveDateFrom: Date | null = null;
  selectedEffectiveDateTo: Date | null = null;
  remarks?: any;
  // single state
  activeMode: 'manual' | 'integration' | null = null;
  isPermanentTransfer: boolean = false;

  totalPendingApprovals = 0;

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  pageSize = 10;
  rowData: any[] = [];
  employees: any[] = [];
  filteredEmployeesTo: any[] = [];
  totalRows = 0;

  // Approval Action Variables
  hasSelectedRows = false;
  selectedRow: any = null;
  observation = '';

  uploading = false;
  statues: any[] = [
    { id: '1', text: 'Pending' },
    { id: '2', text: 'Approved' },
    { id: '3', text: 'Rejected' },
  ];
  reasonForTransfer: SelectList[] = [
    { CODE: '1', NAME: 'Leave' },
    { CODE: '2', NAME: 'Resignation' },
    { CODE: '3', NAME: 'Role Transition/Promotion' },
  ];

  selectedStatus: string = '1';

  pendingRequestApprovalColumnDefs: ColDef[] = [
    { field: 'requestor', headerName: 'Requestor', flex: 1 },
    { field: 'from', headerName: 'From', flex: 1 },
    { field: 'To', headerName: 'To', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 1 },
    { field: 'effectiveDateFrom', headerName: 'Effective From', flex: 1 },
    { field: 'effectiveDateTo', headerName: 'Effective To', flex: 1 },
    { field: 'remarks', headerName: 'Remarks', flex: 1 },
    { field: 'actionDate', headerName: 'Action Date', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      cellClassRules: {
        'rag-green': (params) => params.value === 'Approved' || params.value === 'Controlled',
        'rag-blue': (params) => params.value === 'Rejected',
        'rag-red': (params) => params.value === 'Pending',
      },
    },
  ];

  pendingApprovalData: any[] = [];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  constructor(
    private _userService: UserService,
    private _notification: NotificationService,
    private _responsibilityTransfer: ResponsibilityTransferService,
    private _utilityService: UtilitiesService,
    private _peoplePartnerService: PeoplePartnersService
  ) {}

  ngOnInit() {
    this.getAllUsersList();
  }

  private getStatusText(statusId: any): string {
    const statusMap: { [key: string]: string } = {
      '1': 'Pending',
      '2': 'Approved',
      '3': 'Rejected',
      '4': 'Reverted',
    };
    // Using `String()` to handle both number and string IDs from the API
    return statusMap[String(statusId)] || 'Unknown';
  }

  private getReasonText(reasonId: any): string {
    const reason = this.reasonForTransfer.find((r) => r.CODE === String(reasonId));
    return reason ? reason.NAME : 'N/A';
  }

  onTabChange(tab: string) {
    this.selectedTab = tab;
    // The AgGridWrapper will automatically trigger its data-loading event
    // when it is rendered into the DOM. Calling the API manually here causes a duplicate request.
    // if (tab === 'Approvals') {
    //   this.GetAllResponsibilityTransferForms();
    // }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.attachment = null;
      return;
    }

    this.attachment = input.files[0];
    console.log('Selected file:', this.attachment);
  }

  selectStatus(value: string): void {
    this.selectedStatus = value || '1';
    this.observation = '';
    this.hasSelectedRows = false;
    this.selectedRow = null;
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.GetAllResponsibilityTransferForms();
    }
  }

  GetAllResponsibilityTransferForms(query: any = {}) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.divisionPageSize;
    const searchText = query?.searchText || '';

    const payload = {
      searchtext: searchText,
      sortby: sort?.sort?.toUpperCase() || 'DESC',
      sortcolumn: sort?.colId || 'Id',
      isactive: true,
      pagenumber: pageNumber,
      pagesize: pageSize,
      status: Number(this.selectedStatus),
      userid: this._utilityService.GetUserEmpId() || '1',
    };

    this._responsibilityTransfer
      .GetMyResponsibilityTransfersApprovals(payload)
      .subscribe((res: any) => {
        if (res?.Success && res.Data?.Items) {
          this.totalPendingApprovals = res.Data.TotalCount;
          this.pendingApprovalData = res.Data.Items.map((item: any) => ({
            ...item,
            id: item.Id || item.id,
            requestor: item.createdby || item.CreatedBy || 'Unknown',
            from: item.employeefromname || item.employeefromname || 'Unknown',
            To: item.employeetoname || item.employeetoname || 'Unknown',
            reason: this.getReasonText(item.reasonfortransfer || item.ReasonForTransfer),
            effectiveDateFrom: new CustomDateFormatPipe().transform(
              item.effectivedatefrom || item.EffectiveDateFrom || '',
            ),
            effectiveDateTo: new CustomDateFormatPipe().transform(
              item.effectivedateto || item.EffectiveDateTo || '',
            ),
            remarks: item.remarks || item.Remarks || '',
            actionDate: new CustomDateFormatPipe().transform(
              item.actionDate || item.ActionDate || '',
            ),
            status: this.getStatusText(item.status || item.Status),
          }));
        } else {
          this.pendingApprovalData = [];
          this.totalPendingApprovals = 0;
        }
      });
  }

  addExclusion() {
    this.showExclusionTable = this.showExclusionTable == true ? false : true;
  }

  getAllUsersList = () => {
    this._peoplePartnerService.GetEmployeeList().subscribe((res) => {
      if (res?.Data) {
        this.employees = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
          DEPARTMENT: d.DepartmentCode || d.DepartmentId || 'Unknown', // Storing department for filtering
        }));
        this.filteredEmployeesTo = [...this.employees];

        // FSD UC-16: Default Employee From to logged-in user
        const currentUserCode = this._utilityService.GetUserEmpId();
        if (currentUserCode && this.employees.some((e) => e.CODE === currentUserCode)) {
          this.selectedEmployeeFrom = currentUserCode;
          this.onEmployeeFromChange(currentUserCode);
        }
      } else {
        this.employees = [];
        this.filteredEmployeesTo = [];
      }
    });
  };

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

  onSelectionChange(selectedRows: any[]) {
    this.hasSelectedRows = selectedRows && selectedRows.length > 0;
    this.selectedRow = selectedRows && selectedRows.length > 0 ? selectedRows[0] : null;
  }

  onEmployeeFromChange(empCode: string): void {
    this.selectedEmployeeTo = null; // Clear subsequent selection
    if (!empCode) {
      this.filteredEmployeesTo = [...this.employees];
      return;
    }

    const fromEmp = this.employees.find((e) => e.CODE === empCode);
    if (fromEmp) {
      // Filter to same department, excluding the "Employee From" themselves
      this.filteredEmployeesTo = this.employees.filter(
        (e) => e.DEPARTMENT === fromEmp.DEPARTMENT && e.CODE !== empCode,
      );
    }
  }

  onPermanentTransferChange(checked: boolean): void {
    this.isPermanentTransfer = checked;
    if (checked) {
      this.selectedEffectiveDateTo = null;
    }
  }

  submitRequest(data: any) {
    if (this.selectedEmployeeFrom === undefined || this.selectedEmployeeFrom === '') {
      this._notification.createNotification(
        'warning',
        'Responsibity Transfer',
        'Employee From required',
      );
      return;
    } else if (this.selectedEmployeeTo === undefined || this.selectedEmployeeTo === '') {
      this._notification.createNotification(
        'warning',
        'Responsibity Transfer',
        'Employee To required',
      );
    } else if (
      this.selectedReasonForTransfer === undefined ||
      this.selectedReasonForTransfer === ''
    ) {
      this._notification.createNotification(
        'warning',
        'Responsibity Transfer',
        'Reason For Transfer required',
      );
    }
    if (!this.selectedEffectiveDateFrom) {
      this._notification.createNotification(
        'warning',
        'Responsibity Transfer',
        'Effective Date From required',
      );
      return;
    } else if (this.remarks === undefined || this.remarks === '') {
      this._notification.createNotification(
        'warning',
        'Responsibility Transfer',
        'Remarks field is mandatory.',
      );
      return;
    }

    const formData = new FormData();
    formData.append('employeeFrom', this.selectedEmployeeFrom);
    formData.append('employeeTo', this.selectedEmployeeTo);
    formData.append('reasonForTransfer', this.selectedReasonForTransfer);
    formData.append(
      'effectiveDateFrom',
      this.selectedEffectiveDateFrom ? new Date(this.selectedEffectiveDateFrom).toISOString() : '',
    );

    formData.append(
      'effectiveDateTo',
      this.selectedEffectiveDateTo ? new Date(this.selectedEffectiveDateTo).toISOString() : '',
    );
    formData.append('remarks', this.remarks);
    //formData.append('NextReviewDate', new Date(rowData.nextReviewDate).toISOString());

    // ✅ FILE
    if (this.attachment) {
      formData.append('Attachment', this.attachment, this.attachment.name);
    }

    this._responsibilityTransfer.create(formData).subscribe(() => {
      this._notification.createNotification(
        'success',
        'Document',
        'Transfer request submitted successfully!',
      );
      this.cancel();
    });
  }

  cancel(): void {
    this.selectedEmployeeFrom = null;
    this.selectedEmployeeTo = null;
    this.selectedReasonForTransfer = null;
    this.selectedEffectiveDateFrom = null;
    this.selectedEffectiveDateTo = null;
    this.isPermanentTransfer = false;
    this.remarks = '';
    this.attachment = null;
    this.filteredEmployeesTo = [...this.employees];
  }

  submitWorkflowAction(actionType: string): void {
    if (!this.selectedRow) {
      this._notification.createNotification('warning', 'Warning', 'Please select a row first.');
      return;
    }

    if (!this.observation || this.observation.trim() === '') {
      this._notification.createNotification('error', 'Error', 'Observation is required');
      return;
    }

    const payload = {
      transferId: this.selectedRow.id || this.selectedRow.Id,
      action: actionType,
      observation: this.observation.trim(), 
    };

    this._responsibilityTransfer.takeAction(payload).subscribe({
      next: (res: any) => {
        if (res?.Success || res?.success) {
          this._notification.createNotification(
            'success',
            'Action Successful',
            res?.Message || `Request has been ${actionType.toLowerCase()}d.`,
          );
          this.GetAllResponsibilityTransferForms(); // Automatically refresh Grid
          this.observation = '';
          this.selectedRow = null;
        } else {
          this._notification.createNotification('error', 'Error', res?.Message || 'Action failed.');
        }
      },
      error: (err: any) => {
        this._notification.createNotification('error', 'Error', err?.Message || 'Action failed.');
      },
    });
  }

  export() {}

  approveDocument(action: string = 'Approved') {
    this.submitWorkflowAction('Approve');
  }

  disapprove(action: string = 'Rejected') {
    this.submitWorkflowAction('Rejected');
  }
}
