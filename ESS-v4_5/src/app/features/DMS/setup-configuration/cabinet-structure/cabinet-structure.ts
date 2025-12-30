import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { CabinetStructureTabsConfig } from '@app/shared/interfaces/interfaces';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { BusinessDomainService } from '@app/shared/services/businessDomain.service';
import { CabinetStructureTabsConfigService } from '@app/shared/services/CabinetStructureTabsConfig.service';
import { DepartmentService } from '@app/shared/services/department.service';
import { DivisionService } from '@app/shared/services/division.services';
import { DocumentTypeService } from '@app/shared/services/documentType.service';
import { SubDepartmentService } from '@app/shared/services/subdepartment.service';
import { ColDef } from 'ag-grid-community';

interface TabConfig {
  id: number;
  title: string;
  CreatedBy: string;
  CreatedAt: string;
  LastModifiedAt: string;
  LastModifiedBy: string;
}

@Component({
  selector: 'app-cabinet-structure',
  imports: [CommonModule, FormsModule, AgGridWrapper, SafeTranslatePipe, CustomDateFormatPipe],
  templateUrl: './cabinet-structure.html',
  styleUrl: './cabinet-structure.css',
})
export class CabinetStructure {
  private tabDataCache = new Set<number>();

  level1Title: string = 'Level 1';
  level2Title: string = 'Level 2';
  level3Title: string = 'Level 3';
  level4Title: string = 'Level 4';
  level5Title: string = 'Document Type';
  selectedTab: any = null;
 
  selectedPageSize = 1; // default value

  totalDivisions = 0;
  totalDepartments = 0;
  totalSubDepartments = 0;
  totalDocumentTypes = 0;
  totalBusinessDomains = 0;
  pageSize = 1;
  divisionData: any[] = [];
  departmentData: any[] = [];
  subDepartmentData: any[] = [];
  businessDomainData: any[] = [];
  documentTypeData: any[] = [];

  tabs: TabConfig[] = [];
  selectedTabId!: number;
  selectedTabTitle = ''; // for textbox editing

  constructor(
    private cdr: ChangeDetectorRef,
    private _divisionServices: DivisionService,
    private _departmentServices: DepartmentService,
    private _subDepartmentService: SubDepartmentService,
    private _documentTypeService: DocumentTypeService,
    private _businessDomainService: BusinessDomainService,
    private _cabietTabConfigService: CabinetStructureTabsConfigService
  ) {}

