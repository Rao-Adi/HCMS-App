import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
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
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { DepartmentCacheService } from '@app/shared/services/CacheServices/department-cache-service';
import { DivisionCacheService } from '@app/shared/services/CacheServices/division-cache-service';
import { DocumentTypeCacheService } from '@app/shared/services/CacheServices/document-type-cache-service';
import { SubDepartmentCacheService } from '@app/shared/services/CacheServices/sub-department-cache-service';
import { UserService } from '@app/shared/services/user-service';
import { ColDef } from 'ag-grid-community';
import { RivisionHistoryPopup } from '../rivision-history-popup/rivision-history-popup';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UtilitiesService } from '@app/core/services/utilities.service';

@Component({
  selector: 'app-drusers-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './drusers-component.html',
  styleUrl: './drusers-component.css',
})
export class DRUsersComponent {
  @Input() selectedUsers: any[] = [];
  @Output() usersChanged = new EventEmitter<any[]>();

  gridConfig: GridConfig = {} as GridConfig;

  manualUserData: any[] = [];
  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  documentTypes: any[] = [];
  users: any[] = [
    {
      id: '1',
      text: 'Territory Sales Manager(TSM)',
    },
    { id: '2', text: 'District Sales Manager(DSM)' },
    { id: '3', text: 'Regional Sales Manager(RSM)' },
  ];

  totalManullayManageEmployees = 0;
  loading = false;
  loginEmpId: string = '';

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  pinnedTopRowDataPlanning: AccessLevelColumns[] = [
    {
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      userId: null,
      isNewRow: true,
    },
  ];

  constructor(
    private _userService: UserService,
    private _documentTypeService: DocumentTypeCacheService,
    private modal: NzModalService,
    private _notification: NotificationService,
    private _cabinetHirarchyService: CabinetHierarchyService,
    private cabinetGridService: CabinetGridService,
    private _UtilitiesService: UtilitiesService,
  ) {}

