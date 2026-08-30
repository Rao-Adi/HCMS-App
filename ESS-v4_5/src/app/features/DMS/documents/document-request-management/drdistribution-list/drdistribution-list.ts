import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper'; 
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { DistributionListService } from '@app/shared/services/distribution-list.service';
import { DistributionTypeService } from '@app/shared/services/distribution-type.service';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { PermissionService } from '@app/shared/services/permission.service'; 
import { ColDef } from 'ag-grid-community';
import { forkJoin } from 'rxjs';

export interface DropdownOption {
  id: string | number;
  text: string;
}
export interface DistributionGridRow {
  id: number;
  level1Id: string | null;
  level2Id: string | null;
  level3Id: string | null;
  level4Id: string | null;
  roleId: number | null;
  distributiontypeId: number | null;
}
@Component({
  selector: 'app-drdistribution-list',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './drdistribution-list.html',
  styleUrl: './drdistribution-list.css',
})
export class DRDistributionList {
  @Input() DocumentTypeCode: string | null = null;
  @Input() selectedDistributionList: any[] = [];
  @Output() distributionChanged = new EventEmitter<any[]>();

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'requestdocumentcreation';

  private isInternalUpdate = false;

  gridConfig: GridConfig = {} as GridConfig;

  distributionListData: DistributionGridRow[] = [];
  userRoles: string[] = [];
  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[]=[];
  businessDomains: any[] = [];
  roles: { id: any; text: string }[] = [];
  distributionTypeList: { id: any; text: string }[] = [];
  selectedPageSize = 1; // default value
  totalManullayManageEmployees = 0;
  loading = false;

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  pinnedTopRowDataPlanning: DistributionColumns[] = [
    {
      divisionId: null,
      departmentId: null,
      subdepartmentId: null,
      businessdomainId: null,
      roleId: null,
      distributiontypeId: null,
      isNewRow: true,
    },
  ];

