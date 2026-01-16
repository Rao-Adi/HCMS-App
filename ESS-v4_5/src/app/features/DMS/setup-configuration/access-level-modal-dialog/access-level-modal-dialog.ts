import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { NotificationService } from '@app/shared/notification/notification.service';
import { DepartmentCacheService } from '@app/shared/services/CacheServices/department-cache-service';
import { DivisionCacheService } from '@app/shared/services/CacheServices/division-cache-service';
import { DocumentTypeCacheService } from '@app/shared/services/CacheServices/document-type-cache-service';
import { SubDepartmentCacheService } from '@app/shared/services/CacheServices/sub-department-cache-service';
import { UserService } from '@app/shared/services/user-service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-access-level-modal-dialog',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './access-level-modal-dialog.html',
  styleUrl: './access-level-modal-dialog.css',
})
export class AccessLevelModalDialog {
  @Input() data: any;

  gridConfig: GridConfig = {} as GridConfig;

  manualUserData: any[] = [];
  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  documentTypes: any[] = [];
  totalManullayManageEmployees = 0;
  loading = false;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pinnedTopRowDataPlanning: AccessLevelColumns[] = [
    {
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      documentTypeId: null,
      isNewRow: true,
    },
  ];

  private loadSampleData(): void {
    this.manualUserData = [
      {
        documentTypeId: 'DT1',
        documentTypeName: 'SOP',
        divisionId: 'D1',
        divisionName: 'Corporate',
        departmentId: 'DEP1',
        departmentName: 'Software Department',
        subDepartmentId: 'SD1',
        subDepartmentName: 'Recruitment',
        isActive: true,
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
        isActive: true,
      },
    ];
  }

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
      // DOCUMENT TYPES
      {
        field: 'documentTypeId',
        headerName: 'Document Type',
        type: 'dropdown',
        dropdownOptions: this.documentTypes,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },
    ];
  }

  constructor(
    private _userService: UserService,
    private _documentTypeService: DocumentTypeCacheService,
    private _divisionServices: DivisionCacheService,
    private _departmentCacheService: DepartmentCacheService,
    private _subDepartmentServices: SubDepartmentCacheService,
    private _notification: NotificationService
  ) {
    this.loadSampleData();
  }

  ngOnInit() {
    this.getAllDocumentTypes();
    this.getAllDivisionList();
    this.getAllDepartmentList();
    this.getAllSubDepartmentList();
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

  GetAllManuallyManageEmployee(query: any) {
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
        pageSize
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalManullayManageEmployees = res.Data.TotalCount;
          this.manualUserData = res.Data.Items.map((item: any) => ({
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
            DateOfJoining: item.dateOfJoining || item.DateOfJoining,
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            Description: item.description || item.Description,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: item.createdAt || item.CreatedAt || '',
          }));
          //console.log('Mapped documentTypeData:', this.documentTypeData);
        } else {
          this.manualUserData = [];
        }
        //this.cdr.detectChanges(); // force update
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

  onRowAdded(newRow: any): void {
    console.log('Row added:', newRow);
    debugger;
    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      divisionCode: newRow.DivisionName || newRow.divisionName,
      departmentCode: newRow.DepartmentName || newRow.departmentName,
      subDepartmentCode: newRow.SubDepartmentCode || newRow.subDepartmentName,
      documentTypeId: newRow.documentTypeId || newRow.documentTypeId,
    };

    this._userService.create(payLoad).subscribe(() => {
      this._notification.createNotification(
        'success',
        'Access Level',
        'Access Level created successfully!'
      );
    });
    const rowWithId = {
      ...newRow,
      id: this.generateId(),
      divisionName: this.getDisplayName(this.divisions, newRow.divisionName),
      departmentName: this.getDisplayName(this.departments, newRow.departmentName),
      subDepartmentName: this.getDisplayName(this.subDepartments, newRow.subDepartmentName),
      documentTypeId: this.getDisplayName(this.documentTypes, newRow.documentTypeId),
    };

    this.manualUserData = [rowWithId, ...this.manualUserData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    console.log('Row updated:', event);
    debugger;
    // Update display names
    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
    event.rowData.departmentName = this.getDisplayName(
      this.departments,
      event.rowData.departmentId
    );
    // event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

    this.manualUserData[event.index] = { ...event.rowData };
    this.manualUserData = [...this.manualUserData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    console.log('Row deleted at index:', rowIndex);
    this.manualUserData.splice(rowIndex, 1);
    this.manualUserData = [...this.manualUserData];
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', JSON.stringify(event));

    // Handle calculations if needed
    if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
      const currentSalary = event.rowData.currentSalary || 0;
      const incrementPercentage = event.rowData.incrementPercentage || 0;
      event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

      // Update the row
      this.manualUserData[event.rowIndex] = { ...event.rowData };
    }

    if (event.field === 'file-preview') {
      // Handle file preview
      this.previewFile(event.value);
    } else {
      // Handle regular value changes
      //console.log('Cell value changed:', event);
    }
  }

  private generateId(): number {
    return Date.now();
  }

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  previewFile(fileInfo: any): void {
    // Implement file preview logic
    if (fileInfo?.url) {
      // Open in modal or new tab
      window.open(fileInfo.url, '_blank');
    }
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

  getAllDocumentTypes = () => {
    this._documentTypeService.getDocumentTypes().subscribe((res) => {
      if (res) {
        this.documentTypes = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
        }));
      } else {
        this.documentTypes = [];
      }
      // ✅ build grid ONLY after divisions are ready
      this.buildGrid();
    });
  };
}

class AccessLevelColumns {
  divisionId: string | null = null;
  //division: string | null = null;
  departmentId: string | null = null;
  //department: string | null = null;
  subDepartmentId: string | null = null;
  //subDepartment: string | null = null;
  documentTypeId: string | null = null;
  isNewRow: boolean = false;
}
