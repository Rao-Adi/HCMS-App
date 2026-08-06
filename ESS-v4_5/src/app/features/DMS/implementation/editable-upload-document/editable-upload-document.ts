import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-editable-upload-document',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper, NzModalModule],
  templateUrl: './editable-upload-document.html',
  styleUrl: './editable-upload-document.css',
})
export class EditableUploadDocument {
  private modal = inject(NzModalService);

  gridConfig: GridConfig;

  employeeData: any[] = [];
  documentTypes = [
    { id: 'DT1', text: 'SOP' },
    { id: 'DT2', text: 'Policy' },
    { id: 'DT3', text: 'Guideline' },
    { id: 'DT4', text: 'Form' },
  ];

  divisions = [
    { id: 'D1', text: 'Software Division', documentTypeId: 'DT1' },
    { id: 'D2', text: 'Quality Management', documentTypeId: 'DT1' },
    { id: 'D3', text: 'HR Division', documentTypeId: 'DT2' },
    { id: 'D4', text: 'Finance Division', documentTypeId: 'DT3' },
    { id: 'D5', text: 'IT Division', documentTypeId: 'DT4' },
  ];

  departments = [
    { id: 'DEP1', text: 'Software Department', divisionId: 'D1' },
    { id: 'DEP2', text: 'QA Department', divisionId: 'D1' },
    { id: 'DEP3', text: 'Development', divisionId: 'D2' },
    { id: 'DEP4', text: 'Testing', divisionId: 'D2' },
    { id: 'DEP5', text: 'HR Operations', divisionId: 'D3' },
    { id: 'DEP6', text: 'Recruitment', divisionId: 'D3' },
    { id: 'DEP7', text: 'Accounts', divisionId: 'D4' },
    { id: 'DEP8', text: 'Budget', divisionId: 'D4' },
    { id: 'DEP9', text: 'Infrastructure', divisionId: 'D5' },
    { id: 'DEP10', text: 'Support', divisionId: 'D5' },
  ];

  subDepartments = [
    { id: 'SD1', text: 'Frontend Team', departmentId: 'DEP1' },
    { id: 'SD2', text: 'Backend Team', departmentId: 'DEP1' },
    { id: 'SD3', text: 'Mobile Team', departmentId: 'DEP1' },

    { id: 'SD4', text: 'Manual QA', departmentId: 'DEP2' },
    { id: 'SD5', text: 'Automation QA', departmentId: 'DEP2' },

    { id: 'SD6', text: 'Angular Team', departmentId: 'DEP3' },
    { id: 'SD7', text: 'React Team', departmentId: 'DEP3' },

    { id: 'SD8', text: 'Functional Testing', departmentId: 'DEP4' },
    { id: 'SD9', text: 'Performance Testing', departmentId: 'DEP4' },

    { id: 'SD10', text: 'Payroll', departmentId: 'DEP5' },
    { id: 'SD11', text: 'Benefits', departmentId: 'DEP5' },

    { id: 'SD12', text: 'Campus Hiring', departmentId: 'DEP6' },
    { id: 'SD13', text: 'Lateral Hiring', departmentId: 'DEP6' },
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
      documentTypeId: null,
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      nextReviewDate: null,
      uploadDocument: null,
      isNewRow: true
    },
  ];

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'documentId',
        headerName: 'Document ID',
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
      // ✅ DOCUMENT TYPE
      {
        field: 'documentTypeId',
        headerName: 'Document Type',
        type: 'dropdown',
        dropdownOptions: this.documentTypes,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
      },

      // ✅ DIVISION
      {
        field: 'divisionId',
        headerName: 'Division',
        type: 'dropdown',
        dependsOn: 'documentTypeId',
        dataSourceKey: 'divisions',
        filterKey: 'documentTypeId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
      },

      // ✅ DEPARTMENT
      {
        field: 'departmentId',
        headerName: 'Department',
        type: 'dropdown',
        dependsOn: 'divisionId',
        dataSourceKey: 'departments',
        filterKey: 'divisionId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },

      // ✅ SUB DEPARTMENT
      {
        field: 'subDepartmentId',
        headerName: 'Sub Department',
        type: 'dropdown',
        dependsOn: 'departmentId',
        dataSourceKey: 'subDepartments',
        filterKey: 'departmentId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },

      {
        field: 'nextReviewDate',
        headerName: 'Next Review Date',
        type: 'date',
        required: true,
      },

      {
        field: 'uploadDocument',
        headerName: 'Upload Document',
        type: 'file',
        required: true,
      }
    ];
  }

  private loadSampleData(): void {
    this.employeeData = [
      {
        documentId: 'DOC001',
        documentName: 'Employee Handbook',
        version: '3.1',
        documentTypeId: 'DT1',
        documentTypeName: 'SOP',
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
        documentId: 'DOC001',
        documentName: 'Employee Handbook',
        version: '3.1',
        documentTypeId: 'DT1',
        documentTypeName: 'SOP',
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

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event;
    // Add logic to generate IDs, validate, etc.
    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      // Map dropdown IDs to display names
      divisionName: this.getDisplayName(this.divisions, rowData.divisionId),
      departmentName: this.getDisplayName(this.departments, rowData.departmentId),
      roleName: this.getDisplayName(this.roles, rowData.roleId),
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
    console.log('Cell value changed:', JSON.stringify(event));

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
    this.modal.confirm({
      nzTitle: 'Clear All Data',
      nzContent: 'Clear all data?',
      nzOkText: 'Clear',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeData = [];
      },
    });
  }
}

class UploadDocumentColumns {
  documentId: string = '';
  documentName: string = '';
  version: string = '';
  documentTypeId: string | null = null;
  //documentType: string = '';

  divisionId: string | null = null;
  //division: string | null = null;
  departmentId: string | null = null;
  //department: string | null = null;
  subDepartmentId: string | null = null;
  //subDepartment: string | null = null;
  nextReviewDate: string | null = null;
  uploadDocument: any = null;
  isNewRow: boolean = false;
}
