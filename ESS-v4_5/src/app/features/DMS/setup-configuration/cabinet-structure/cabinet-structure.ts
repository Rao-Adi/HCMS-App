import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-cabinet-structure',
  imports: [CommonModule, SafeTranslatePipe, AgGridWrapper],
  templateUrl: './cabinet-structure.html',
  styleUrl: './cabinet-structure.css',
})
export class CabinetStructure {
  selectedTab: string = 'Level1';

  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';

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

  divisionColumnDefs = [
    { field: 'divisionCode', headerName: 'Division Code', flex: 1 },
    { field: 'Division', headerName: 'Division', minWidth: 300, flex: 1 },
    {
      field: 'lastSavedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
    },
    {
      field: 'lastSavedOn',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
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
  ];

  departmentColumnDefs = [
    { field: 'departmentCode', headerName: 'Department Code', flex: 1 },
    { field: 'department', headerName: 'Department', minWidth: 300, flex: 1 },
    {
      field: 'division',
      headerName: 'Division',
      minWidth: 300,
      flex: 1,
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },

    {
      field: 'lastSavedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
    },
    {
      field: 'lastSavedOn',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
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
  ];

  subDepartmentColumnDefs = [
    { field: 'subdepartmentCode', headerName: 'Sub-Department Code', flex: 1 },
    { field: 'subdepartment', headerName: 'Sub-Department', minWidth: 300, flex: 1 },
    {
      field: 'department',
      headerName: 'Department',
      minWidth: 300,
      flex: 1,
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },

    {
      field: 'lastSavedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
    },
    {
      field: 'lastSavedOn',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
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
  ];

  businessdomainColumnDefs = [
    { field: 'code', headerName: 'Code', flex: 1 },
    { field: 'businessDomain', headerName: 'Business Domain', minWidth: 300, flex: 1 },
    {
      field: 'subdepartment',
      headerName: 'Sub-Department',
      minWidth: 300,
      flex: 1,
      cellEditorParams: {
        values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      },
    },

    {
      field: 'lastSavedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
    },
    {
      field: 'lastSavedOn',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
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
  ];

  documentTypeColumnDefs = [
    { field: 'documentcode', headerName: 'Document Code', flex: 1 },
    { field: 'documentType', headerName: 'Document Type', minWidth: 300, flex: 1 },
    {
      field: 'description',
      headerName: 'Descriptiont',
      minWidth: 300,
      flex: 1
    },

    {
      field: 'lastSavedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
    },
    {
      field: 'lastSavedOn',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',
      minWidth: 300,
      flex: 1,
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

  pageSize = 10;
  rowData: any[] = [];
  totalRows = 0;

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
}
