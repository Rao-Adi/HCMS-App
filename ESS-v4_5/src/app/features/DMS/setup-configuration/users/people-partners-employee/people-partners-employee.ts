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
import { AccessLevelModalDialog } from '../../access-level-modal-dialog/access-level-modal-dialog';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColumnToggle } from '@app/shared/interfaces/interfaces';

@Component({
  selector: 'app-people-partners-employee',
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzSwitchModule,
    EditableAgGridWrapper,
    NzModalModule,
    AgGridWrapper,
  ],
  templateUrl: './people-partners-employee.html',
  styleUrl: './people-partners-employee.css',
})
export class PeoplePartnersEmployee {
  gridConfig: GridConfig = {} as GridConfig;
  employeeData: any[] = [];
  loading = false;
  integrationUserData: any[] = [];
  totalIntergrated = 0;
  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;
  selectedPageSize = 10; // default value

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  columnToggles?: ColumnToggle[] = [
    { field: 'EmployeeCode', label: 'Employee Code', visible: true },
    { field: 'EmployeeName', label: 'Employee Name', visible: true },
    { field: 'DivisionName', label: 'Division', visible: true },
    { field: 'DepartmentName', label: 'Department', visible: true },
    { field: 'SubDepartmentName', label: 'Sub-Department', visible: true },
    { field: 'Designation', label: 'Designation', visible: true },
    { field: 'Grade', label: 'Grade', visible: true },
    { field: 'ReportingTo', label: 'Reporting To', visible: true },
    { field: 'DateOfJoining', label: 'Date Of Joining', visible: true },
    { field: 'accessLevel', label: 'AccessLevel', visible: true },
  ];

  documentColumnDefs = [
    { field: 'EmployeeCode', headerName: 'Employee Code' },
    { field: 'EmployeeName', headerName: 'Employee Name' },
    {
      field: 'DivisionName',
      headerName: 'Division',
    },
    {
      field: 'DepartmentName',
      headerName: 'Department',
    },
    {
      field: 'SubDepartmentName',
      headerName: 'Sub-Department',
    },
    {
      field: 'Designation',
      headerName: 'Designation',
    },
    {
      field: 'Grade',
      headerName: 'Grade',
    },
    {
      field: 'ReportingTo',
      headerName: 'Reporting Manager',
    },
    {
      field: 'DateOfJoining',
      headerName: 'Date of Joining',
    },
    {
      field: 'accessLevel',
      headerName: 'Access Level', 
      editable: false,
      cellRenderer: (params: any) => {
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          ${params.value ? 'Access Level' : 'Access Level'}
        </span>
      `;
      },
      onCellClicked: (event: any) => {
        this.openMandatoryCabinetModal(event.data);
      },
    },
  ];

  pinnedTopRowDataPlanning: UsersColumns[] = [
    {
      employeeCode: '',
      employeeName: '',
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      designationId: null,
      grade: '',
      reportingTo: null,
      dateOfJoining: null,
      isNewRow: true,
    },
  ];

  constructor(
    private _userService: UserService,
    private modal: NzModalService,
  ) {}

  ngOnInit() {
    this.GetAllIntegeratedPeoplepartners({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  GetAllIntegeratedPeoplepartners(query: any) {
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
          this.totalIntergrated = res.Data.TotalCount;

          this.integrationUserData = res.Data.Items.map((item: any) => ({
            Id: item.id || item.Id,
            EmployeeCode: item.employeeCode || item.EmployeeCode,
            EmployeeName: item.employeeName || item.EmployeeName,
            Grade: item.grade || item.Grade,
            DivisionCode: item.divisionCode || item.DivisionCode,
            DivisionName: item.division || item.Division,
            DepartmentCode: item.departmentCode || item.DepartmentCode,
            DepartmentName: item.department || item.Department,
            SubDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
            SubDepartmentName: item.subDepartment || item.SubDepartment,
            DesignationCode: item.designationCode || item.DesignationCode,
            Designation: item.designation || item.Designation,
            ReportingTo:
              item.ReportingTo + '-' + item.EmployeeName ||
              item.ReportingTo + '-' + item.EmployeeName,
            DateOfJoining: new CustomDateFormatPipe().transform(
              item.dateOfJoining || item.DateOfJoining || '',
            ),
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            Description: item.description || item.Description,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          }));
          //console.log('Mapped documentTypeData:', this.documentTypeData);
        } else {
          this.integrationUserData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
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

  openMandatoryCabinetModal(rowData: any) {
    //console.log('Row clicked:', rowData);

    const modalRef = this.modal.create({
      nzTitle: 'Access Level to ' + (rowData.employeeName || rowData.EmployeeName),
      nzContent: AccessLevelModalDialog,
      nzData: {
        employeeCode: rowData.employeeCode || rowData.EmployeeCode
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    }); 
 
    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }
}

class UsersColumns {
  employeeCode: string = '';
  employeeName: string = '';

  divisionId: string | null = null;
  //division: string | null = null;
  departmentId: string | null = null;
  //department: string | null = null;
  subDepartmentId: string | null = null;
  designationId: string | null = null;
  //subDepartment: string | null = null;
  grade: string = '';
  reportingTo: any = null;
  dateOfJoining: string | null = null;
  isNewRow: boolean = false;
}