  constructor(
    private _distributionList: DistributionListService,
    private _distributionTypeService: DistributionTypeService, 
    private _notificationToastService: NotificationToastService,
    private _cabinetHirarchyService: CabinetHierarchyService,
    private cabinetGridService: CabinetGridService,
    private _permissionService: PermissionService,
    private _peoplePartnerService: PeoplePartnersService
  ) {
    
  }

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.loadDropdownsAndGrid(); 
    });

    // this.GetAllDistributionList({
    //   pageNumber: 1,
    //   pageSize: this.selectedPageSize,
    //   sortModel: [], // or your current sort/filter model
    //   filterModel: {},
    // });
    //console.log(this.loadDropdownsAndGrid());
    // this._cabinetHirarchyService.loadDropdownHierarchy().subscribe((levels) => {
    //   this.cabinetHierarchy = levels;

    //   this.cabinetGridService.loadDropdownData(levels).subscribe(() => this.buildGrid());
    // });
  }
 

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedDistributionList']) {
      if (this.isInternalUpdate) {
        this.isInternalUpdate = false;
        return; // prevent re-hydration loop
      }

      this.setGridData();
    }
  }

  private setGridData() {
    if (!this.selectedDistributionList.length) return;
    // console.log(JSON.stringify(this.selectedDistributionList));
    this.distributionListData = this.selectedDistributionList.map((item: any) => ({
      id: item.Id ?? this.generateId(),

      level1Id: item.DivisionCode ?? item.level1Id ?? null,
      level2Id: item.DepartmentCode ?? item.level2Id ?? null,
      level3Id: item.SubDepartmentCode ?? item.level3Id ?? null,
      level4Id: item.BusinessDomainCode ?? item.level4Id ?? null,

      roleId: item.RoleId ?? item.roleId ?? null,
      distributiontypeId: item.DistributionTypeId ?? item.distributiontypeId ?? null,
    }));

    this.distributionListData = [...this.distributionListData];
  }

  private getRemainingColumns(): GridColumn[] {
    return [
      {
        field: 'roleId',
        headerName: 'Role',
        type: 'dropdown',
        dropdownOptions: this.userRoles,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        placeholder: 'Please select any',
        required: true,
      },
      // DOCUMENT TYPES
      {
        field: 'distributiontypeId',
        headerName: 'Distribution Type',
        type: 'dropdown',
        dropdownOptions: this.distributionTypeList,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        placeholder: 'Please select any',
        required: true,
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

  private getColumns(): GridColumn[] {
    return [
      ...this.cabinetGridService.buildCabinetColumns(this.cabinetHierarchy),
      ...this.getRemainingColumns(),
    ];
  }

  GetAllDistributionList(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._distributionList
      .GetAllDistributionTypes(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalManullayManageEmployees = res.Data.TotalCount;
          this.distributionListData = res.Data.Items.map((item: any) => ({
            Id: item.id || item.Id,
            distributiontypeId: item.Distribution || item.distribution,
            distributiontype: item.DistributionType || item.DistributionType,
            roleId: item.RoleId || item.roleId,
            role: item.Role || item.role,
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
            businessdomainId: item.BusinessDomainCode,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          }));
          //console.log('Mapped documentTypeData:', this.documentTypeData);
        } else {
          this.distributionListData = [];
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
    // console.log('Row added:', rowData); 
    // Add logic to generate IDs, validate, etc.
    // const payLoad = {
    //   distributionType: rowData.DistributiontypeId || rowData.distributiontypeId,
    //   divisionCode: rowData.level1Id || rowData.level1Id,
    //   departmentCode: rowData.level2Id || rowData.level2Id,
    //   subDepartmentCode: rowData.level3Id || rowData.level3Id,
    //   businessDomainCode: rowData.level4Id || rowData.level4Id,
    //   roleId: rowData.RoleId || rowData.roleId,
    //   DocumentTypeCode: this.DocumentTypeCode,
    // };

    // this.distributionListData = [payLoad, ...this.distributionListData];

    const newRow = {
      id: this.generateId(),

      level1Id: rowData.level1Id ?? null,
      level2Id: rowData.level2Id ?? null,
      level3Id: rowData.level3Id ?? null,
      level4Id: rowData.level4Id ?? null,

      roleId: rowData.roleId ?? null,
      distributiontypeId: rowData.distributiontypeId ?? null,
    };

    this.distributionListData = [newRow, ...this.distributionListData];

    // const rowWithId: = {
    //   ...rowData,
    //   id: this.generateId(),
    //   divisionName: this.getDisplayName(this.divisions, rowData.level1Id),
    //   departmentName: this.getDisplayName(this.departments, rowData.level2Id),
    //   subDepartmentName: this.getDisplayName(this.roles, rowData.level3Id),
    //   businessDomainName: this.getDisplayName(this.roles, rowData.level4Id),
    //   distributiontypeId: this.getDisplayName(
    //     this.distributionTypeList,
    //     rowData.distributiontypeId,
    //   ),
    // };
    //this.distributionListData = [rowWithId, ...this.distributionListData];
    this.notifyParent();

    // this._distributionList.create(payLoad).subscribe(() => {
    //   this._notificationToasService.createNotification(
    //     'sucess',
    //     'Distribution List',
    //     'Distribution list added successfully!',
    //   );

    //   const rowWithId = {
    //     ...rowData,
    //     id: this.generateId(),
    //     divisionName: this.getDisplayName(this.divisions, rowData.level1Id),
    //     departmentName: this.getDisplayName(this.departments, rowData.level2Id),
    //     subDepartmentName: this.getDisplayName(this.roles, rowData.level3Id),
    //     businessDomainName: this.getDisplayName(this.roles, rowData.level4Id),
    //     distributiontypeId: this.getDisplayName(
    //       this.distributionTypeList,
    //       rowData.distributiontypeId,
    //     ),
    //   };

    //   this.distributionListData = [rowWithId, ...this.distributionListData];
    // });
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

    this.distributionListData[event.index] = { ...event.rowData };
    this.distributionListData = [...this.distributionListData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    // console.log('Row deleted at index:', rowIndex);
    this.distributionListData.splice(rowIndex, 1);
    this.distributionListData = [...this.distributionListData];

    this.notifyParent();
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', JSON.stringify(event));

    // Handle calculations if needed
    if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
      const currentSalary = event.rowData.currentSalary || 0;
      const incrementPercentage = event.rowData.incrementPercentage || 0;
      event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

      // Update the row
      this.distributionListData[event.rowIndex] = { ...event.rowData };
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

  private loadDropdownsAndGrid(): void {
    forkJoin({
      userRoles: this._peoplePartnerService.GetAllRoles(),
      distributionTypes: this._distributionTypeService.getDistributionTypeList(),
      hierarchy: this._cabinetHirarchyService.loadDropdownHierarchy(),
    }).subscribe(({ userRoles, distributionTypes, hierarchy }) => {
      // ✅ Normalize Roles
      this.userRoles =
        userRoles?.Data?.map((d: any) => ({
          id: d.Id,
          text: d.Value,
        })) ?? [];

      // ✅ Normalize Document Types
      this.distributionTypeList =
        distributionTypes?.Data?.map((d: any) => ({
          id: d.Id,
          text: d.Value,
        })) ?? [];

      // ✅ Cabinet hierarchy
      this.cabinetHierarchy = hierarchy;

      // ✅ Load hierarchy dropdown data
      this.cabinetGridService.loadDropdownData(hierarchy).subscribe(() => this.buildGrid());
    });
  }

  private notifyParent(): void {
    this.isInternalUpdate = true;
    this.distributionChanged.emit([...this.distributionListData]);
    // const cleanList = this.distributionListData.map((x) => ({
    //   divisionCode: x.level1Id,
    //   departmentCode: x.level2Id,
    //   subDepartmentCode: x.level3Id,
    //   businessDomainCode: x.level4Id,
    //   roleId: x.roleId,
    //   distributionTypeId: x.distributiontypeId,
    // }));

    // this.distributionChanged.emit(cleanList);
  };

  
  
  GetAllUserRoles = () => {
    this._peoplePartnerService.GetAllRoles().subscribe((res) => {
      if (res) {
        this.userRoles = (res.Data ?? []).map((d: any) => ({
          id: d.Id,
          text: d.Value,
        }));
      } else {
        this.userRoles = [];
      }
    });
  };
}

class DistributionColumns {
  divisionId: string | null = null;
  departmentId: string | null = null;
  subdepartmentId: string | null = null;
  businessdomainId: string | null = null;
  roleId: string | null = null;
  distributiontypeId: string | null = null;
  isNewRow: boolean = false;
}
