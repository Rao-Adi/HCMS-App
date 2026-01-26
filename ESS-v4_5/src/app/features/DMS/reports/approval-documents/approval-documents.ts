import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { BehaviorSubject } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DivisionList } from '@app/shared/Dropdowns/division-list/division-list';
import { SubDepartmentList } from '@app/shared/Dropdowns/sub-department-list/sub-department-list';
import { DepartmentList } from '@app/shared/Dropdowns/department-list/department-list';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { MyPendingRequestForApproval } from '../../documents/document-request-management/my-pending-request-for-approval/my-pending-request-for-approval';

@Component({
  selector: 'app-approval-documents',
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
    NzDatePickerModule,
    DivisionList,
    SubDepartmentList,
    DepartmentList,
    DocumentTypeList,
    MyPendingRequestForApproval,
  ],
  templateUrl: './approval-documents.html',
  styleUrl: './approval-documents.css',
  styles: [
    `
      nz-date-picker,
      nz-range-picker {
        margin: 0 8px 12px 0;
      }
    `,
  ],
})
export class ApprovalDocuments {
  plainFooter = 'plain extra footer';
  footerRender = (): string => 'extra footer';
  dateFormat = 'dd/MMM/yyyy';
  pageSize = 10;
  rowData: any[] = [];
  totalDocuments = 0;

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedDocumentType?: string = '';

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  switchValue1 = false;
  switchValue2 = false;
  loading = false;
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser?: string;
  documentTypeData: any[] = [];

  authorityTypes: SelectList[] = [
    { CODE: '1', NAME: 'Reporting to Levels' },
    { CODE: '2', NAME: 'Employee' },
    { CODE: '3', NAME: 'Role' },
    { CODE: '4', NAME: 'Designation' },
    { CODE: '5', NAME: 'Head of Division' },
    { CODE: '6', NAME: 'Head of Department' },
    { CODE: '7', NAME: 'Head of Sub-Department' },
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

  documentsColumnDefs = [
    { field: 'DocumentType', headerName: 'DocumentType' },
    { field: 'DocumentName', headerName: 'DocumentName' },
    { field: 'Version', headerName: 'Version' },
    { field: 'Division', headerName: 'Division' },
    { field: 'Department', headerName: 'Department' },
    { field: 'SubDepartment', headerName: 'Sub-Department' },
    { field: 'URL', headerName: 'URL' },
    { field: 'DistributionList', headerName: 'Distribution List' },
    { field: 'RequestCreatedBy', headerName: 'Request Create dBy' },
    { field: 'RequestCreatedOn', headerName: 'Request Created On' },
    { field: 'PrevisionVersionCreatedBy', headerName: 'Prevision Version Created By' },
    { field: 'PrevisionVersionCreatedOn', headerName: 'Prevision Version Created On' },
    { field: 'ApprovalHistory', headerName: 'Approval History' },
    { field: 'Revision History', headerName: 'Revision History', filter: 'agSetColumnFilter' },
    // {
    //   field: 'CreatedAt',
    //   headerName: 'Last Saved On',
    //   valueFormatter: (params: any) => {
    //     if (!params.value) return '';
    //     // Parse string to Date and format as desired
    //     const date = new Date(params.value);
    //     if (isNaN(date.getTime())) return params.value; // fallback to raw string
    //     return date.toLocaleString(); // or format however you want
    //   },
    // },
  ];

  radioValue = '';
  // single state

  constructor() {}

  ngOnInit() {
    this.loadData(this.pageSize);
  }

  public noRowsOverlay: string = '';

  selectedAuthorityType: number | null = null;

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
  }

  selectedWorkflowExclude: number | null = null;
  onWorkflowExcludeChange(value: number | null): void {
    this.selectedWorkflowExclude = value;
  }

  loadData(pageNumber: number) {
    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.rowData = allData.slice(start, end);
    this.totalDocuments = allData.length;

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

  onDivisionChange(value: string): void {
    this.selectedDivisions = value;
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
  }
  onDepartmentsChange(value: string): void {
    this.selectedDepartment = value;
    this.selectedSubDepartment = '';
  }
  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;
  }

  GetAllDocuments(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'documentGrid':
        this.divisionPageSize = pageSize;
        this.GetAllDocuments({
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
}
