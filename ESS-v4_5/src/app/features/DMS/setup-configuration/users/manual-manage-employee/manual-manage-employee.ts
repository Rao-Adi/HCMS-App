import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '@app/shared/services/user-service';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { DivisionService } from '@app/shared/services/division.services';
import { DepartmentCacheService } from '@app/shared/services/CacheServices/department-cache-service';
import { SubDepartmentCacheService } from '@app/shared/services/CacheServices/sub-department-cache-service';
import { AccessLevelModalDialog } from '../../access-level-modal-dialog/access-level-modal-dialog';
import { NotificationService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

@Component({
  selector: 'app-manual-manage-employee',
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzSwitchModule,
    EditableAgGridWrapper,
    NzModalModule,
  ],
  templateUrl: './manual-manage-employee.html',
  styleUrl: './manual-manage-employee.css',
})
export class ManualManageEmployee {
  gridConfig: GridConfig = {} as GridConfig;

  manualUserData: any[] = [];
  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  totalManullayManageEmployees = 0;
  loading = false;

  selectedPageSize = 1; // default value

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pinnedTopRowDataPlanning: UploadDocumentColumns[] = [
    {
      employeeCode: '',
      employeeName: '',
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      email: '',
      reportingTo: null,
      dateOfJoining: null,
      isNewRow: true,
    },
  ];

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'employeeCode',
        headerName: 'Employee Code',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        field: 'employeeName',
        headerName: 'Employee Name',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      // ✅ DIVISION
      {
        field: 'divisionName',
        headerName: 'Division',
        type: 'dropdown',
        dropdownOptions: this.divisions,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },

