import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { NotificationService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { BusinessDomainService } from '@app/shared/services/businessDomain.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { SubDepartmentService } from '@app/shared/services/subdepartment.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-business-domain-component',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './business-domain-component.html',
  styleUrl: './business-domain-component.css',
})
export class BusinessDomainComponent {
  gridConfig: GridConfig = {} as GridConfig;

  selectedPageSize = 10;
  pageSize = 10;
  businessDomainData: any[] = [];
  totalBusinessDomains = 0;
  subdepartments: any[] = [];

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'cabinetstructure';

  pinnedTopRowDataPlanning: BusinessDomainColumns[] = [
    {
      Code: '',
      Name: '',
      subdepartmentId: '',
      subdepartmentName: '',
      LastModifiedBy: '',
      LastModifiedAt: '',
    },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private _businessDomainService: BusinessDomainService,
    private _masterCacheService: Mastercacheservice,
    private _subDepartmentServices: SubDepartmentService,
    private _notification: NotificationService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.getAllDepartmeList();
    });    
  }

  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: 10,
      enableInlineAdd: this.canAdd,
      enableInlineEdit: this.canEdit,
      enableInlineDelete: this.canDelete,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };

    this.getAllBusinessDomains({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'Code',
        headerName: 'Sub Code',
        type: 'readonly',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'Name',
        headerName: 'Name',
        type: 'text',
        required: true,
        minWidth: 200,
      },
      // ✅ SubDepartment
      {
        field: 'SubDepartment',
        headerName: 'Sub-Department',
        type: 'dropdown',
        dropdownOptions: this.subdepartments,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },
      {
        field: 'LastModifiedBy',
        headerName: 'Last Saved By',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
      {
        field: 'LastModifiedAt',
        headerName: 'Last Saved On',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
    ];
  }

  getAllBusinessDomains = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.BUSINESS_DOMAIN,
        getCount$: () => this._businessDomainService.getBusinessDomainCount(),

        // ✅ RETURN RAW API RESPONSE
        getData$: () =>
          this._businessDomainService.GetAllBusinessDomains('', 'ASC', 'Name', true, 1, 1000),

        // The cache service uses this mapFn to unwrap the items from the response
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          SubDepartment: item.SubDepartment || item.subDepartment || '',
          SubDepartmentCode: item.SubDepartmentCode || item.subDepartmentCode || '',
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedAt: new CustomDateFormatPipe().transform(
            item.lastModifiedAt || item.LastModifiedAt || '',
          ),
        }),
      })
      .subscribe((data) => {
        // 'data' here is now the mapped array from mapFn
        this.businessDomainData = data;
        this.totalBusinessDomains = data ? data.length : 0;
      });
  };

  loadBusinessDomains(): void {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.BUSINESS_DOMAIN,
        getCount$: () => this._businessDomainService.getBusinessDomainCount(),
        getData$: () =>
          this._businessDomainService.GetAllBusinessDomains('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
          SubDepartment: item.SubDepartment || item.SubDepartment || '',
          SubDepartmentCode: item.SubDepartmentCode || item.SubDepartmentCode || '',
          CreatedBy: item.createdBy || item.CreatedBy || '',
          CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          LastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || '',
          LastModifiedAt: new CustomDateFormatPipe().transform(
            item.lastModifiedAt || item.LastModifiedAt || '',
          ),
        }),
      })
      .subscribe((data) => {
        this.businessDomainData = data;
        this.totalBusinessDomains = data.length;
      });
  }

  getAllDepartmeList = () => {
    this._subDepartmentServices.getSubDepartmentList().subscribe((res) => {
      if (res?.Data) {
        this.subdepartments = (res.Data ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Value,
        }));
      } else {
        this.subdepartments = [];
      }
      //this.cdr.detectChanges(); // force update

      // ✅ build grid ONLY after Departmes are ready
      this.buildGrid();
    });
  };

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    this.getAllBusinessDomains({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  /* ================= Inline Events ================= */

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event; 
    const payLoad = {
      Code: rowData.Code,
      Name: rowData.Name,
      SubDepartmentCode: rowData.SubDepartment,
      IsActive: true,
      IsDeleted: false,
    };

    this._businessDomainService.create(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.BUSINESS_DOMAIN);
        this._notification.createNotification(
          'success',
          'Business Domain',
          'Business Domain updated successfully!',
        );
        this.loadBusinessDomains();
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
    //console.log('✏️ Row Updated:', event.rowData);

    const payLoad = {
      Code: event.rowData.Code,
      Name: event.rowData.Name,
      DepartmentCode: event.rowData.SubDepartment,
      IsActive: true,
      // IsDeleted: false,
    };

    this._businessDomainService.update(payLoad).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.BUSINESS_DOMAIN);
        this._notification.createNotification(
          'success',
          'Business Domain',
          'Business Domain updated successfully!',
        );
        this.loadBusinessDomains();
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

  onRowDeleted(index: number): void {
    const row = this.businessDomainData[index];

    //console.log('🗑️ Row Deleted:', row);

    this._businessDomainService.delete(row.Code).subscribe({
      next: () => {
        this._masterCacheService.clear(MASTER_CACHE_KEYS.BUSINESS_DOMAIN);
        this._notification.createNotification(
          'success',
          'Business Domain',
          'Business Domain deleted successfully!',
        );
        this.loadBusinessDomains();
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

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', event);
  }

  onSelectionChanged(selectedRows: any[]): void {
    //console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }
}

class BusinessDomainColumns {
  Code: string = '';
  Name: string = '';
  subdepartmentId: string = '';
  subdepartmentName: string = '';
  LastModifiedBy: string = '';
  LastModifiedAt: string = '';
}
