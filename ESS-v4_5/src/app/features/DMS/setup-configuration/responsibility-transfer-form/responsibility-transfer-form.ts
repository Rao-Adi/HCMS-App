import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SelectList } from '@app/shared/interfaces/interfaces'; 
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ResponsibilityTransferService } from '@app/shared/services/responsibility-transfer.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe'; 
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { NotificationToastService } from '@app/shared/notification/notification.service'; 
import { EditableAgGridWrapper } from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { 
  GetMyResponsibilityTransfersDto, 
  ResponsibilityTransferItem 
} from '@app/shared/services/responsibility-transfer.service';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';

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
    EditableAgGridWrapper
  ],
  templateUrl: './responsibility-transfer-form.html',
  styleUrl: './responsibility-transfer-form.css',
})
export class ResponsibilityTransferForm implements OnInit, OnDestroy {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;

  private subscriptions: Subscription[] = [];

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'responsibilitiestransfer';

  public noRowsOverlay: string = '';
  footerRender = (): string => 'extra footer';
  dateFormat = 'dd/MMM/yyyy';
  selectedTab: string = 'Requests';
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

  // "Requests pending My Approval" tab badge -- routed through NavigationCountsService (see
  // ngOnInit) so this page's badge and the "Responsibilities Transfer" sidebar badge never drift.
  responsibilityTransferApprovalCounts = {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    revertedCount: 0,
    totalCount: 0,
  };

  // "My Submitted Requests" tab badge -- a separate concern from the above (requests I created,
  // not requests pending on me as approver), fetched directly since there's no corresponding
  // sidebar item to keep in sync with.
  mySubmittedRequestsCount = 0;

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 10; // default value

  pageSize = 10;
  rowData: any[] = [];
  tempEmployees: any[] = [];
  employeeOptions: Array<{ label: string; value: string; department: string }> = [];
  filteredEmployeeToOptions: Array<{ label: string; value: string; department: string }> = [];
  totalRows = 0;

  // Approval Action Variables
  hasSelectedRows = false;
  selectedRow: any = null;
  observation = '';

  uploading = false;
  statues: any[] = [
    { id: '2', text: 'Approved' },
    { id: '1', text: 'Pending' },
    { id: '3', text: 'Rejected' },
  ];
  reasonForTransfer: SelectList[] = [
    { CODE: '1', NAME: 'Leave' },
    { CODE: '2', NAME: 'Resignation' },
    { CODE: '3', NAME: 'Role Transition/Promotion' },
  ];

  selectedStatus: string = '1';

  pendingRequestApprovalColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1 },
    { field: 'from', headerName: 'From', flex: 1 },
    { field: 'To', headerName: 'To', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 1 }, 
    { field: 'remarks', headerName: 'Remarks', flex: 1 }
  ]; 

  pendingApprovalData: any[] = [];

  submittedRequestColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1 }, 
    { field: 'from', headerName: 'From', flex: 1 },
    { field: 'To', headerName: 'To', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 1 },     
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
    { field: 'remarks', headerName: 'Comments', flex: 1 }, 
  ];

  submittedApprovalData: any[] = [];
  totalSubmittedApprovals = 0;

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  constructor(
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
    private _responsibilityTransfer: ResponsibilityTransferService,
    private _utilityService: UtilitiesService,
    private _peoplePartnerService: PeoplePartnersService,
    private _permissionService: PermissionService,
    private _navigationCountsService: NavigationCountsService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.getAllUsersList();
    });

    // "Requests pending My Approval" tab badge reflects the same shared count state the sidebar
    // menu uses (see NavigationCountsService), so this page and the "Responsibilities Transfer"
    // menu item never disagree.
    this.subscriptions.push(
      this._navigationCountsService.responsibilityTransferApprovalCounts$.subscribe((counts) => {
        this.responsibilityTransferApprovalCounts = {
          pendingCount: counts.pending,
          approvedCount: counts.approved,
          rejectedCount: counts.rejectedOrReverted,
          revertedCount: counts.rejectedOrReverted,
          totalCount: counts.pending + counts.approved + counts.rejectedOrReverted,
        };
      }),
    );

    this.getMyResponsibilityTransfersApprovalsCount();
    this.getMySubmittedResponsibilityTransfersCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getMyResponsibilityTransfersApprovalsCount(): void {
    // Fetches through the shared service; the ngOnInit subscription above applies the result
    // to this page's tab badge, and main-layout's own subscription applies the same result
    // to the "Responsibilities Transfer" sidebar badge.
    this._navigationCountsService.refreshResponsibilityTransferApprovalCounts();
  }

  getMySubmittedResponsibilityTransfersCount(): void {
    this._responsibilityTransfer.GetMySubmittedResponsibilityTransfersCount().subscribe({
      next: (res: any) => {
        if (res?.Success && res.Data) {
          this.mySubmittedRequestsCount = Number(res.Data.PendingCount ?? res.Data.pendingCount) || 0;
        }
      },
      error: () => {
        // Non-critical -- tab badge just stays at its last known value if this fails.
      },
    });
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
    if (!reasonId) return 'N/A';
    const strReason = String(reasonId);
    const reason = this.reasonForTransfer.find(
      (r) => r.CODE === strReason || r.NAME?.toLowerCase() === strReason.toLowerCase()
    );
    return reason?.NAME ? reason.NAME : strReason;
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
    //console.log('Selected file:', this.attachment);
  }

  selectStatus(value: string): void {
    this.selectedStatus = value || '1';
    this.observation = '';
    this.hasSelectedRows = false;
    this.selectedRow = null;
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      if (this.selectedTab === 'Requests pending My Approval') {
        this.GetAllResponsibilityTransferForms();
      } else if (this.selectedTab === 'My Submitted Requests') {
        this.GetAllSubmittedResponsibilityTransferForms();
      }
    }
  }

  GetAllSubmittedResponsibilityTransferForms(query: any = {}) {
    this.loading = true;
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.divisionPageSize;
    const searchText = query?.searchText || '';

    const payload: GetMyResponsibilityTransfersDto = {
      searchText: searchText,
      sortBy: sort?.sort?.toUpperCase() || 'DESC',
      sortColumn: sort?.colId || 'Id',
      isActive: true,
      pageNumber: pageNumber,
      pageSize: pageSize,
      status: Number(this.selectedStatus), 
    };

    this._responsibilityTransfer
      .GetMySubmittedResponsibilityTransfers(payload)
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res?.Success && res.Data?.Items) {
            this.totalSubmittedApprovals = res.Data.TotalCount;
            this.submittedApprovalData = res.Data.Items.map((item: ResponsibilityTransferItem | any) => ({
              ...item,
              id: item.id || item.Id,
              requestor: item.createdby || item.createdBy || item.CreatedBy || 'Unknown',
              from: item.employeefromname || item.EmployeeFromName || 'Unknown',
              To: item.employeetoname || item.EmployeeToName || 'Unknown',
              reason: this.getReasonText(item.reasonfortransfer || item.reasonForTransfer || item.ReasonForTransfer),
              effectiveDateFrom: new CustomDateFormatPipe().transform(
                item.effectivedatefrom || item.effectiveDateFrom || item.EffectiveDateFrom || ''
              ),
              effectiveDateTo: new CustomDateFormatPipe().transform(
                item.effectivedateto || item.effectiveDateTo || item.EffectiveDateTo || ''
              ),
              remarks: item.remarks || item.Remarks || '',
              actionDate: new CustomDateFormatPipe().transform(
                item.actiondate || item.actionDate || item.ActionDate || ''
              ),
              status: this.getStatusText(item.status || item.Status),
            }));
          } else {
            this.submittedApprovalData = [];
            this.totalSubmittedApprovals = 0;
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.submittedApprovalData = [];
          this.totalSubmittedApprovals = 0;
          this._notificationToastService.createNotification('error', 'Error', err?.error?.Message || err?.Message);
        }
      });
  }

  GetAllResponsibilityTransferForms(query: any = {}) {
    this.loading = true;
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.divisionPageSize;
    const searchText = query?.searchText || '';

    const payload: GetMyResponsibilityTransfersDto = {
      searchText: searchText,
      sortBy: sort?.sort?.toUpperCase() || 'DESC',
      sortColumn: sort?.colId || 'Id',
      isActive: true,
      pageNumber: pageNumber,
      pageSize: pageSize,
      status: Number(this.selectedStatus), 
    };

    this._responsibilityTransfer
      .GetMyResponsibilityTransfersApprovals(payload)
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res?.Success && res.Data?.Items) {
            this.totalPendingApprovals = res.Data.TotalCount;
            this.pendingApprovalData = res.Data.Items.map((item: ResponsibilityTransferItem | any) => ({
              ...item,
              id: item.id || item.Id,
              requestor: item.createdby || item.createdBy || item.CreatedBy || 'Unknown',
              from: item.employeefromname || item.EmployeeFromName || 'Unknown',
              To: item.employeetoname || item.EmployeeToName || 'Unknown',
              reason: this.getReasonText(item.reasonfortransfer || item.reasonForTransfer || item.ReasonForTransfer),
              effectiveDateFrom: new CustomDateFormatPipe().transform(
                item.effectivedatefrom || item.effectiveDateFrom || item.EffectiveDateFrom || ''
              ),
              effectiveDateTo: new CustomDateFormatPipe().transform(
                item.effectivedateto || item.effectiveDateTo || item.EffectiveDateTo || ''
              ),
              remarks: item.remarks || item.Remarks || '',
              actionDate: new CustomDateFormatPipe().transform(
                item.actiondate || item.actionDate || item.ActionDate || ''
              ),
              status: this.getStatusText(item.status || item.Status),
            }));
          } else {
            this.pendingApprovalData = [];
            this.totalPendingApprovals = 0;
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.pendingApprovalData = [];
          this.totalPendingApprovals = 0;
          this._notificationToastService.createNotification('error', 'Error', err?.error?.Message || err?.Message);
        }
      });
  }

  addExclusion() {
    this.showExclusionTable = this.showExclusionTable == true ? false : true;
  }

  getAllUsersList = () => {
    this._peoplePartnerService.GetEmployeeList().subscribe((res) => {
      if (res?.Data) {
        this.tempEmployees = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
          DEPARTMENT: d.DepartmentCode || d.DepartmentId || 'Unknown', // Storing department for filtering
        }));
        
        this.employeeOptions = this.tempEmployees.map(e => ({
          label: e.NAME + ' (' + e.CODE + ')',
          value: e.CODE ,
          department: e.DEPARTMENT,
          name: e.NAME
        })).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        this.filteredEmployeeToOptions = [...this.employeeOptions];

        const currentUserCode = this._utilityService.GetUserEmpId();
        if (currentUserCode && this.tempEmployees.some((e) => e.CODE === currentUserCode)) {
          this.selectedEmployeeFrom = currentUserCode;
          this.onEmployeeFromChange(currentUserCode);
        }
      } else {
        this.tempEmployees = [];
        this.employeeOptions = [];
        this.filteredEmployeeToOptions = [];
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
      this.filteredEmployeeToOptions = [...this.employeeOptions];
      return;
    }

    const fromEmp = this.employeeOptions.find((e) => e.value === empCode);
    if (fromEmp) {
      // Filter to same department, excluding the "Employee From" themselves
      this.filteredEmployeeToOptions = this.employeeOptions.filter(
        (e) => e.department === fromEmp.department && e.value !== empCode,
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
      this._notificationToastService.createNotification(
        'warning',
        'Responsibity Transfer',
        'Employee From required',
      );
      return;
    } else if (this.selectedEmployeeTo === undefined || this.selectedEmployeeTo === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Responsibity Transfer',
        'Employee To required',
      );
      return;
    } else if (
      this.selectedReasonForTransfer === undefined ||
      this.selectedReasonForTransfer === ''
    ) {
      this._notificationToastService.createNotification(
        'warning',
        'Responsibity Transfer',
        'Reason For Transfer required',
      );
      return;
    }
    if (!this.selectedEffectiveDateFrom) {
      this._notificationToastService.createNotification(
        'warning',
        'Responsibity Transfer',
        'Effective Date From required',
      );
      return;
    } else if (this.remarks === undefined || this.remarks === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Responsibility Transfer',
        'Remarks field is mandatory.',
      );
      return;
    } else if (!this.attachment) {
      this._notificationToastService.createNotification(
        'warning',
        'Responsibility Transfer',
        'Attachment is mandatory.',
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

    this._responsibilityTransfer.create(formData).subscribe({
      next: () => {
        this._notificationToastService.createNotification(
          'success',
          'Document',
          'Transfer request submitted successfully!',
        );
        this.cancel();
      },
      error: (err: any) => {
        this._notificationToastService.createNotification('error', 'Error', err?.Message || 'Failed to submit transfer request.');
      }
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
    this.filteredEmployeeToOptions = [...this.employeeOptions];
  }

  promptAction(action: string) {
    if (!this.selectedRow) {
      this._notificationToastService.createNotification('warning', 'Warning', 'Please select a row first.');
      return;
    }

    const modalRef = this.modal.create({
      nzTitle: 'Observation',
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: this.selectedRow.Id || this.selectedRow.id,
        entityType: 'Transfer',
        mode: 'input',
        action: action,
      },
      nzFooter: null,
      nzWidth: '70%',
    });

    modalRef.afterClose.subscribe((result) => {
      if (!result) return;
      const actionStr = (action || '').toUpperCase();
      const isApprove = actionStr === 'APPROVED' || actionStr === 'APPROVE';
      if (!isApprove && (!result.observation || result.observation.trim() === '')) {
        return;
      }
      this.submitWorkflowAction(action, result.observation || '');
    });
  }

  submitWorkflowAction(actionType: string, observationText?: string): void {
    if (!this.selectedRow) {
      this._notificationToastService.createNotification('warning', 'Warning', 'Please select a row first.');
      return;
    }

    const finalObservation = observationText || this.observation;
    if (!finalObservation || finalObservation.trim() === '') {
      this._notificationToastService.createNotification('error', 'Error', 'Observation is required');
      return;
    }

    const payload = {
      transferId: this.selectedRow.id || this.selectedRow.Id,
      action: actionType,
      observation: finalObservation.trim(), 
    };

    this._responsibilityTransfer.takeAction(payload).subscribe({
      next: (res: any) => {
        if (res?.Success || res?.success) {
          this._notificationToastService.createNotification(
            'success',
            'Action Successful',
            res?.Message || `Request has been ${actionType.toLowerCase()}d.`,
          );
          this.GetAllResponsibilityTransferForms(); // Automatically refresh Grid
          this.getMyResponsibilityTransfersApprovalsCount(); // Refresh tab badge
          this.observation = '';
          this.selectedRow = null;
        } else {
          this._notificationToastService.createNotification('error', 'Error', res?.Message || 'Action failed.');
        }
      },
      error: (err: any) => {
        this._notificationToastService.createNotification('error', 'Error', err?.error?.Message || err?.Message);
      },
    });
  }

  export() {}

  approveDocument(action: string = 'Approved') {
    this.promptAction('Approve');
  }

  disapprove(action: string = 'Rejected') {
    this.promptAction('Rejected');
  }
}
