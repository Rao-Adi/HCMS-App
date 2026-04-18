import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { NotificationService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { DocumentTypeCacheService } from '@app/shared/services/CacheServices/document-type-cache-service';
import { PermissionService } from '@app/shared/services/permission.service';
import { UserAccesssLevelService } from '@app/shared/services/user-access-level.service';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-access-level-modal-dialog',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './access-level-modal-dialog.html',
  styleUrl: './access-level-modal-dialog.css',
})
export class AccessLevelModalDialog {
  gridConfig: GridConfig = {} as GridConfig;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'users';

  manualUserData: any[] = [];
  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  documentTypes: any[] = [];
  totalManullayManageEmployees = 0;
  loading = false;

  selectedPageSize = 10; // default value

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

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

  private getColumns(): GridColumn[] {
    return [
      ...this.cabinetGridService.buildCabinetColumns(this.cabinetHierarchy),
      ...this.getRemainingColumns(),
    ];
  }

  private getRemainingColumns(): GridColumn[] {
    return [
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
    @Inject(NZ_MODAL_DATA) public modalData: any,
    private _documentTypeService: DocumentTypeCacheService,
    private _notification: NotificationService,
    private cabinetGridService: CabinetGridService,
    private readonly hierarchyService: CabinetHierarchyService,
    private _userAccessLevelService: UserAccesssLevelService,
    private _permissionService: PermissionService,
  ) {
    //this.loadSampleData();
  }

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      this.getAllDocumentTypes();
      this.hierarchyService.loadDropdownHierarchy().subscribe((levels) => {
        this.cabinetHierarchy = levels;

        this.cabinetGridService.loadDropdownData(levels).subscribe(() => this.buildGrid());
      });

      this.GetAllUserAccessLevel({
        pageNumber: 1,
        pageSize: this.selectedPageSize,
        sortModel: [], // or your current sort/filter model
        filterModel: {},
      });
    });
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
      enableInlineAdd: this.canAdd,
      enableInlineEdit: this.canEdit,
      enableInlineDelete: this.canDelete,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };
  }

  GetAllUserAccessLevel(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._userAccessLevelService
      .GetAccessLevelByEmployeeCode(this.modalData.employeeCode)
      .subscribe((res) => {
        if (res?.Success && res.Data) {
          this.totalManullayManageEmployees = res.Data.length;
          this.manualUserData = res.Data.map((item: any) => ({
            Id: item.id || item.Id,
            divisionCode: item.divisionCode || item.DivisionCode,
            level1Id: item.division || item.Division,
            departmentCode: item.departmentCode || item.DepartmentCode,
            level2Id: item.department || item.Department,
            subDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
            level3Id: item.subDepartment || item.SubDepartment,
            businessDomainCode: item.businessDomainCode || item.BusinessDomainCode,
            level4Id: item.businessDomain || item.BusinessDomain,
            documentTypeId: item.documentTypeCode || item.DocumentTypeCode,
            documentTypeName: item.documentType || item.DocumentType,
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
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

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event;

    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      divisionCode: rowData.level1Id || rowData.level1Id,
      departmentCode: rowData.level2Id || rowData.level2Id,
      subDepartmentCode: rowData.level3Id || rowData.level3Id,
      businessDomainCode: rowData.level4Id || rowData.level4Id,
      documentTypeCode: rowData.documentTypeId || rowData.documentTypeId,
      employeeCode: this.modalData.employeeCode,
    };

    this._userAccessLevelService.create(payLoad).subscribe(() => {
      this._notification.createNotification(
        'success',
        'Access Level',
        'Access Level created successfully!',
      );
    });
    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      divisionName: this.getDisplayName(this.divisions, rowData.level1Id),
      departmentName: this.getDisplayName(this.departments, rowData.level2Id),
      subDepartmentName: this.getDisplayName(this.subDepartments, rowData.level3Id),
      businessDomainName: this.getDisplayName(this.subDepartments, rowData.level4Id),
      documentTypeId: this.getDisplayName(this.documentTypes, rowData.documentTypeId),
    };

    this.manualUserData = [rowWithId, ...this.manualUserData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    //console.log('Row updated:', event); 
    // Update display names
    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
    event.rowData.departmentName = this.getDisplayName(
      this.departments,
      event.rowData.departmentId,
    );
    // event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

    this.manualUserData[event.index] = { ...event.rowData };
    this.manualUserData = [...this.manualUserData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    //console.log('Row deleted at index:', rowIndex);
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
