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

  selectedTab: string = 'Request';
  switchValue1 = false;
  switchValue2 = false;
  loading = false;
  showExclusionTable = false;
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];

  attachment: File | null = null;
  fileList: NzUploadFile[] = [];

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
  authorityTypes: SelectList[] = [
    { CODE: '1', NAME: 'Reporting to Levels' },
    { CODE: '2', NAME: 'Employee' },
    { CODE: '3', NAME: 'Role' },
    { CODE: '4', NAME: 'Designation' },
    { CODE: '5', NAME: 'Head of Division' },
    { CODE: '6', NAME: 'Head of Department' },
    { CODE: '7', NAME: 'Head of Sub-Department' },
  ];

  workflowExclude: SelectList[] = [
    { CODE: '1', NAME: 'Designation' },
    { CODE: '2', NAME: 'Role' },
    { CODE: '3', NAME: 'Specific Employee' },
  ];

  UploadColumnDefs = [
    { field: 'documentId', headerName: 'Document ID' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version' },
    {
      field: 'documentType',
      headerName: 'Document Type',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    {
      field: 'division',
      headerName: 'Division',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    {
      field: 'subDepartment',
      headerName: 'Sub-Department',
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },
    {
      field: 'nextReviewDate',
      headerName: 'Next Review Date',
      cellEditor: 'agDateCellEditor',
      // valueFormatter: (params: ValueFormatterParams<any, Date>) => {
      //   if (!params.value) {
      //     return '';
      //   }
      //   const month = params.value.getMonth() + 1;
      //   const day = params.value.getDate();
      //   return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${
      //     day < 10 ? '0' + day : day
      //   }`;
      // },
      // cellEditorParams: {
      //   max: new Date('2008-12-31'),
      // },
    },
    { field: 'uploadDocument', headerName: 'Upload Document' },
  ];

  UploadedDocColumnDefs = [
    { field: 'documentId', headerName: 'Document ID' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version Number' },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'nextReviewDate', headerName: 'Next Review Date' },
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
      status: 'Policy',
    },
    {
      requestor: 'REQ-002',
      from: 'Software Division',
      To: 'IT',
      reason: 'Software Marketing',
      status: 'SOP',
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

  onSearch(value: string): void {
    this.loading = true;
    this.searchChange$.next(value);
  }

  selectedAuthorityType: number | null = null;

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
    //reset preselected values
    this.selectedWorkflowExclude = 0;
  }

  selectedWorkflowExclude: number | null = null;
  onWorkflowExcludeChange(value: number | null): void {
    this.selectedWorkflowExclude = value;
  }

  clickSwitch(mode: 'manual' | 'integration'): void {
    if (this.loading) return;

    this.loading = true;

    setTimeout(() => {
      this.activeMode = mode;

      // mutually exclusive switches
      this.switchValue1 = mode === 'manual';
      this.switchValue2 = mode === 'integration';

      this.loading = false;
    }, 300); // keep UX fast
  }

  async saveClaim(): Promise<void> {
    return;
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

  GetAllPendingApprovalRequests(query: any) {}

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

  private appendDate(formData: FormData, key: string, value: Date | null) {
    if (value) {
      formData.append(key, value.toISOString());
    }
  }
}
