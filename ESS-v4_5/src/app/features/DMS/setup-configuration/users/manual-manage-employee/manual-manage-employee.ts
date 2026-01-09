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
      grade: '',
      reportingTo: null,
      dateOfJoining: null,
      isNewRow: true,
    },
  ];

  private loadSampleData(): void {
    this.manualUserData = [
      {
        employeeCode: '0001',
        employeeName: 'Mustafa',
        divisionId: 'D1',
        divisionName: 'Corporate',
        departmentId: 'DEP1',
        departmentName: 'Software Department',
        subDepartmentId: 'SD1',
        subDepartmentName: 'Recruitment',
        grade: 'A',
        reportingTo: 'Ahmed Ali Khan',
        dateOfJoining: '2023-01-15',
        accessLevel: true,
      },
      {
        employeeCode: '0002',
        employeeName: 'Hyder Ali',
        divisionId: 'D1',
        divisionName: 'Corporate',
        departmentId: 'DEP1',
        departmentName: 'Software Department',
        subDepartmentId: 'SD1',
        subDepartmentName: 'Recruitment',
        grade: 'A',
        reportingTo: 'Nadir Ali',
        dateOfJoining: '2026-01-15',
        accessLevel: true,
      },
    ];
  }

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
        field: 'grade',
        headerName: 'Grade',
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
    private _subDepartmentServices: SubDepartmentCacheService
  ) {
    this.loadSampleData();
  }

  ngOnInit() {
    this.getAllDivisionList();
    this.getAllDepartmentList();
    this.getAllSubDepartmentList();
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
        pageSize
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalManullayManageEmployees = res.Data.TotalCount;
          this.manualUserData = res.Data.Items.map((item: any) => ({
            Id: item.id || item.Id,
            EmployeeCode: item.employeeCode || item.EmployeeCode,
            UserName: item.userName || item.UserName,
            Grade: item.grade || item.Grade,
            DivisionCode: item.divisionCode || item.DivisionCode,
            DivisionName: item.divisionCode || item.DivisionCode,
            DepartmentCode: item.departmentCode || item.DepartmentCode,
            DepartmentName: item.departmentCode || item.DepartmentCode,
            SubDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
            SubDepartmentName: item.subDepartmentCode || item.SubDepartmentCode,
            ReportingTo: item.reportingTo || item.ReportingTo,
            DateOfJoining: item.dateOfJoining || item.DateOfJoining,
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            Description: item.description || item.Description,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: item.createdAt || item.CreatedAt || '',
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

  onRowAdded(newRow: any): void {
    console.log('Row added:', newRow);
    debugger;
    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      employeeCode: newRow.EmployeeCode || newRow.employeeCode,
      employeeName: newRow.EmployeeName || newRow.employeeName,
      divisionCode: newRow.DivisionCode || newRow.divisionName,
      departmentCode: newRow.DepartmentCode || newRow.departmentName,
      subDepartmentCode: newRow.SubDepartmentCode || newRow.subDepartmentName,
      grade: newRow.Grade || newRow.grade,
      reportingTo: newRow.ReportingTo || newRow.reportingTo,
      dateOfJoining: newRow.DateOfJoining || newRow.dateOfJoining,
      IsActive: true,
      IsDeleted: false,
    };

    this._userService.create(payLoad).subscribe(() => {
      console.log('Created');
    });
    const rowWithId = {
      ...newRow,
      id: this.generateId(),
      employeeCode: newRow.employeeCode,
      employeeName: newRow.employeeName,
      grade: newRow.grade,
      reportingTo: newRow.reportingTo,
      dateOfJoining: newRow.dateOfJoining,
      // Map dropdown IDs to display names
      divisionName: this.getDisplayName(this.divisions, newRow.divisionName),
      departmentName: this.getDisplayName(this.departments, newRow.departmentName),
      subDepartmentName: this.getDisplayName(this.subDepartments, newRow.subDepartmentName),
    };

    this.manualUserData = [rowWithId, ...this.manualUserData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    console.log('Row updated:', event);
    debugger;
    // Update display names
    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
    event.rowData.departmentName = this.getDisplayName(
      this.departments,
      event.rowData.departmentId
    );
    // event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

    this.manualUserData[event.index] = { ...event.rowData };
    this.manualUserData = [...this.manualUserData]; // Trigger change detection
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
  grade: string = '';
  reportingTo: any = null;
  dateOfJoining: string | null = null;
  isNewRow: boolean = false;
}