  ngOnInit() {
    this.loadTabs();
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  divisionColumnDefs = [
    {
      field: 'Code',
      headerName: 'Division Code',
      flex: 1,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 50,
      },
      valueSetter: (params: any) => {
        if (!params.newValue || !params.newValue.trim()) {
          return false; // ❌ block empty
        }
        if (params.newValue.length > 50) {
          return false; // ❌ block too long
        }
        params.data.Name = params.newValue.trim();
        return true;
      },
      cellClassRules: {
        'cell-invalid': (params: any) => !params.value,
      },
    },
    { field: 'Name', headerName: 'Name', flex: 1, editable: true },
    { field: 'CreatedBy', headerName: 'Last Saved By', flex: 1 },
    {
      field: 'CreatedAt',
      headerName: 'Last Saved On',
      flex: 1,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        // Parse string to Date and format as desired
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return params.value; // fallback to raw string
        return date.toLocaleString(); // or format however you want
      },
    },
  ];

  departmentColumnDefs = [
    { field: 'Code', headerName: 'Division Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Name', flex: 1, editable: true },
    { field: 'Division', headerName: 'Division', flex: 1, editable: true },
    { field: 'CreatedBy', headerName: 'Last Saved By', flex: 1 },
    {
      field: 'CreatedAt',
      headerName: 'Last Saved On',
      flex: 1,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        // Parse string to Date and format as desired
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return params.value; // fallback to raw string
        return date.toLocaleString(); // or format however you want
      },
    },
  ];

  subDepartmentColumnDefs = [
    { field: 'Code', headerName: 'Sub-Department Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Sub-Department', flex: 1, editable: true },
    { field: 'Department', headerName: 'Department', flex: 1, editable: true },
    {
      field: 'CreatedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',

      flex: 1,
    },
    {
      field: 'CreatedAt',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',

      flex: 1,
      // valueFormatter: (params: ValueFormatterParams<any, Date>) => {
      //   if (!params.value) {
      //     return '';
      //   }
      //   const month = params.value.getMonth() + 1;
      //   const day = params.value.getDate();
      //   return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${
      //     day < 10 ? '0' + day : day
      //   }`;
      // },
      // cellEditorParams: {
      //   max: new Date('2008-12-31'),
      // },
    },
  ];

  businessdomainColumnDefs = [
    { field: 'Code', headerName: 'Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Business Domain', flex: 1, editable: true },
    {
      field: 'SubDepartment',
      headerName: 'Sub-Department',
      flex: 1,
      editable: true,
      // cellEditorParams: {
      //   values: ['Porsche', 'Toyota', 'Ford', 'AAA', 'BBB', 'CCC'],
      // },
    },

    {
      field: 'CreatedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',
      flex: 1,
    },
    {
      field: 'CreatedAt',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',
      flex: 1,
      // valueFormatter: (params: ValueFormatterParams<any, Date>) => {
      //   if (!params.value) {
      //     return '';
      //   }
      //   const month = params.value.getMonth() + 1;
      //   const day = params.value.getDate();
      //   return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${
      //     day < 10 ? '0' + day : day
      //   }`;
      // },
      // cellEditorParams: {
      //   max: new Date('2008-12-31'),
      // },
    },
  ];

  documentTypeColumnDefs = [
    { field: 'Code', headerName: 'Document Code', flex: 1, editable: true },
    { field: 'Name', headerName: 'Document Type', flex: 1, editable: true },
    { field: 'Description', headerName: 'Description', flex: 1, editable: true },
    {
      field: 'CreatedBy',
      headerName: 'Last Saved By',
      cellEditor: 'agDateCellEditor',

      flex: 1,
    },
    {
      field: 'CreatedAt',
      headerName: 'Last Saved On',
      cellEditor: 'agDateCellEditor',

      flex: 1,
      // valueFormatter: (params: ValueFormatterParams<any, Date>) => {
      //   if (!params.value) {
      //     return '';
      //   }
      //   const month = params.value.getMonth() + 1;
      //   const day = params.value.getDate();
      //   return `${params.value.getFullYear()}-${month < 10 ? '0' + month : month}-${
      //     day < 10 ? '0' + day : day
      //   }`;
      // },
      // cellEditorParams: {
      //   max: new Date('2008-12-31'),
      // },
    },
  ];

  UploadedDocColumnDefs = [
    { field: 'documentId', headerName: 'Document ID' },
    { field: 'documentName', headerName: 'Document Name' },
    { field: 'version', headerName: 'Version Number' },
    { field: 'documentType', headerName: 'Document Type' },
    { field: 'division', headerName: 'Division' },
    { field: 'department', headerName: 'Department' },
    { field: 'subDepartment', headerName: 'Sub-Department' },
    { field: 'nextReviewDate', headerName: 'Next Review Date' },
  ];

  loadTabs(): void {
    this._cabietTabConfigService
      .GetAllCabietStructureTabs('', 'ASC', 'Id', true, 1, 10)
      .subscribe((res) => {
        if (res?.Data) {
          this.tabs = (res.Data.Items ?? []).map((d: any) => ({
            id: Number(d.Id), // 🔥 FIX
            title: d.Name,
            CreatedBy: d.CreatedBy,
            CreatedAt: d.CreatedAt,
            LastModifiedBy: d.LastModifiedBy,
            LastModifiedAt: d.LastModifiedAt,
          }));
          //console.log('Mapped tabs:', this.tabs);
        } else {
          this.tabs = [];
        }

        // select first tab by default
        if (this.tabs.length > 0) {
          this.onTabChange(this.tabs[0]);
        }
      });
  }

  onTabChange(tab: TabConfig): void {
    this.selectedTab = tab;
    this.selectedTabId = tab.id;
    this.selectedTabTitle = tab.title;

    this.loadDataByTab(tab.id);
  }

  loadDataByTab(tabId: number): void {
    if (this.tabDataCache.has(tabId)) return;

    const apiMap: Record<number, () => void> = {
      1: () =>
        this.getAllDivisions({
          pageNumber: 1,
          pageSize: this.pageSize,
          sortModel: [],
          filterModel: {},
        }),
      2: () =>
        this.getAllDepartments({
          pageNumber: 1,
          pageSize: this.pageSize,
          sortModel: [],
          filterModel: {},
        }),
      3: () =>
        this.getAllSubDepartments({
          pageNumber: 1,
          pageSize: this.pageSize,
          sortModel: [],
          filterModel: {},
        }),
      4: () =>
        this.getAllBusinessDomains({
          pageNumber: 1,
          pageSize: this.pageSize,
          sortModel: [],
          filterModel: {},
        }),
      5: () =>
        this.getAllDocumentTypes({
          pageNumber: 1,
          pageSize: this.pageSize,
          sortModel: [],
          filterModel: {},
        }),
    };

    apiMap[tabId]?.();
    this.tabDataCache.add(tabId);
  }

  getAllDivisions = (query: any) => {
    const sort = query.sortModel?.[0];

    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._divisionServices
      .GetAllDivisions(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalDivisions = res.Data.TotalCount;
          this.divisionData = res.Data.Items.map((item: any) => ({
            Code: item.code || item.Code,
            Name: item.name || item.Name,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: item.createdAt || item.CreatedAt || '',
          }));
          //console.log('Mapped divisionData:', this.divisionData);
        } else {
          this.divisionData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  };

  getAllDepartments = (query: any) => {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._departmentServices
      .GetAllDepartments(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalDepartments = res.Data.TotalCount;
          this.departmentData = res.Data.Items.map((item: any) => ({
            Code: item.code || item.Code,
            Name: item.name || item.Name,
            DivisionCode: item.divisionCode || item.DivisionCode,
            Division: item.division || item.Division,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: item.createdAt || item.CreatedAt || '',
          }));
          //console.log('Mapped departmentData:', this.departmentData);
        } else {
          this.departmentData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  };

  getAllSubDepartments = (query: any) => {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._subDepartmentService
      .GetAllSubDepartments(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalSubDepartments = res.Data.TotalCount;
          this.subDepartmentData = res.Data.Items.map((item: any) => ({
            Code: item.code || item.Code,
            Name: item.name || item.Name,
            Department: item.department || item.Department,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: item.createdAt || item.CreatedAt || '',
          }));
          //console.log('Mapped subDepartmentData:', this.subDepartmentData);
        } else {
          this.subDepartmentData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  };

  getAllDocumentTypes = (query: any) => {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._documentTypeService
      .GetAllDocumentTypes(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalDocumentTypes = res.Data.TotalCount;
          this.documentTypeData = res.Data.Items.map((item: any) => ({
            Code: item.code || item.Code,
            Name: item.name || item.Name,
            Description: item.description || item.Description,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: item.createdAt || item.CreatedAt || '',
          }));
          //console.log('Mapped documentTypeData:', this.documentTypeData);
        } else {
          this.documentTypeData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  };

  getAllBusinessDomains = (query: any) => {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._businessDomainService
      .GetAllBusinessDomains(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.totalBusinessDomains = res.Data.TotalCount;
          this.businessDomainData = res.Data.Items.map((item: any) => ({
            Code: item.code || item.Code,
            Name: item.name || item.Name,
            SubDepartment: item.SubDepartment || item.SubDepartment,
            SubDepartmentCode: item.subDepartmentCode || item.SubDepartmentCode,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: item.createdAt || item.CreatedAt || '',
          }));
          //console.log('Mapped BusinessDomain:', this.businessDomainData);
        } else {
          this.businessDomainData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  };

  saveSubDepartment(event: any): void {
    // 🔒 Business validation
    if (!event.newValue || event.newValue.trim().length < 3) {
      this.revertCell(event, 'Minimum 3 characters required');
      return;
    }

    // if (this.isDuplicateName(event.data.Code, event.newValue)) {
    //   this.revertCell(event, 'Name already exists');
    //   return;
    // }

    const payload = {
      code: event.data.Code,
      name: event.newValue,
    };

    // this._subDepartmentService.updateSubDepartment(payload).subscribe({
    //   next: () => {
    //     console.log('Saved successfully');
    //   },
    //   error: () => {
    //     this.revertCell(event, 'Save failed');
    //   },
    // });
  }

  saveTabTitle(): void {
    const payload: CabinetStructureTabsConfig = {
      Id: this.selectedTabId,
      Name: this.selectedTabTitle,
      CreatedAt: null,
      CreatedBy: null,
      LastModifiedAt: null,
      LastModifiedBy: null,
    };

    this._cabietTabConfigService.update(payload).subscribe({
      next: (updated:any) => {
        // Update tabs array
        this.tabs = this.tabs.map((tab) =>
          tab.id === updated.Data.Id
            ? {
                ...tab,
                title: updated.Data.Name,
                lastModifiedBy: updated.Data.LastModifiedBy,
                lastModifiedAt: updated.Data.LastModifiedAt,
              }
            : tab
        );
  
        // Update selected tab reference too (for UI refresh)
        if (this.selectedTab.id === updated.Data.Id) {
          this.selectedTab = {
            ...this.selectedTab,
            title: updated.Name,
            lastModifiedBy: updated.LastModifiedBy,
            lastModifiedAt: updated.LastModifiedAt,
          };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  trackByTabId(index: number, tab: any) {
    return tab.id;
  }
  revertCell(event: any, message: string) {
    alert(message); // replace with toast
    event.data[event.field] = event.oldValue;
    this.subDepartmentData = [...this.subDepartmentData];
  }

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'divisionGrid':
        this.divisionPageSize = pageSize;
        this.getAllDivisions({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;

      case 'departmentGrid':
        this.employeePageSize = pageSize;
        this.getAllDepartments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'subDepartmentGrid':
        this.employeePageSize = pageSize;
        this.getAllSubDepartments({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'businessDomainGrid':
        this.employeePageSize = pageSize;
        this.getAllBusinessDomains({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      case 'documentTypeGrid':
        this.employeePageSize = pageSize;
        this.getAllDocumentTypes({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      // handle other grids...

      default:
        break;
    }
  }
}
