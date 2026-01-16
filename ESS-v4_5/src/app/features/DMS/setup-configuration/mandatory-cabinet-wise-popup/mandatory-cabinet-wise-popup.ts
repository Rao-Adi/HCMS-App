import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { NotificationService } from '@app/shared/notification/notification.service';
import { AttributeMandatoryScopeService } from '@app/shared/services/attribute-mandatory-scope.service';
import { DepartmentCacheService } from '@app/shared/services/CacheServices/department-cache-service';
import { DivisionCacheService } from '@app/shared/services/CacheServices/division-cache-service';
import { SubDepartmentCacheService } from '@app/shared/services/CacheServices/sub-department-cache-service';
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

  mandatoryCabinetData: any[] = [];

  mandatoryOptions = [
    { id: true, text: 'Yes' },
    { id: false, text: 'No' },
  ];

  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];

  constructor(
    private modalRef: NzModalRef,
    private _attributeMandatoryService: AttributeMandatoryScopeService,
    private _notification: NotificationService,
    private _divisionServices: DivisionCacheService,
    private _departmentCacheService: DepartmentCacheService,
    private _subDepartmentServices: SubDepartmentCacheService
  ) {
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

    //this.loadSampleData();
  }

  ngOnInit() {
    this.GetAllAttributeMandatoryScopes({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
    this.getAllDivisionList();
    this.getAllDepartmentList();
    this.getAllSubDepartmentList();
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
        minWidth: 180,
        required: true,
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
        minWidth: 180,
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
        minWidth: 180,
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
    this.mandatoryCabinetData = [
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

  onRowAdded(event: { rowData: any }): void {
    debugger;
    const { rowData } = event;

    const payLoad = {
      documentAttributeId: this.data.documentAttributeId,
      DivisionCode: this.getDisplayName(this.divisions, rowData.divisionName),
      DepartmentCode: this.getDisplayName(this.departments, rowData.departmentName),
      SubDepartmentCode: this.getDisplayName(this.subDepartments, rowData.subDepartmentName),
      mandatory: rowData.mandatory,
      IsActive: true,
      IsDeleted: false,
    };
    debugger;
    this._attributeMandatoryService.create(payLoad).subscribe({
      next: () => {
        this._notification.createNotification(
          'success',
          'Document Attribute',
          'Document Attribute created successfully!'
        );
      },
      error: (err) => {
        console.error('Create Document Attribute failed:', err);

        // Default fallback message
        let message = 'Something went wrong. Please try again.';

        // Handle backend error message (common patterns)
        if (err?.error?.Message) {
          message = err.error.Message;
        } else if (typeof err?.error === 'string') {
          message = err.error;
        }

        this._notification.createNotification('error', 'Document Attribute', message);
      },
    });

    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      // Map dropdown IDs to display names
      divisionName: this.getDisplayName(this.divisions, rowData.divisionName),
      departmentName: this.getDisplayName(this.departments, rowData.departmentName),
      subDepartmentName: this.getDisplayName(this.subDepartments, rowData.subDepartmentName),
      mandatory: this.getDisplayName(this.mandatoryOptions, rowData.mandatory),
    };

    this.mandatoryCabinetData = [rowWithId, ...this.mandatoryCabinetData];
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

    this.mandatoryCabinetData[event.index] = { ...event.rowData };
    this.mandatoryCabinetData = [...this.mandatoryCabinetData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    console.log('Row deleted at index:', rowIndex);
    this.mandatoryCabinetData.splice(rowIndex, 1);
    this.mandatoryCabinetData = [...this.mandatoryCabinetData];
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', JSON.stringify(event));

    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionName);
    event.rowData.departmentName = this.getDisplayName(
      this.departments,
      event.rowData.departmentName
    );
    event.rowData.subDepartmentName = this.getDisplayName(
      this.subDepartments,
      event.rowData.subDepartmentName
    );
    event.rowData.mandatory = this.getDisplayName(this.mandatoryOptions, event.rowData.mandatory);

    // Handle calculations if needed
    //if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
    // const currentSalary = event.rowData.currentSalary || 0;
    // const incrementPercentage = event.rowData.incrementPercentage || 0;
    // event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

    // // Update the row
    // this.mandatoryCabinetData[event.rowIndex] = { ...event.rowData };
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

  close() {
    this.modalRef.close();
  }

  GetAllAttributeMandatoryScopes(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._attributeMandatoryService
      .GetAllAttributeMandatoryScopes(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize
      )
      .subscribe((res) => {
        const items = res?.Data?.Items;
        console.log(items);
        if (Array.isArray(items)) {
          this.mandatoryCabinetData = items.map((item: any) => ({
            Id: item.Id,
            documentTypeId: item.DocumentType,
            documentTypeName: item.DocumentTypeCode,
            divisionName: item.Division,
            divisionId: item.DivisionCode,
            documentId: item.DocumentNumber,
            documentName: item.DocumentName,
            DocumentCode: item.DocumentCode,
            departmentName: item.Department,
            departmentId: item.DepartmentCode,
            subDepartmentName: item.SubDepartment,
            subDepartmentId: item.SubDepartmentCode,
            EffectiveFrom: item.EffectiveFrom,
            EffectiveTo: item.EffectiveTo,
            DocumentURL: item.DocumentURL,
            nextReviewDate: item.NextReviewDate,
            CreatedAt: item.CreatedAt,
            CreatedBy: item.CreatedBy,
            LastModifiedAt: item.LastModifiedAt,
            LastModifiedBy: item.LastModifiedBy,
          }));
        } else {
          this.mandatoryCabinetData = [];
        }

        console.log('RowData length:', this.mandatoryCabinetData.length);
      });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    this.divisionPageSize = pageSize;
    this.GetAllAttributeMandatoryScopes({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
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

  getAllDivisionList = () => {
    this._divisionServices.getDivisions().subscribe((res) => {
      if (res) {
        this.divisions = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
        }));
      } else {
        this.divisions = [];
      }
      // ✅ build grid ONLY after divisions are ready
      this.buildGrid();
    });
  };

  getAllDepartmentList = () => {
    this._departmentCacheService.getDepartments().subscribe((res) => {
      if (res) {
        this.departments = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
          divisionId: d.DivisionCode || d.divisionCode,
          Division: d.Division || d.division,
        }));
      } else {
        this.departments = [];
      }
    });
  };

  getAllSubDepartmentList = () => {
    this._subDepartmentServices.getSubDepartments().subscribe((res) => {
      if (res) {
        this.subDepartments = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
          departmentId: d.DepartmentCode || d.departmentCode,
          department: d.Department || d.department,
        }));
      } else {
        this.subDepartments = [];
      }
    });
  };
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
