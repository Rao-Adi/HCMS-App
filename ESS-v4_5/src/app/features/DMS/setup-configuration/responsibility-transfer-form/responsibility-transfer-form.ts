import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  ],
  templateUrl: './responsibility-transfer-form.html',
  styleUrl: './responsibility-transfer-form.css',
})
export class ResponsibilityTransferForm {
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

  totalPendingApprovals = 0;
  selectedPageSize = 10;

  pageSize = 10;
  rowData: any[] = [];
  employees: any[] = [];
  totalRows = 0;

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

  pendingRequestApprovalColumnDefs = [
    { field: 'requestor', headerName: 'Requestor', flex: 1 },
    { field: 'from', headerName: 'From', flex: 1 },
    { field: 'To', headerName: 'To', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  pendingApprovalData: any[] = [
    {
      requestor: 'REQ-001',
      from: 'Marketing Division',
      To: 'Marketing',
      reason: 'Digital Marketing',
      status: 'Pending',
    },
    {
      requestor: 'REQ-002',
      from: 'Software Division',
      To: 'IT',
      reason: 'Software Marketing',
      status: 'Pending',
    },
  ];

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
    this.loadData(this.pageSize);
    this.getAllUsersList();
  }

  onFileSelected(event: Event): void {
    debugger;
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.attachment = null;
      return;
    }

    this.attachment = input.files[0];
    console.log('Selected file:', this.attachment);
  }
  selectedStatus: number | null = null;

  selectStatus(value: number | null): void {
    this.selectedStatus = value;
  }

  loadData(pageNumber: number) {
    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.rowData = allData.slice(start, end);
    this.totalRows = allData.length;

    // 🔹 REMOVE THIS when backend is ready
    // this.gridService.loadData(this.apiUrl, request).subscribe(...)
  }

  private getDummyData(): any[] {
    return Array.from({ length: 100 }).map((_, i) => ({
      documentId: `DOC-${i + 1}`,
      documentName: `Policy Document ${i + 1}`,
      version: `v${Math.floor(Math.random() * 5) + 1}.0`,
      documentType: ['Policy', 'SOP', 'Manual'][i % 3],
      division: ['North', 'South', 'East', 'West'][i % 4],
      department: ['HR', 'IT', 'Finance', 'Legal'][i % 4],
      subDepartment: ['Ops', 'Admin', 'Support'][i % 3],
      nextReviewDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
        .toISOString()
        .split('T')[0],
      uploadDocument: 'Upload',
    }));
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
        }));
      } else {
        this.employees = [];
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
 
  saveTemplate(data: any) {
    debugger;

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
    formData.append('Attachment', this.attachment!, this.attachment!.name);

    this._responsibilityTransfer.create(formData).subscribe(() => {
      this._notification.createNotification(
        'success',
        'Document',
        'Document created successfully!',
      );
    });
  }
 

  export() {}
}