  ngOnInit() {
    if (this.selectedUsers) {
      this.users = [...this.selectedUsers];
    }

    this._cabinetHirarchyService.loadDropdownHierarchy().subscribe((levels) => {
      this.cabinetHierarchy = levels;

      this.cabinetGridService.loadDropdownData(levels).subscribe(() => this.buildGrid());
    });

    // this._cabinetHirarchyService.loadDropdownHierarchy(); // 🔥 REQUIRED
    this.getAllDocumentTypes();
    // this.getAllDivisionList();
    // this.getAllDepartmentList();
    // this.getAllSubDepartmentList();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedUsers']) {
      this.users = [...this.selectedUsers];
    }
  }

  GetLoginEmpId() {
    this.loginEmpId = this._UtilitiesService.GetEmpid() || '';
  }

  private getRemainingColumns(): GridColumn[] {
    return [
      {
        field: 'userId',
        headerName: 'User',
        type: 'dropdown',
        dropdownOptions: this.users,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
        clickable: true,
        clickAction: '', // optional but VERY powerful
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
      enableInlineEdit: false,
      enableInlineDelete: true,
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

  // private buildGrid(): void {
  //   this.gridConfig = {
  //     columns: this.getColumns(),
  //     enablePagination: true,
  //     pageSize: 10,
  //     pageSizeOptions: [10, 20, 50, 100],
  //     enableSorting: true,
  //     enableFiltering: true,
  //     enableSelection: true,
  //     enableInlineAdd: true,
  //     enableInlineEdit: true,
  //     enableInlineDelete: true,
  //     rowHeight: 47,
  //     headerHeight: 40,
  //     domLayout: 'autoHeight',
  //     theme: 'ag-theme-alpine',
  //     suppressCellFocus: true,
  //   };
  // }

  // private getColumns(): GridColumn[] {
  //   return [
  //     // ✅ DIVISION
  //     {
  //       field: 'divisionName',
  //       headerName: 'Division',
  //       type: 'dropdown',
  //       dropdownOptions: this.divisions,
  //       dropdownValueField: 'id',
  //       dropdownDisplayField: 'text',
  //       minWidth: 180,
  //       required: true,
  //     },

  //     // ✅ DEPARTMENT
  //     {
  //       field: 'departmentName',
  //       headerName: 'Department',
  //       type: 'dropdown',
  //       dependsOn: 'divisionName',
  //       dataSourceKey: 'departments',
  //       filterKey: 'divisionId',
  //       dropdownValueField: 'id',
  //       dropdownDisplayField: 'text',
  //       minWidth: 180,
  //       required: true,
  //     },
  //     // ✅ SUB DEPARTMENT
  //     {
  //       field: 'subDepartmentName',
  //       headerName: 'Sub Department',
  //       type: 'dropdown',
  //       dependsOn: 'departmentName',
  //       dataSourceKey: 'subDepartments',
  //       filterKey: 'departmentId',
  //       dropdownValueField: 'id',
  //       dropdownDisplayField: 'text',
  //       minWidth: 180,
  //       required: true,
  //     },
  //     // DOCUMENT TYPES
  //     {
  //       field: 'userId',
  //       headerName: 'User',
  //       type: 'dropdown',
  //       dropdownOptions: this.users,
  //       dropdownValueField: 'id',
  //       dropdownDisplayField: 'text',
  //       minWidth: 180,
  //       required: true,
  //     },
  //   ];
  // }

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
        pageSize,
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
            DateOfJoining: new CustomDateFormatPipe().transform(
              item.dateOfJoining || item.DateOfJoining || '',
            ),
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            Description: item.description || item.Description,
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

  handleGridAction(event: { action: string; rowData: any }) {
    if (event.action === 'userId') {
      this.openCabinetModal(event.rowData);
    }
  }

  openCabinetModal(rowData: any): void {
    const modalRef = this.modal.create({
      nzTitle: 'Rivision History',
      nzContent: RivisionHistoryPopup,
      nzData: {
        data: rowData.Id, // 👈 this is what we’ll read inside modal
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });
    modalRef.afterClose.subscribe((result) => {
      //console.log('Modal closed with:', result);
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
    debugger;
    // Add logic to generate IDs, validate, etc.
    const payLoad = { 
      divisionCode: rowData.level1Id || rowData.level1Id,
      departmentCode: rowData.level2Id || rowData.level2Id,
      subDepartmentCode: rowData.level3Id || rowData.level3Id,
      businessDomainCode: rowData.level4Id || rowData.level4Id, 
    };

    this._userService.create(payLoad).subscribe(() => {
      this._notification.createNotification('success', 'User', 'User created successfully!');
    });
    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      divisionName: this.getDisplayName(this.divisions, rowData.divisionName),
      departmentName: this.getDisplayName(this.departments, rowData.departmentName),
      subDepartmentName: this.getDisplayName(this.subDepartments, rowData.subDepartmentName),
      userId: this.getDisplayName(this.users, rowData.userId),
    };

    this.manualUserData = [rowWithId, ...this.manualUserData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    console.log('Row updated:', event);
    debugger;
    const payLoad = {
      divisionCode: event.rowData.level1Id || event.rowData.level1Id,
      departmentCode: event.rowData.level2Id || event.rowData.level2Id,
      subDepartmentCode: event.rowData.level3Id || event.rowData.level3Id,
      businessDomainCode: event.rowData.level4Id || event.rowData.level4Id,
    };

    this._userService.update(payLoad).subscribe(() => {
      this._notification.createNotification('success', 'User', 'User created successfully!');

      // Update display names
      event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
      event.rowData.departmentName = this.getDisplayName(
        this.departments,
        event.rowData.departmentId,
      );
      // event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

      this.manualUserData[event.index] = { ...event.rowData };
      this.manualUserData = [...this.manualUserData]; // Trigger change detection
    });
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
  userId: string | null = null;
  isNewRow: boolean = false;
}
