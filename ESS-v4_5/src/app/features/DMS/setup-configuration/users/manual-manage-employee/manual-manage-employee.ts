import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '@app/shared/services/user-service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { DepartmentCacheService } from '@app/shared/services/CacheServices/department-cache-service';
import { SubDepartmentCacheService } from '@app/shared/services/CacheServices/sub-department-cache-service';
import { AccessLevelModalDialog } from '../../access-level-modal-dialog/access-level-modal-dialog';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';
import { DivisionCacheService } from '@app/shared/services/CacheServices/division-cache-service';
import { BusinessDomainCacheService } from '@app/shared/services/CacheServices/business-domain-cache-service';
import { DesignationService } from '@app/shared/services/designation.service';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { PermissionService } from '@app/shared/services/permission.service';

@Component({
  selector: 'app-manual-manage-employee',
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzSwitchModule,
    EditableAgGridWrapper,
    NzModalModule,
  ],
  templateUrl: './manual-manage-employee.html',
  styleUrl: './manual-manage-employee.css',
})
export class ManualManageEmployee {
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
  designations: any[] = [];
  totalManullayManageEmployees = 0;
  loading = false;

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  selectedPageSize = 10; // default value

  pinnedTopRowDataPlanning: UsersColumns[] = [
    {
      employeeCode: '',
      employeeName: '',
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      designationId: null,
      email: '',
      reportingTo: null,
      grade: '',
      dateOfJoining: null,
      isNewRow: true,
    },
  ];

