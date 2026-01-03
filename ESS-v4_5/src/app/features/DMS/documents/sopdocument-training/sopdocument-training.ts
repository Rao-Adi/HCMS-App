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
  selector: 'app-sopdocument-training',
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
    SafeTranslatePipe,
    AgGridWrapper,
    DivisionList,
    SubDepartmentList,
    DepartmentList,
    DocumentTypeList,
  ],
  templateUrl: './sopdocument-training.html',
  styleUrl: './sopdocument-training.css',
})
export class SOPDocumentTraining {
  selectedTab: string = 'Class Room';

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedDocumentType?: string = '';

  pageSize = 10;
  rowData: any[] = [];
  totalClassRoom = 0;
  totalOnline = 0;

  constructor() {}

  ngOnInit() {
    this.loadData(this.pageSize);
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  classRoomColumnDefs = [
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

  onlineColumnDefs = [
    { field: 'documentId', headerName: 'Document ID' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version Number' },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'nextReviewDate', headerName: 'Next Review Date' },
  ];

  companies: SelectList[] = [
    { CODE: '1', NAME: 'ATCO' },
    { CODE: '2', NAME: 'Softronic' },
  ];

  loadData(pageNumber: number) {
    // 🔹 TEMP: Dummy data mode
    const allData = this.getDummyData();

    // 🔹 Simulate server-side pagination
    const start = (pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.rowData = allData.slice(start, end);
    this.totalClassRoom = allData.length;

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

  GetAllClassRooms(query: any) {}
  GetAllOnline(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'classroomGrid':
        this.divisionPageSize = pageSize;
        this.GetAllClassRooms({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'onlineGrid':
        this.employeePageSize = pageSize;
        this.GetAllClassRooms({
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
