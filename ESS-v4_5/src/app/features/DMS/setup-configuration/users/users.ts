import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { UserService } from '@app/shared/services/user-service';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { AccessLevelModalDialog } from '../access-level-modal-dialog/access-level-modal-dialog';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, NzIconModule, NzSwitchModule, AgGridWrapper, NzModalModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  private tabDataCache = new Set<string>();
  public noRowsOverlay: string = '';

  selectedTab: string = 'Upload';
  loading = false;
  switchValue1 = false;
  switchValue2 = false;
  // single state
  activeMode: 'manual' | 'integration' | null = null;
  pageSize = 10;
  manualUserData: any[] = [];
  integrationUserData: any[] = [];
  totalIntergrated = 0;
  totalManullayManageEmployees = 0;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  manuallyManageEmployeesColumnDefs = [
    { field: 'EmployeeCode', headerName: 'Employee Code' },
    { field: 'UserName', headerName: 'Employee Name' },
    {
      field: 'DivisionName',
      headerName: 'Division',
      cellEditorParams: {
        values: ['Marketing', 'Software', 'HR', 'Finance', 'Operations', 'Admin'],
      },
    },
    {
      field: 'DepartmentName',
      headerName: 'Department',
      cellEditorParams: {
        values: ['Production', 'QA', 'R&D', 'Support', 'Management'],
      },
    },
    {
      field: 'SubDepartmentName',
      headerName: 'Sub-Department',
      cellEditorParams: {
        values: ['Sub-Dept A', 'Sub-Dept B', 'Sub-Dept C'],
      },
    },
    {
      field: 'Grade',
      headerName: 'Grade',
      cellEditorParams: {
        values: ['M.2', 'M.3', 'M.4', 'M.5', 'M.6', 'M.7'],
      },
    },
    {
      field: 'ReportingTo',
      headerName: 'Reportin gManager',
      cellEditorParams: {
        values: ['Manager A', 'Manager B', 'Manager C', 'Manager D'],
      },
    },
    {
      field: 'DateOfJoining',
      headerName: 'Date of Joining',
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
    {
      field: 'accessLevel',
      headerName: 'Access Level',
      flex: 1,
      editable: false,
      cellRenderer: (params: any) => {
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          ${params.value ? 'View' : 'View'}
        </span>
      `;
      },
      // onCellClicked: (event: any) => {
      //   this.openMandatoryCabinetModal(event.data);
      // },
    },
  ];

  integrateWithPoeplePartnerColumnDefs = [
    { field: 'EmployeeCode', headerName: 'Employee Code' },
    { field: 'UserName', headerName: 'Employee Name' },
    {
      field: 'DivisionName',
      headerName: 'Division',
      cellEditorParams: {
        values: ['Marketing', 'Software', 'HR', 'Finance', 'Operations', 'Admin'],
      },
    },
    {
      field: 'DepartmentName',
      headerName: 'Department',
      cellEditorParams: {
        values: ['Production', 'QA', 'R&D', 'Support', 'Management'],
      },
    },
    {
      field: 'SubDepartmentName',
      headerName: 'Sub-Department',
      cellEditorParams: {
        values: ['Sub-Dept A', 'Sub-Dept B', 'Sub-Dept C'],
      },
    },
    {
      field: 'Grade',
      headerName: 'Grade',
      cellEditorParams: {
        values: ['M.2', 'M.3', 'M.4', 'M.5', 'M.6', 'M.7'],
      },
    },
    {
      field: 'ReportingTo',
      headerName: 'Reportin gManager',
      cellEditorParams: {
        values: ['Manager A', 'Manager B', 'Manager C', 'Manager D'],
      },
    },
    {
      field: 'DateOfJoining',
      headerName: 'Date of Joining',
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
    {
      field: 'accessLevel',
      headerName: 'Access Level',
      flex: 1,
      editable: false,
      cellRenderer: (params: any) => {
        return `
        <span 
          style="color:#1976d2; cursor:pointer; text-decoration:underline"
          data-action="open"
        >
          ${params.value ? 'View' : 'View'}
        </span>
      `;
      },
      // onCellClicked: (event: any) => {
      //   this.openMandatoryCabinetModal(event.data);
      // },
    },
  ];
  

  constructor(private _userService: UserService, private modal: NzModalService) {}

  ngOnInit() {}

  clickSwitch(mode: 'manual' | 'integration'): void {
    if (this.loading) return;

    this.loading = true;

    this.loadDataByTab(mode);

    setTimeout(() => {
      this.activeMode = mode;

      // mutually exclusive switches
      this.switchValue1 = mode === 'manual';
      this.switchValue2 = mode === 'integration';

      this.loading = false;
    }, 300); // keep UX fast
  }

  // Default Column Definitions: Apply configuration across all columns

  loadDataByTab(tabId: string): void {
    if (this.tabDataCache.has(tabId)) return;

    const apiMap: Record<string, () => void> = {
      manual: () =>
        this.GetAllManuallyManageEmployee({
          pageNumber: 1,
          pageSize: this.pageSize,
          sortModel: [],
          filterModel: {},
        }),
      integration: () =>
        this.GetAllIntegeratedPeoplepartners({
          pageNumber: 1,
          pageSize: this.pageSize,
          sortModel: [],
          filterModel: {},
        }),
    };

    apiMap[tabId]?.();
    this.tabDataCache.add(tabId);
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
        pageSize
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalIntergrated = res.Data.TotalCount;
          this.integrationUserData = res.Data.Items.map((item: any) => ({
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
          this.integrationUserData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  }

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'manualGrid':
        this.divisionPageSize = pageSize;
        this.GetAllIntegeratedPeoplepartners({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;

      case 'integrationGrid':
        this.employeePageSize = pageSize;
        this.GetAllIntegeratedPeoplepartners({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      default:
        break;
    }
  }

  openMandatoryCabinetModal(rowData: any) {
    console.log('Row clicked:', rowData);

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

  onGridCellClicked(event: any) {
    
    if (event.colDef.field === 'actions') {
      const target = event.event.target as HTMLElement;

      // if (target.classList.contains('btn-insert')) {
      //   this.insertNewRecord(event.data);
      // } else if (target.classList.contains('btn-edit')) {
      //   this.editRecord(event.data);
      // } else if (target.classList.contains('btn-delete')) {
      //   this.deleteRecord(event.data);
      // }
    }

    if (event.colDef.field === 'accessLevel') {
      this.openMandatoryCabinetModal(event.data);
    }
  }
}