  constructor(
    private _userService: UserService,
    private modal: NzModalService,
    private _divisionServices: DivisionCacheService,
    private _departmentCacheService: DepartmentCacheService,
    private _subDepartmentServices: SubDepartmentCacheService,
    private _businessDomainCacheService: BusinessDomainCacheService,
    private _notificationToastService: NotificationToastService,
    private _designationServices: DesignationService,
    private _cabinetHirarchyService: CabinetHierarchyService,
    private cabinetGridService: CabinetGridService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.loadDropdownsAndGrid();
      // this.GetAllManuallyManageEmployee({
      //   pageNumber: 1,
      //   pageSize: this.selectedPageSize,
      //   sortModel: [], // or your current sort/filter model
      //   filterModel: {},
      // });

      this._cabinetHirarchyService.loadDropdownHierarchy().subscribe((levels) => {
        this.cabinetHierarchy = levels;
        this.levelTitles = this._cabinetHirarchyService.getLevelTitles();

        this.loadCabinetDropdownData(levels);
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

  private getColumns(): GridColumn[] {
    return [
      ...this.getFixedColumns(),
      ...this.cabinetGridService.buildCabinetColumns(this.cabinetHierarchy),
      ...this.getRemainingColumns(),
    ];
  }

  private getFixedColumns(): GridColumn[] {
    return [
      {
        field: 'employeeCode',
        headerName: 'Employee Code',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
      {
        field: 'employeeName',
        headerName: 'Employee Name',
        type: 'text',
        minWidth: 250,
        pinned: 'left',
        required: true,
      },
    ];
  }

  private getRemainingColumns(): GridColumn[] {
    return [
      {
        field: 'grade',
        headerName: 'Grade',
        type: 'text',
        required: true,
        minWidth: 200,
        pinned: 'left',
      },
      {
        field: 'designationId',
        headerName: 'Designation',
        type: 'dropdown',
        dropdownOptions: this.designations,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 200,
        required: true,
      },
      {
        field: 'email',
        headerName: 'Email',
        type: 'text',
        minWidth: 200,
        pinned: 'left',
        required: true,
      },
      {
        field: 'reportingTo',
        headerName: 'Reporting To',
        type: 'text',
        required: true,
        minWidth: 200,
        pinned: 'left',
      },

      {
        field: 'dateOfJoining',
        headerName: 'Date Of Joining',
        type: 'date',
        required: true,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'accessLevel',
        headerName: 'Access Level',
        type: 'button',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
    ];
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
        pageSize,
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalManullayManageEmployees = res.Data.TotalCount;
          this.manualUserData = res.Data.Items.map((item: any) => ({
            Id: item.id || item.Id,
            employeeCode: item.employeeCode || item.EmployeeCode,
            employeeName: item.employeeName || item.EmployeeName,
            email: item.email || item.Email,
            divisionCode: item.divisionCode || item.DivisionCode,
            level1Id: item.division || item.Division,
            departmentCode: item.departmentCode || item.DepartmentCode,
            level2Id: item.department || item.Department,
            subDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
            level3Id: item.subDepartment || item.SubDepartment,
            businessDomainCode: item.businessDomainCode || item.BusinessDomainCode,
            level4Id: item.businessDomain || item.BusinessDomain,
            designationId: item.designationCode || item.DesignationCode,
            Designation: item.designation || item.Designation,
            grade: item.grade || item.Grade,
            reportingTo: item.reportingTo || item.ReportingTo,
            dateOfJoining: new CustomDateFormatPipe().transform(
              item.dateOfJoining || item.DateOfJoining || '',
            ),
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

  handleGridAction(event: { action: string; rowData: any }) {
    if (event.action === 'VIEW_CABINET') {
      this.openMandatoryCabinetModal(event.rowData);
    }
  }

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event; 
    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      employeeCode: rowData.EmployeeCode || rowData.employeeCode,
      employeeName: rowData.EmployeeName || rowData.employeeName,
      divisionCode: rowData.level1Id || rowData.level1Id,
      departmentCode: rowData.level2Id || rowData.level2Id,
      subDepartmentCode: rowData.level3Id || rowData.level3Id,
      businessDomainCode: rowData.level4Id || rowData.level4Id,
      designationCode: rowData.DesignationId || rowData.designationId,
      email: rowData.Email || rowData.email,
      reportingTo: rowData.ReportingTo || rowData.reportingTo,
      grade: rowData.Grade || rowData.grade,
      dateOfJoining: rowData.DateOfJoining || rowData.dateOfJoining,
      IsActive: true,
      IsDeleted: false,
    };
    this._userService.create(payLoad).subscribe({
      next: () => {
        this._notificationToastService.createNotification('success', 'User', 'User created successfully!');

        const rowWithId = {
          ...rowData,
          id: this.generateId(),
          employeeCode: rowData.employeeCode,
          employeeName: rowData.employeeName,
          email: rowData.email,
          reportingTo: rowData.reportingTo,
          dateOfJoining: rowData.dateOfJoining,
          // Map dropdown IDs to display names
          divisionName: this.getDisplayName(this.divisions, rowData.divisionName),
          departmentName: this.getDisplayName(this.departments, rowData.departmentName),
          subDepartmentName: this.getDisplayName(this.subDepartments, rowData.subDepartmentName),
        };

        this.manualUserData = [rowWithId, ...this.manualUserData];
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

        this._notificationToastService.createNotification('error', 'Document Attribute', message);
      },
    });
  }

  onRowUpdated(event: { rowData: any }): void {
    const { rowData } = event; 
    // Update display names
    const payLoad = {
      employeeCode: rowData.EmployeeCode || rowData.employeeCode,
      employeeName: rowData.EmployeeName || rowData.employeeName,
      divisionCode: rowData.level1Id || rowData.level1Id,
      departmentCode: rowData.level2Id || rowData.level2Id,
      subDepartmentCode: rowData.level3Id || rowData.level3Id,
      businessDomainCode: rowData.level4Id || rowData.level4Id,
      email: rowData.Email || rowData.email,
      reportingTo: rowData.ReportingTo || rowData.reportingTo,
      dateOfJoining: rowData.DateOfJoining || rowData.dateOfJoining,
      IsActive: true,
      IsDeleted: false,
    };

    this._userService.update(payLoad).subscribe({
      next: () => {
        this._notificationToastService.createNotification('success', 'User', 'User Updated successfully!');
        
        const rowWithId = {
          ...rowData,
          id: this.generateId(),
          employeeCode: rowData.employeeCode,
          employeeName: rowData.employeeName,
          email: rowData.email,
          reportingTo: rowData.reportingTo,
          dateOfJoining: rowData.dateOfJoining,
          // Map dropdown IDs to display names
          divisionName: this.getDisplayName(this.divisions, rowData.level1Id),
          departmentName: this.getDisplayName(this.departments, rowData.level2Id),
          subDepartmentName: this.getDisplayName(this.subDepartments, rowData.level3Id),
          businessDomainName: this.getDisplayName(this.subDepartments, rowData.level4Id),
        };

        this.manualUserData = [rowWithId, ...this.manualUserData];
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

        this._notificationToastService.createNotification('error', 'Document Attribute', message);
      },
    });
  }

  onRowDeleted(rowIndex: number): void {
    // console.log('Row deleted at index:', rowIndex);
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

  getAllDivisionList(): Observable<any[]> {
    return this._divisionServices.getDivisions().pipe(
      map((res) =>
        (res ?? []).map((d) => ({
          id: d.Code,
          text: d.Name,
        })),
      ),
    );
  }

  getAllDepartmentList(): Observable<any[]> {
    return this._departmentCacheService.getDepartments().pipe(
      map((res) =>
        (res ?? []).map((d) => ({
          id: d.Code,
          text: d.Name,
          parentId: d.DivisionCode, // 🔥 REQUIRED
        })),
      ),
    );
  }

  getAllSubDepartmentList(): Observable<any[]> {
    return this._subDepartmentServices.getSubDepartments().pipe(
      map((res) =>
        (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
          parentId: d.DepartmentCode || d.departmentCode,
        })),
      ),
      catchError(() => of([])),
    );
  }

  getAllBusinessDomainList(): Observable<any[]> {
    return this._businessDomainCacheService.getBusinessDomains().pipe(
      map((res) =>
        (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
          parentId: d.SubDepartmentCode || d.subDepartmentCode,
        })),
      ),
      catchError(() => of([])),
    );
  }

  loadCabinetDropdownData(levels: CabinetLevel[]) {
    const loaders: Observable<any>[] = [];

    levels.forEach((l) => {
      switch (l.level) {
        case 1:
          loaders.push(
            this.getAllDivisionList().pipe(tap((data) => (this.dropdownDataSources[1] = data))),
          );
          break;

        case 2:
          loaders.push(
            this.getAllDepartmentList().pipe(tap((data) => (this.dropdownDataSources[2] = data))),
          );
          break;

        case 3:
          loaders.push(
            this.getAllSubDepartmentList().pipe(
              tap((data) => (this.dropdownDataSources[3] = data)),
            ),
          );
          break;
        case 4:
          loaders.push(
            this.getAllBusinessDomainList().pipe(
              tap((data) => (this.dropdownDataSources[4] = data)),
            ),
          );
          break;
      }
    });

    forkJoin(loaders).subscribe(() => {
      this.buildGrid(); // 🔥 NOW it is safe
    });
  }

  private loadDropdownsAndGrid(): void {
    forkJoin({
      designations: this._designationServices.getDesignationList(),
      hierarchy: this._cabinetHirarchyService.loadDropdownHierarchy(),
    }).subscribe(({ designations, hierarchy }) => {
      // ✅ Normalize Designations
      this.designations =
        designations?.Data?.map((d: any) => ({
          id: d.Code,
          text: d.Value,
        })) ?? [];

      // ✅ Cabinet hierarchy
      this.cabinetHierarchy = hierarchy;

      // ✅ Load hierarchy dropdown data
      this.cabinetGridService.loadDropdownData(hierarchy).subscribe(() => this.buildGrid());
    });
  }

  openMandatoryCabinetModal(rowData: any) {
    const modalRef = this.modal.create({
      nzTitle: 'Access Level to ' + (rowData.employeeName || rowData.EmployeeName),
      nzContent: AccessLevelModalDialog,
      nzData: {
        employeeCode: rowData.employeeCode || rowData.EmployeeCode,
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      console.log('Modal closed with:', result);
    });
  }
}

class UsersColumns {
  employeeCode: string = '';
  employeeName: string = '';

  divisionId: string | null = null;
  //division: string | null = null;
  departmentId: string | null = null;
  //department: string | null = null;
  subDepartmentId: string | null = null;
  //subDepartment: string | null = null;
  designationId: string | null = null;
  email: string = '';
  reportingTo: any = null;
  grade: string = '';
  dateOfJoining: string | null = null;
  isNewRow: boolean = false;
}
