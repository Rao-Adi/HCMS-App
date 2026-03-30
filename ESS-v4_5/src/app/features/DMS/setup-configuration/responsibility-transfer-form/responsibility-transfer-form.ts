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

  // Modal Action Variables
  isActionModalVisible = false;
  actionModalTitle = '';
  actionObservation = '';
  currentAction = '';

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

  pendingRequestApprovalColumnDefs:ColDef[] = [
    { field: 'requestor', headerName: 'Requestor', flex: 1 },
    { field: 'from', headerName: 'From', flex: 1 },
    { field: 'To', headerName: 'To', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
       cellClassRules: {
      'rag-green': params => params.value === 'Controlled',
      'rag-blue': params => params.value === 'Approved',
      'rag-red': params => params.value === 'Pending',
    },
    },
  ];

  pendingApprovalData: any[] = [];
  pendingTotalCount=0;

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  constructor(
    private _userService: UserService,
    private _notification: NotificationService,
    private _responsibilityTransfer: ResponsibilityTransferService,
  ) {}

  ngOnInit() { 
    this.getAllUsersList();
    this.GetAllClassRooms();
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
    // TODO: Refresh your grid data based on selectedStatus
  }

  
  GetAllClassRooms(query: any = {}) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.divisionPageSize;
    const searchText = query?.searchText || '';

    this._responsibilityTransfer
      .GetAllResponsibilityTransfers(
        searchText,
        sort?.sort?.toUpperCase() || 'DESC',
        sort?.colId || 'Id',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.pendingTotalCount = res.Data.TotalCount;
          this.pendingApprovalData = res.Data.Items.map((item: any) => ({
            ...item,
            documentId: item.DocumentId || item.documentId,
            companyId: item.CompanyId || item.companyId,
            documentName: item.DocumentName || item.documentName,
            version: item.Version || item.version || item.RowVersion || item.rowVersion,
            documentType: item.DocumentType || item.documentType,
            division: item.Division || item.division,
            department: item.Department || item.department,
            subDepartment: item.SubDepartment || item.subDepartment,
          }));
        } else {
          this.pendingApprovalData = [];
          this.pendingTotalCount = 0;
        }
      });
  }
  addExclusion() {
    this.showExclusionTable = this.showExclusionTable == true ? false : true;
  }

  getAllUsersList = () => {
    this._userService.getUserList().subscribe((res) => {
      if (res?.Data) {
        this.employees = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
          DEPARTMENT: d.DepartmentCode || d.DepartmentId || 'Unknown', // Storing department for filtering
        }));
        this.filteredEmployeesTo = [...this.employees];
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

  onEmployeeFromChange(empCode: string): void {
    this.selectedEmployeeTo = null; // Clear subsequent selection
    if (!empCode) {
      this.filteredEmployeesTo = [...this.employees];
      return;
    }

    const fromEmp = this.employees.find(e => e.CODE === empCode);
    if (fromEmp) {
      // Filter to same department, excluding the "Employee From" themselves
      this.filteredEmployeesTo = this.employees.filter(
        e => e.DEPARTMENT === fromEmp.DEPARTMENT && e.CODE !== empCode
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
      this._notification.createNotification('warning', 'Responsibity Transfer', 'Remarks required');
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

  openActionModal(action: string): void {
    if (!this.agGridWrapper || !this.agGridWrapper.gridApi) return;
    
    const selectedRows = this.agGridWrapper.gridApi.getSelectedRows();
    if (selectedRows.length === 0) {
      this._notification.createNotification('warning', 'Selection Required', 'Please select at least one request.');
      return;
    }

    this.currentAction = action;
    this.actionModalTitle = `${action} Responsibility Transfer Request`;
    this.actionObservation = '';
    this.isActionModalVisible = true;
  }

  submitAction(): void {
    if (!this.actionObservation || this.actionObservation.trim() === '') {
      this._notification.createNotification('error', 'Validation Failed', 'Observation is required to submit action.');
      return;
    }

    // TODO: Connect this to the actual workflow action API using the `currentAction` and `actionObservation`
    console.log(`Executing ${this.currentAction} with Observation: ${this.actionObservation}`);
    
    this.isActionModalVisible = false;
    this._notification.createNotification('success', 'Action Successful', `Request has been ${this.currentAction.toLowerCase()}ed.`);
  }

  export() {}
}
