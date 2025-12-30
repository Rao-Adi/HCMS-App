import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { DivisionList } from '@app/shared/Dropdowns/division-list/division-list';
import { SubDepartmentList } from '@app/shared/Dropdowns/sub-department-list/sub-department-list';
import { DepartmentList } from '@app/shared/Dropdowns/department-list/department-list';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';

@Component({
  selector: 'app-document-request-management',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    AgGridWrapper,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    DivisionList,
    SubDepartmentList,
    DepartmentList,
    DocumentTypeList,
  ],
  templateUrl: './document-request-management.html',
  styleUrl: './document-request-management.css',
})
export class DocumentRequestManagement {
  selectedTab: string = 'NewRequest';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedDocumentType?: string = '';

  constructor() {}

  ngOnInit() {}

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: true,
  };

  pageSize = 10;
  totalRows = 0;
  totalUsers = 0;
  totalDistributioinList = 0;
  totalWorkflowAuthorities = 0;
  totalDocuments = 0;
  totalPendingApprovals = 0;
  rowData: any[] = [];

  public noRowsOverlay: string = '';

  userGridColumnDefs = [
    {
      field: 'division',
      headerName: 'Division',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing Division', 'Software Division', 'Finance Division', 'HR Division'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing', 'IT', 'Finance', 'HR'],
      },
    },
    {
      field: 'subDepartment',
      headerName: 'Sub-Department',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Digital Marketing', 'Software Marketing'],
      },
    },
    {
      field: 'users',
      headerName: 'Users',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          'Territory Sales Manager(TSM)',
          'District Sales Manager(DSM)',
          'Regional Sales Manager(RSM)',
        ],
      },
    },
  ];

  documentColumnDefs = [
    {
      field: 'division',
      headerName: 'Division',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing Division', 'Software Division', 'Finance Division', 'HR Division'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing', 'IT', 'Finance', 'HR'],
      },
    },
    {
      field: 'subDepartment',
      headerName: 'Sub-Department',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Digital Marketing', 'Software Marketing'],
      },
    },
    {
      field: 'users',
      headerName: 'Users',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          'Territory Sales Manager(TSM)',
          'District Sales Manager(DSM)',
          'Regional Sales Manager(RSM)',
        ],
      },
    },
  ];

  distributionListGridColumnDefs = [
    {
      field: 'division',
      headerName: 'Division',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Marketing Division', 'Software Division'],
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['HR', 'IT', 'Finance', 'Legal'],
      },
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          'Territory Sales Manager(TSM)',
          'District Sales Manager(DSM)',
          'Regional Sales Manager(RSM)',
        ],
      },
    },
    {
      field: 'distributionType',
      headerName: 'Distribution Type',
      flex: 1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Physical', 'Digital'],
      },
    },
  ];

  workflowAuthoritiesColumnDefs = [
    { field: 'approvalSequence', headerName: 'Approval Sequence', flex: 1 },
    { field: 'employeeCode', headerName: 'Employee Code', flex: 1 },
    { field: 'employeeName', headerName: 'Employee Name', flex: 1 },
    { field: 'division', headerName: 'Division', flex: 1 },
    { field: 'department', headerName: 'Department', flex: 1 },
    { field: 'subDepartment', headerName: 'Sub-Department', flex: 1 },
  ];

  pendingRequestApprovalColumnDefs = [
    { field: 'requestId', headerName: 'Request ID', flex: 1 },
    { field: 'division', headerName: 'Division', flex: 1 },
    { field: 'department', headerName: 'Department', flex: 1 },
    { field: 'subDepartment', headerName: 'Sub-Department', flex: 1 },
    { field: 'documentType', headerName: 'Document Type', flex: 1 },
    { field: 'documentTitle', headerName: 'Document Title', flex: 1 },
    { field: 'justification', headerName: 'Justification', flex: 1 },
    { field: 'createdOn', headerName: 'Created On', flex: 1 },
    { field: 'pendingWith', headerName: 'Pending With', flex: 1 },
  ];

  userData: any[] = [
    {
      division: 'Marketing Division',
      department: 'Marketing',
      subDepartment: 'Digital Marketing',
      user: 'Territory Sales Manager(TSM)',
    },
    {
      division: 'Software Division',
      department: 'IT',
      subDepartment: 'Software Marketing',
      user: 'District Sales Manager(DSM)',
    },
    {
      division: 'Software Division',
      department: 'Finance',
      subDepartment: 'Software Marketing',
      user: 'Regional Sales Manager(RSM)',
    },
  ];

  distributionListData: any[] = [
    {
      division: 'Marketing Division',
      department: 'Marketing',
      role: 'Digital Marketing',
      distributionType: 'Physical',
    },
    {
      division: 'Software Division',
      department: 'IT',
      role: 'Software Marketing',
      distributionType: 'Digital',
    },
    {
      division: 'Software Division',
      department: 'Finance',
      role: 'Software Marketing',
      distributionType: 'Digital',
    },
  ];

  pendingApprovalData: any[] = [
    {
      requestId: 'REQ-001',
      division: 'Marketing Division',
      department: 'Marketing',
      subDepartment: 'Digital Marketing',
      documentType: 'Policy',
      documentTitle: 'IT Security Policy',
      justification: 'New compliance requirements',
      createdOn: '2024-01-15',
      pendingWith: 'Manager A',
    },
    {
      requestId: 'REQ-002',
      division: 'Software Division',
      department: 'IT',
      subDepartment: 'Software Marketing',
      documentType: 'SOP',
      documentTitle: 'Employee Onboarding SOP',
      justification: 'Process improvement',
      createdOn: '2024-02-10',
      pendingWith: 'Manager B',
    },
    {
      requestId: 'REQ-003',
      division: 'Software Division',
      department: 'Finance',
      subDepartment: 'Software Marketing',
      documentType: 'Manual',
      documentTitle: 'Financial Reporting Manual',
      justification: 'Regulatory update',
      createdOn: '2024-03-05',
      pendingWith: 'Manager C',
    },
  ];

  workflowAuthoritiesData: any[] = [
    {
      approvalSequence: 1,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
    {
      approvalSequence: 2,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
    {
      approvalSequence: 3,
      employeeCode: '000100442',
      employeeName: 'Muhammad Junaid',
      division: 'Finance Division',
      department: 'IT',
      subDepartment: 'Digital Marketing',
      documentTitle: 'IT Security Policy',
    },
  ];

  companies: SelectList[] = [
    { CODE: '1', NAME: 'ATCO' },
    { CODE: '2', NAME: 'Softronic' },
  ];

  requestTypes: SelectList[] = [
    { CODE: '1', NAME: 'Creation of new document' },
    { CODE: '2', NAME: 'Revision of existing document' },
    { CODE: '3', NAME: 'Obsoletion of existing document' },
  ];

  employees: SelectList[] = [
    { CODE: '1', NAME: 'John Doe' },
    { CODE: '2', NAME: 'Jane Smith' },
    { CODE: '3', NAME: 'Alice Johnson' },
  ];

  workflowExclude: SelectList[] = [
    { CODE: '1', NAME: 'Designation' },
    { CODE: '2', NAME: 'Role' },
    { CODE: '3', NAME: 'Specific Employee' },
  ];

  filters: SelectList[] = [
    { CODE: '1', NAME: 'Over Due' },
    { CODE: '2', NAME: 'Less than 30 days' },
  ];

  selectedAuthorityType: string | null = null;

  onAuthorityTypeChange(value: string | null): void {
    this.selectedAuthorityType = value;
  }

  selectedWorkflowExclude: string | null = null;
  onWorkflowExcludeChange(value: string | null): void {
    this.selectedWorkflowExclude = value;
  }

  onDepartmentsChange(value: string): void {
    this.selectedDivisions = value;
  }
  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;
  }

  GetAllDocuments(query: any) {}

  GetAllPendingApprovalRequests(query: any) {}

  GetAllUsers(query: any) {}

  GetAllUsers2(query: any) {}

  GetAllWorkflowAuthorities(query: any) {}

  GetAllUploadedDocuments(query: any) {}
  GetAllDistributionList(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'distributionList2Grid':
        this.divisionPageSize = pageSize;
        this.GetAllDistributionList({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'documentGrid':
        this.divisionPageSize = pageSize;
        this.GetAllDistributionList({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'usersGrid':
        this.employeePageSize = pageSize;
        this.GetAllDistributionList({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'users2Grid':
        this.employeePageSize = pageSize;
        this.GetAllDistributionList({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'distributionListGrid':
        this.employeePageSize = pageSize;
        this.GetAllDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'workflowAuthorities1Grid':
        this.employeePageSize = pageSize;
        this.GetAllDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'workflowAuthorities2Grid':
        this.employeePageSize = pageSize;
        this.GetAllDocuments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'myRequestPendingApprovalGrid':
        this.employeePageSize = pageSize;
        this.GetAllDistributionList({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      // handle other grids...

      default:
        break;
    }
  }
}
