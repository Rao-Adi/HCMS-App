import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
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
import { PeoplePartnersService } from '@app/shared/services/people-partners.service'; 
import { PermissionService } from '@app/shared/services/permission.service';

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

   // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'users';

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

  //  columnToggles?: ColumnToggle[] = [
  //   { field: 'EmployeeCode', label: 'Employee Code', visible: true },
  //   { field: 'EmployeeName', label: 'Employee Name', visible: true },
  //   { field: 'DivisionName', label: 'Division', visible: true },
  //   { field: 'DepartmentName', label: 'Department', visible: true },
  //   { field: 'SubDepartmentName', label: 'Sub-Department', visible: true },
  //   { field: 'Designation', label: 'Designation', visible: true },
  //   { field: 'Grade', label: 'Grade', visible: true },
  //   { field: 'ReportingTo', label: 'Reporting To', visible: true },
  //   { field: 'DateOfJoining', label: 'Date Of Joining', visible: true },
  //   { field: 'accessLevel', label: 'AccessLevel', visible: true },
  // ];

  columnToggles?: ColumnToggle[] = [
    { field: 'empcode', label: 'Employee Code', visible: true },
    { field: 'fname', label: 'Employee Name', visible: true },
    { field: 'designation', label: 'Designation', visible: true },
    { field: 'role', label: 'Role', visible: true },
    { field: 'nicnew', label: 'CNIC', visible: true },
    { field: 'mobile', label: 'Mobile', visible: true },
    { field: 'email', label: 'Email', visible: true },
    { field: 'datejoin', label: 'Date Of Joining', visible: true },
    { field: 'accessLevel', label: 'Access Level', visible: true },
  ];
 
  documentColumnDefs = [
    { field: 'empcode', headerName: 'Employee Code' },
    { field: 'fname', headerName: 'Employee Name' },
    { field: 'designation', headerName: 'Designation'},
    { field: 'role', headerName: 'Role' },
    { field: 'nicnew', headerName: 'CNIC' },
    { field: 'mobile', headerName: 'Mobile' },
    { field: 'email', headerName: 'Email' },
    { field: 'datejoin', headerName: 'Date of Joining' },
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

  pinnedTopRowDataPlanning: any[] = [
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
      empcode: '',
      fname: '',
      designation: '',
      role: '',
      nicnew: '',
      mobile: '',
      email: '',
      datejoin: null,
      isNewRow: true,
    },
  ];

  constructor(
    private _permissionService: PermissionService, 
    private _peoplePartnersEmployeeService: PeoplePartnersService,
    private modal: NzModalService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });

    this.GetAllIntegeratedPeoplepartners({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
 
  }
 
  GetAllIntegeratedPeoplepartners(query: any = {}) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.pageSize;

    const searchText = query?.searchText || query?.filterModel?.fname?.filter || '';

    this._peoplePartnersEmployeeService
      .GetAllEmployees(
        searchText,
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'fname',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalIntergrated = res.Data.TotalCount;
          this.totalRows = res.Data.TotalCount;

          this.integrationUserData = res.Data.Items.map((item: any) => ({
            empid: item.empid,
            empcode: item.empcode,
            fname: item.firstname +" " +item.lastname,
            designation: item.designation,
            role: item.role,
            nicnew: item.nicnew,
            mobile: item.mobile,
            email: item.email,
            datejoin: new CustomDateFormatPipe().transform(
              item.datejoin || '',
            ),
            accessLevel: true // Forces the cellRenderer link to show up
          }));
        } else {
          this.integrationUserData = [];
          this.totalRows = 0;
        }
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
      nzTitle: 'Access Level to ' + rowData.fname,
      nzContent: AccessLevelModalDialog,
      nzData: {
        employeeCode: rowData.empcode
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

  empcode: string = '';
  fname: string = '';
  nicnew: string = '';
  mobile: string = '';
  email: string = '';
  datejoin: string | null = null;
  isNewRow: boolean = false;
}
