import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { NotificationService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { AttributeMandatoryScopeService } from '@app/shared/services/attribute-mandatory-scope.service';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { DepartmentCacheService } from '@app/shared/services/CacheServices/department-cache-service';
import { DivisionCacheService } from '@app/shared/services/CacheServices/division-cache-service';
import { SubDepartmentCacheService } from '@app/shared/services/CacheServices/sub-department-cache-service';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-mandatory-cabinet-wise-popup',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './mandatory-cabinet-wise-popup.html',
  styleUrl: './mandatory-cabinet-wise-popup.css',
})
export class MandatoryCabinetWisePopup {
  @Input() data: any;

  cabinetId!: number;

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

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  constructor(
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) public modalData: any,
    private _attributeMandatoryService: AttributeMandatoryScopeService,
    private _notification: NotificationService,
    private readonly hierarchyService: CabinetHierarchyService,
    private cabinetGridService: CabinetGridService,
  ) {
    this.cabinetId = modalData.data;
    //console.log('Received cabinet id:', this.cabinetId);

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

  ngOnInit() {
    this.hierarchyService.loadDropdownHierarchy().subscribe((levels) => {
      this.cabinetHierarchy = levels;

      this.cabinetGridService.loadDropdownData(levels).subscribe(() => this.buildGrid());
    });

    this.GetAllAttributeMandatoryScopes({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
    // this.getAllDivisionList();
    // this.getAllDepartmentList();
    // this.getAllSubDepartmentList();
  }

  private getColumns(): GridColumn[] {
    return [
      ...this.cabinetGridService.buildCabinetColumns(this.cabinetHierarchy),
      ...this.getRemainingColumns(),
    ];
  }

  private getRemainingColumns(): GridColumn[] {
    return [
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

  pinnedTopRowDataPlanning: UploadDocumentColumns[] = [
    {
      divisionId: null,
      divisionName: null,
      departmentId: null,
      departmentName: null,
      subDepartmentId: null,
      subDepartmentName: null,
      mandatory: true,
      isNewRow: true,
    },
  ];

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
    const { rowData } = event;
    debugger;
    const payLoad = { 
      documentAttributeId: this.cabinetId,
      divisionCode: rowData.level1Id || rowData.level1Id,
      departmentCode: rowData.level2Id || rowData.level2Id,
      subDepartmentCode: rowData.level3Id || rowData.level3Id,
      businessDomainCode: rowData.level4Id || rowData.level4Id,
      isMandatory: rowData.mandatory,
      IsActive: true,
      IsDeleted: false,
    };
    this._attributeMandatoryService.create(payLoad).subscribe({
      next: () => {
        this._notification.createNotification(
          'success',
          'Document Attribute',
          'Document Attribute created successfully!',
        );

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
  }

  onRowUpdated(event: { rowData: any }): void {
    const { rowData } = event;

    //console.log('Row updated:', event);
    // Update display names
    const payLoad = {
      documentAttributeId: this.cabinetId,
      DivisionCode: rowData.divisionName,
      DepartmentCode: rowData.departmentName,
      SubDepartmentCode: rowData.subDepartmentName,
      mandatory: rowData.mandatory,
      IsActive: true,
      IsDeleted: false,
    };
    this._attributeMandatoryService.update(payLoad).subscribe({
      next: () => {
        this._notification.createNotification(
          'success',
          'Document Attribute',
          'Document Attribute created successfully!',
        );

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
  }

  onRowDeleted(rowIndex: number): void {
    // console.log('Row deleted at index:', rowIndex);
    this.mandatoryCabinetData.splice(rowIndex, 1);
    this.mandatoryCabinetData = [...this.mandatoryCabinetData];
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', JSON.stringify(event));

    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionName);
    event.rowData.departmentName = this.getDisplayName(
      this.departments,
      event.rowData.departmentName,
    );
    event.rowData.subDepartmentName = this.getDisplayName(
      this.subDepartments,
      event.rowData.subDepartmentName,
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
    this._attributeMandatoryService
      .getAttributeMandatoryScopesById(this.cabinetId)
      .subscribe((res) => {
        const items = res?.Data?.Items;
        //console.log(items);
        if (Array.isArray(items)) {
          this.mandatoryCabinetData = items.map((item: any) => ({
            Id: item.Id,
            divisionName: item.Division,
            level1Id: item.DivisionCode,
            documentId: item.DocumentNumber,
            documentName: item.DocumentName,
            DocumentCode: item.DocumentCode,
            level2Id: item.Department,
            departmentId: item.DepartmentCode,
            level3Id: item.SubDepartment,
            subDepartmentId: item.SubDepartmentCode,
            level4Id: item.BusinessDomain,
            businessDomainId: item.BusinessDomainCode,
            mandatory: item.IsMandatory,
            CreatedAt: new CustomDateFormatPipe().transform(item.CreatedAt || ''),
            CreatedBy: item.CreatedBy,
            LastModifiedAt: new CustomDateFormatPipe().transform(item.LastModifiedAt || ''),
            LastModifiedBy: item.LastModifiedBy,
          }));
        } else {
          this.mandatoryCabinetData = [];
        }
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
}

class UploadDocumentColumns {
  divisionId: string | null = null;
  divisionName: string | null = null;
  departmentId: string | null = null;
  departmentName: string | null = null;
  subDepartmentId: string | null = null;
  subDepartmentName: string | null = null;
  mandatory: boolean = false;
  isNewRow: boolean = false;
}