      // ✅ DEPARTMENT
      {
        field: 'departmentName',
        headerName: 'Department',
        type: 'dropdown',
        dependsOn: 'divisionName',
        dataSourceKey: 'departments',
        filterKey: 'divisionId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },
      // ✅ SUB DEPARTMENT
      {
        field: 'subDepartmentName',
        headerName: 'Sub Department',
        type: 'dropdown',
        dependsOn: 'departmentName',
        dataSourceKey: 'subDepartments',
        filterKey: 'departmentId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },
      {
        field: 'email',
        headerName: 'Email',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        field: 'reportingTo',
        headerName: 'Reporting To',
        type: 'text',
        required: true,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'dateOfJoining',
        headerName: 'Date Of Joining',
        type: 'date',
        required: true,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'accessLevel',
        headerName: 'Access Level',
        type: 'button',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
    ];
  }

  constructor(
    private _userService: UserService,
    private modal: NzModalService,
    private _divisionServices: DivisionService,
    private _departmentCacheService: DepartmentCacheService,
    private _subDepartmentServices: SubDepartmentCacheService,
    private _notification: NotificationService,
  ) {}

  ngOnInit() {
    this.getAllDivisionList();
    this.getAllDepartmentList();
    this.getAllSubDepartmentList();
    this.GetAllManuallyManageEmployee({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }

  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: 10,
      pageSizeOptions: [10, 20, 50, 100],
      enableSorting: true,
      enableFiltering: true,
      enableSelection: true,
      enableInlineAdd: true,
      enableInlineEdit: true,
      enableInlineDelete: true,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };
  }

  GetAllManuallyManageEmployee(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._userService
      .GetAllUser(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalManullayManageEmployees = res.Data.TotalCount;
          this.manualUserData = res.Data.Items.map((item: any) => ({
            Id: item.id || item.Id,
            employeeCode: item.employeeCode || item.EmployeeCode,
            employeeName: item.employeeName || item.EmployeeName,
            email: item.email || item.Email,
            divisionCode: item.divisionCode || item.DivisionCode,
            divisionName: item.divisionName || item.DivisionName,
            departmentCode: item.departmentCode || item.DepartmentCode,
            departmentName: item.departmentName || item.DepartmentName,
            subDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
            subDepartmentName: item.subDepartmentName || item.SubDepartmentName,
            reportingTo: item.reportingTo || item.ReportingTo,
            dateOfJoining: new CustomDateFormatPipe().transform(item.dateOfJoining || item.DateOfJoining),
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          }));
          //console.log('Mapped documentTypeData:', this.documentTypeData);
        } else {
          this.manualUserData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  }

  onSelectionChanged(selectedRows: any[]): void {
    //console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  handleGridAction(event: { action: string; rowData: any }) {
    if (event.action === 'VIEW_CABINET') {
      this.openMandatoryCabinetModal(event.rowData);
    }
  }

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event;
    debugger;
    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      employeeCode: rowData.EmployeeCode || rowData.employeeCode,
      employeeName: rowData.EmployeeName || rowData.employeeName,
      divisionCode: rowData.DivisionCode || rowData.divisionName,
      departmentCode: rowData.DepartmentCode || rowData.departmentName,
      subDepartmentCode: rowData.SubDepartmentCode || rowData.subDepartmentName,
      email: rowData.Email || rowData.email,
      reportingTo: rowData.ReportingTo || rowData.reportingTo,
      dateOfJoining: rowData.DateOfJoining || rowData.dateOfJoining,
      IsActive: true,
      IsDeleted: false,
    };
    this._userService.create(payLoad).subscribe({
      next: () => {
        this._notification.createNotification('success', 'User', 'User created successfully!');

        const rowWithId = {
          ...rowData,
          id: this.generateId(),
          employeeCode: rowData.employeeCode,
          employeeName: rowData.employeeName,
          email: rowData.email,
          reportingTo: rowData.reportingTo,
          dateOfJoining: rowData.dateOfJoining,
          // Map dropdown IDs to display names
          divisionName: this.getDisplayName(this.divisions, rowData.divisionName),
          departmentName: this.getDisplayName(this.departments, rowData.departmentName),
          subDepartmentName: this.getDisplayName(this.subDepartments, rowData.subDepartmentName),
        };

        this.manualUserData = [rowWithId, ...this.manualUserData];
      },
      error: (err) => {
        console.error('Create Document Attribute failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notification.createNotification('error', 'Document Attribute', message);
      },
    });
  }

  onRowUpdated(event: { rowData: any }): void {
    const { rowData } = event;
    debugger;
    // Update display names
    const payLoad = {
      employeeCode: rowData.EmployeeCode || rowData.employeeCode,
      employeeName: rowData.EmployeeName || rowData.employeeName,
      divisionCode: rowData.DivisionCode || rowData.divisionName,
      departmentCode: rowData.DepartmentCode || rowData.departmentName,
      subDepartmentCode: rowData.SubDepartmentCode || rowData.subDepartmentName,
      email: rowData.Email || rowData.email,
      reportingTo: rowData.ReportingTo || rowData.reportingTo,
      dateOfJoining: rowData.DateOfJoining || rowData.dateOfJoining,
      IsActive: true,
      IsDeleted: false,
    };

    this._userService.update(payLoad).subscribe({
      next: () => {
        this._notification.createNotification('success', 'User', 'User Updated successfully!');
        debugger;
        const rowWithId = {
          ...rowData,
          id: this.generateId(),
          employeeCode: rowData.employeeCode,
          employeeName: rowData.employeeName,
          email: rowData.email,
          reportingTo: rowData.reportingTo,
          dateOfJoining: rowData.dateOfJoining,
          // Map dropdown IDs to display names
          divisionName: this.getDisplayName(this.divisions, rowData.divisionName),
          departmentName: this.getDisplayName(this.departments, rowData.departmentName),
          subDepartmentName: this.getDisplayName(this.subDepartments, rowData.subDepartmentName),
        };

        this.manualUserData = [rowWithId, ...this.manualUserData];
      },
      error: (err) => {
        console.error('Create Document Attribute failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notification.createNotification('error', 'Document Attribute', message);
      },
    });
 
  }

  onRowDeleted(rowIndex: number): void {
    console.log('Row deleted at index:', rowIndex);
    this.manualUserData.splice(rowIndex, 1);
    this.manualUserData = [...this.manualUserData];
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', JSON.stringify(event));

    // Handle calculations if needed
    if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
      const currentSalary = event.rowData.currentSalary || 0;
      const incrementPercentage = event.rowData.incrementPercentage || 0;
      event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

      // Update the row
      this.manualUserData[event.rowIndex] = { ...event.rowData };
    }

    if (event.field === 'file-preview') {
      // Handle file preview
      this.previewFile(event.value);
    } else {
      // Handle regular value changes
      //console.log('Cell value changed:', event);
    }
  }

  private generateId(): number {
    return Date.now();
  }

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  previewFile(fileInfo: any): void {
    // Implement file preview logic
    if (fileInfo?.url) {
      // Open in modal or new tab
      window.open(fileInfo.url, '_blank');
    }
  }

  getAllDivisionList = () => {
    this._divisionServices.getDivisionList().subscribe((res) => {
      if (res?.Data) {
        this.divisions = (res.Data ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Value,
        }));
      } else {
        this.divisions = [];
      }
      // ✅ build grid ONLY after divisions are ready
      this.buildGrid();
    });
  };

  getAllDepartmentList = () => {
    this._departmentCacheService.getDepartments().subscribe((res) => {
      if (res) {
        this.departments = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
          divisionId: d.DivisionCode || d.divisionCode,
          Division: d.Division || d.division,
        }));
      } else {
        this.departments = [];
      }
    });
  };

  getAllSubDepartmentList = () => {
    this._subDepartmentServices.getSubDepartments().subscribe((res) => {
      if (res) {
        this.subDepartments = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
          departmentId: d.DepartmentCode || d.departmentCode,
          department: d.Department || d.department,
        }));
      } else {
        this.subDepartments = [];
      }
    });
  };

  openMandatoryCabinetModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Mandatory (Cabinet Wise)',
      nzContent: AccessLevelModalDialog,
      nzData: {
        name: 'Access Level',
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }
}

class UploadDocumentColumns {
  employeeCode: string = '';
  employeeName: string = '';

  divisionId: string | null = null;
  //division: string | null = null;
  departmentId: string | null = null;
  //department: string | null = null;
  subDepartmentId: string | null = null;
  //subDepartment: string | null = null;
  email: string = '';
  reportingTo: any = null;
  dateOfJoining: string | null = null;
  isNewRow: boolean = false;
}
