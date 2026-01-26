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

@Component({
  selector: 'app-people-partners-employee',
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzSwitchModule,
    EditableAgGridWrapper,
    NzModalModule,
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

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  integrateWithPoeplePartnerColumnDefs = [
    { field: 'employeeCode', headerName: 'Employee Code' },
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
    this.employeeData = [
      {
        employeeCode: 'DOC001',
        employeeName: 'Employee Handbook',
        version: '3.1',
        divisionId: 'D1',
        divisionName: 'Corporate',
        departmentId: 'DEP1',
        departmentName: 'Software Department',
        subDepartmentId: 'SD1',
        subDepartmentName: 'Recruitment',
        nextReviewDate: '2023-01-15',
        isActive: true,
      },
      {
        employeeCode: 'DOC001',
        employeeName: 'Employee Handbook',
        version: '3.1',
        divisionId: 'D1',
        divisionName: 'Corporate',
        departmentId: 'DEP1',
        departmentName: 'Software Department',
        subDepartmentId: 'SD1',
        subDepartmentName: 'Recruitment',
        nextReviewDate: '2026-01-15',
        isActive: true,
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
        type: 'text',
        // type: 'dropdown',
        // dropdownOptions: this.divisions,
        // dropdownValueField: 'id',
        // dropdownDisplayField: 'text',
        required: true,
      },

      // ✅ DEPARTMENT
      {
        field: 'departmentName',
        headerName: 'Department',
        type: 'text',
        // type: 'dropdown',
        // dependsOn: 'divisionId',
        // dataSourceKey: 'departments',
        // filterKey: 'divisionId',
        // dropdownValueField: 'id',
        // dropdownDisplayField: 'text',
        required: true,
      },
      // ✅ SUB DEPARTMENT
      {
        field: 'subDepartmentName',
        headerName: 'Sub Department',
        type: 'text',
        // type: 'dropdown',
        // dependsOn: 'departmentId',
        // dataSourceKey: 'subDepartments',
        // filterKey: 'departmentId',
        // dropdownValueField: 'id',
        // dropdownDisplayField: 'text',
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
  ) {
    this.loadSampleData();
  }

  ngOnInit() {
    this.GetAllIntegeratedPeoplepartners({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
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
            UserName: item.userName || item.UserName,
            Grade: item.grade || item.Grade,
            DivisionCode: item.divisionCode || item.DivisionCode,
            DivisionName: item.divisionCode || item.DivisionCode,
            DepartmentCode: item.departmentCode || item.DepartmentCode,
            DepartmentName: item.departmentCode || item.DepartmentCode,
            SubDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
            SubDepartmentName: item.subDepartmentCode || item.SubDepartmentCode,
            ReportingTo: item.reportingTo || item.ReportingTo,
            DateOfJoining: new CustomDateFormatPipe().transform(item.dateOfJoining || item.DateOfJoining ||''),
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
        // ✅ build grid ONLY after divisions are ready
        this.buildGrid();
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
