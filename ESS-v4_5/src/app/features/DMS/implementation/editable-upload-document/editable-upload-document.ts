import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';

@Component({
  selector: 'app-editable-upload-document',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './editable-upload-document.html',
  styleUrl: './editable-upload-document.css',
})
export class EditableUploadDocument {
  gridConfig: GridConfig;
  employeeData: any[] = [];
  // divisions = [
  //   { id: 1, text: 'Software Division' },
  //   { id: 2, text: 'Quality Management' },
  //   { id: 3, text: 'Development' },
  //   { id: 4, text: 'Pharma' },
  // ];

  // departments = [
  //   { id: 1, text: 'Quality Assurance' },
  //   { id: 2, text: 'Marketing' },
  //   { id: 3, text: 'HR Sub-Dept' },
  //   { id: 4, text: 'Software Department' },
  // ];

  // roles = [
  //   { id: 1, text: 'Developer' },
  //   { id: 2, text: 'Senior Developer' },
  //   { id: 3, text: 'Quality Assurance' },
  //   { id: 4, text: 'Data Engineer' },
  //   { id: 5, text: 'HR Specialist' },
  // ];

  divisions = [
    { id: '0001', text: 'Software Division' },
    { id: '0002', text: 'Quality Management' },
    { id: '0003', text: 'Development' },
    { id: '0004', text: 'Pharma' },
  ];

  departments = [
    { id: '0001', text: 'Quality Assurance' },
    { id: '0002', text: 'Marketing' },
    { id: '0003', text: 'HR Sub-Dept' },
    { id: '0004', text: 'Software Department' },
  ];

  roles = [
    { id: '0001', text: 'Developer' },
    { id: '0002', text: 'Senior Developer' },
    { id: '0003', text: 'Quality Assurance' },
    { id: '0004', text: 'Data Engineer' },
    { id: '0005', text: 'HR Specialist' },
  ];

  constructor() {
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

    this.loadSampleData();
  }

