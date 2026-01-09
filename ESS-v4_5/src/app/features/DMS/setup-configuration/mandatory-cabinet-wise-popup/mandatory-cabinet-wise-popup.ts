import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-mandatory-cabinet-wise-popup',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './mandatory-cabinet-wise-popup.html',
  styleUrl: './mandatory-cabinet-wise-popup.css',
})
export class MandatoryCabinetWisePopup {
  @Input() data: any;

  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  totalCount = 0;
  rowData: any[] = [];

  gridConfig: GridConfig = {} as GridConfig;

  employeeData: any[] = [];

  mandatoryOptions = [
    { id: true, text: 'Yes' },
    { id: false, text: 'No' },
  ];

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

  constructor(private modalRef: NzModalRef) {
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
      divisionId: null,
      divisionName: null,
      departmentId: null,
      departmentName: null,
      subDepartmentId: null,
      subDepartmentName: null,
      isNewRow: true,
    },
  ];

  private getColumns(): GridColumn[] {
    return [
      // ✅ DIVISION
      {
        field: 'divisionName',
        headerName: 'Division',
        type: 'dropdown',
        dropdownOptions: this.divisions,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
      },

      // ✅ DEPARTMENT
      {
        field: 'departmentName',
        headerName: 'Department',
        type: 'dropdown',
        dependsOn: 'divisionName',
        dataSourceKey: 'departments',
        filterKey: 'divisionId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },

      // ✅ SUB DEPARTMENT
      {
        field: 'subDepartmentName',
        headerName: 'Sub Department',
        type: 'dropdown',
        dependsOn: 'departmentName',
        dataSourceKey: 'subDepartments',
        filterKey: 'departmentId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },
      {
        field: 'mandatory',
        headerName: 'Mandatory',
        type: 'dropdown',
        dropdownOptions: this.mandatoryOptions,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
      },
    ];
  }

  private loadSampleData(): void {
    this.employeeData = [
      {
        documentTypeId: 'DT1',
        documentTypeName: 'SOP',
        divisionId: 'D1',
        divisionName: 'Corporate',
        departmentId: 'DEP1',
        departmentName: 'Software Department',
        subDepartmentId: 'SD1',
        subDepartmentName: 'Recruitment',
        mandatory: true,
      },
      {
        documentTypeId: 'DT1',
        documentTypeName: 'SOP',
        divisionId: 'D1',
        divisionName: 'Corporate',
        departmentId: 'DEP1',
        departmentName: 'Software Department',
        subDepartmentId: 'SD1',
        subDepartmentName: 'Recruitment',
        mandatory: true,
      },
    ];
  }

  onRowAdded(newRow: any): void {
    console.log('Row added:', newRow);
    debugger;
    // Add logic to generate IDs, validate, etc.
    const rowWithId = {
      ...newRow,
      id: this.generateId(),
      // Map dropdown IDs to display names
      divisionName: this.getDisplayName(this.divisions, newRow.divisionName),
      departmentName: this.getDisplayName(this.departments, newRow.departmentName),
      subDepartmentName: this.getDisplayName(this.subDepartments, newRow.subDepartmentName),
      mandatory: this.getDisplayName(this.mandatoryOptions, newRow.mandatory),
    };

    this.employeeData = [rowWithId, ...this.employeeData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    debugger;
    console.log('Row updated:', event);
    // Update display names
    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
    event.rowData.departmentName = this.getDisplayName(
      this.departments,
      event.rowData.departmentId
    );
    event.rowData.subDepartmentName = this.getDisplayName(
      this.subDepartments,
      event.rowData.subDepartmentId
    );
    event.rowData.mandatory = this.getDisplayName(this.mandatoryOptions, event.rowData.mandatory);

    this.employeeData[event.index] = { ...event.rowData };
    this.employeeData = [...this.employeeData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    console.log('Row deleted at index:', rowIndex);
    this.employeeData.splice(rowIndex, 1);
    this.employeeData = [...this.employeeData];
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    debugger;
    //console.log('Cell value changed:', JSON.stringify(event));

    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionName);
    event.rowData.departmentName = this.getDisplayName(this.departments, event.rowData.departmentName);
    event.rowData.subDepartmentName = this.getDisplayName(this.subDepartments, event.rowData.subDepartmentName);
    event.rowData.mandatory = this.getDisplayName(this.mandatoryOptions, event.rowData.mandatory);

    // Handle calculations if needed
    //if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
    // const currentSalary = event.rowData.currentSalary || 0;
    // const incrementPercentage = event.rowData.incrementPercentage || 0;
    // event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

    // // Update the row
    // this.employeeData[event.rowIndex] = { ...event.rowData };
    //}

    if (event.field === 'file-preview') {
      // Handle file preview
      //this.previewFile(event.value);
    } else {
      // Handle regular value changes
      console.log('Cell value changed:', event);
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

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  private generateId(): number {
    return Date.now();
  }

  private getTextById(options: any[], id: any, valueField: string, displayField: string): string {
    if (id === null || id === undefined) return '';
    return options.find((o) => o[valueField] === id)?.[displayField] ?? id;
  }

  close() {
    this.modalRef.close();
  }

  GetAllDocumentTypeGrid(query: any) {}

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'documentTypeGrid':
        this.divisionPageSize = pageSize;
        this.GetAllDocumentTypeGrid({
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

  loadBusinessDomains(query: any): void {
    const sort = query.sortModel?.[0];

    // this._businessDomainService
    //   .GetAllBusinessDomains(
    //     query.filterModel?.Name?.filter || '',
    //     sort?.sort?.toUpperCase() || 'ASC',
    //     sort?.colId || 'Name',
    //     true,
    //     query.pageNumber,
    //     query.pageSize
    //   )
    //   .subscribe((res) => {
    //     if (res?.Success) {
    //       this.businessDomainData = res.Data.Items;
    //       this.totalBusinessDomains = res.Data.TotalCount;
    //     } else {
    //       this.businessDomainData = [];
    //       this.totalBusinessDomains = 0;
    //     }
    //   });
  }
}

class UploadDocumentColumns {
  divisionId: string | null = null;
  divisionName: string | null = null;
  departmentId: string | null = null;
  departmentName: string | null = null;
  subDepartmentId: string | null = null;
  subDepartmentName: string | null = null;
  isNewRow: boolean = false;
}