  pinnedTopRowDataPlanning: UploadDocumentColumns[] = [
    {
      documentId: '',
      documentName: '',
      version: '',
      documentTypeId: '',
      documentType: '',
      division: '',
      divisionId: '',
      departmentId: '',
      department: '',
      subDepartmentId: '',
      subDepartment: '',
      isNewRow: true,
    },
  ];

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'documentId',
        headerName: 'Document Id',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        field: 'documentName',
        headerName: 'Document Name',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        field: 'version',
        headerName: 'Version',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        
        field: 'documentType',
        headerName: 'DocumentType',
        type: 'dropdown',
        minWidth: 180,
        dropdownOptions: this.divisions,
        dropdownValueField: 'documentTypeCode',
        dropdownDisplayField: 'documentTypeName',
        required: true,
      },
      {
        field: 'divisionId',
        headerName: 'Division',
        type: 'dropdown',
        minWidth: 180,
        dropdownOptions: this.divisions,
        dropdownValueField: 'divisionId',
        dropdownDisplayField: 'divisionName',
        required: true,
      },
      {
        field: 'departmentId',
        headerName: 'Department',
        type: 'dropdown',
        minWidth: 180,
        dropdownOptions: this.departments,
        dropdownValueField: 'departmentId',
        dropdownDisplayField: 'departmentName',
        required: true,
      },
      {
        field: 'subDepartmentId',
        headerName: 'SubDepartment',
        type: 'dropdown',
        minWidth: 180,
        dropdownOptions: this.departments,
        dropdownValueField: 'subDepartmentId',
        dropdownDisplayField: 'subDepartmentName',
        required: true,
      },
      {
        field: 'nextReviewDate',
        headerName: 'Next Review Date',
        type: 'date',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        field: 'uploadDocument',
        headerName: 'Upload Document',
        type: 'file',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      // {
      //   field: 'roleId',
      //   headerName: 'Role',
      //   type: 'dropdown',
      //   minWidth: 150,
      //   dropdownOptions: this.roles,
      //   dropdownValueField: 'roleId',
      //   dropdownDisplayField: 'roleName',
      // },
      // {
      //   field: 'currentSalary',
      //   headerName: 'Current Salary',
      //   type: 'number',
      //   minWidth: 150,
      //   prefix: 'Rs.',
      //   decimalPlaces: 2,
      // },
      // {
      //   field: 'incrementPercentage',
      //   headerName: 'Increment %',
      //   type: 'number',
      //   minWidth: 120,
      //   suffix: '%',
      //   decimalPlaces: 1,
      // },
      // {
      //   field: 'revisedSalary',
      //   headerName: 'Revised Salary',
      //   type: 'number',
      //   minWidth: 150,
      //   prefix: 'Rs.',
      //   decimalPlaces: 2,
      // },
      // {
      //   field: 'joinDate',
      //   headerName: 'Join Date',
      //   type: 'date',
      //   minWidth: 120,
      // },
      // {
      //   field: 'isActive',
      //   headerName: 'Active',
      //   type: 'checkbox',
      //   minWidth: 80,
      // },
    ];
  }

  private loadSampleData(): void {
    this.employeeData = [
      {
        documentId: 'DOC001',
        documentName: 'Employee Handbook',
        version: '3.1',
        documentTypeCode: '0001',
        documentTypeName: 'SOP',
        divisionId: '0001',
        divisionName: 'Corporate',
        departmentId: '0001',
        departmentName: 'Software Department',
        subDepartmentId: '0001',
        subDepartmentName: 'Recruitment',
        nextReviewDate: '2023-01-15',
        isActive: true,
      },
      {
        documentId: 'DOC001',
        documentName: 'Employee Handbook',
        version: '3.1',
        documentTypeCode: '0001',
        documentTypeName: 'SOP',
        divisionId: '0001',
        divisionName: 'Corporate',
        departmentId: '0001',
        departmentName: 'Software Department',
        subDepartmentId: '0001',
        subDepartmentName: 'Recruitment',
        nextReviewDate: '2026-01-15',
        isActive: true,
      },
    ];
  }

  onRowAdded(newRow: any): void {
    console.log('Row added:', newRow);
    // Add logic to generate IDs, validate, etc.
    const rowWithId = {
      ...newRow,
      id: this.generateId(),
      // Map dropdown IDs to display names
      divisionName: this.getDisplayName(this.divisions, newRow.divisionId),
      departmentName: this.getDisplayName(this.departments, newRow.departmentId),
      roleName: this.getDisplayName(this.roles, newRow.roleId),
    };

    this.employeeData = [rowWithId, ...this.employeeData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    console.log('Row updated:', event);
    // Update display names
    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
    event.rowData.departmentName = this.getDisplayName(
      this.departments,
      event.rowData.departmentId
    );
    event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

    this.employeeData[event.index] = { ...event.rowData };
    this.employeeData = [...this.employeeData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    console.log('Row deleted at index:', rowIndex);
    this.employeeData.splice(rowIndex, 1);
    this.employeeData = [...this.employeeData];
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    console.log('Cell value changed:', event);

    // Handle calculations if needed
    if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
      const currentSalary = event.rowData.currentSalary || 0;
      const incrementPercentage = event.rowData.incrementPercentage || 0;
      event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

      // Update the row
      this.employeeData[event.rowIndex] = { ...event.rowData };
    }

    if (event.field === 'file-preview') {
      // Handle file preview
      this.previewFile(event.value);
    } else {
      // Handle regular value changes
      console.log('Cell value changed:', event);
    }
  }

  previewFile(fileInfo: any): void {
    // Implement file preview logic
    if (fileInfo?.url) {
      // Open in modal or new tab
      window.open(fileInfo.url, '_blank');
    }
  }

  onSelectionChanged(selectedRows: any[]): void {
    console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }

  onGridReady(gridApi: any): void {
    console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  private generateId(): number {
    return Date.now();
  }

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  // Example of external grid control
  exportData(): void {
    console.log('Exporting data:', this.employeeData);
    // Add export logic
  }

  clearAll(): void {
    if (confirm('Clear all data?')) {
      this.employeeData = [];
    }
  }
}

class UploadDocumentColumns {
  documentId: string = '';
  documentName: string = '';
  version: string = '';
  documentTypeId: string = '';
  documentType: string = '';

  divisionId: string = '';
  division: string = '';
  departmentId: string = '';
  department: string = '';
  subDepartmentId: string = '';
  subDepartment: string = '';

  isNewRow: boolean = false;
}
