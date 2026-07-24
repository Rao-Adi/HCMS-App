import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
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
import { DocumentTypeCacheService } from '@app/shared/services/CacheServices/document-type-cache-service';
import { PermissionService } from '@app/shared/services/permission.service';
import { WorkflowPolicyService } from '@app/shared/services/workflow-policy-service';
import { ColDef } from 'ag-grid-community';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-manage-workflow-policy-modal',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper],
  templateUrl: './manage-workflow-policy-modal.html',
  styleUrl: './manage-workflow-policy-modal.css',
})
export class ManageWorkflowPolicyModal {
  gridConfig: GridConfig = {} as GridConfig;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'users';

  workflowPoliciesData: any[] = [];
  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  documentTypes: any[] = [];
  totalManullayManageEmployees = 0;
  loading = false;

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    comparator: () => 0, // Disables local sorting so padded objects aren't shuffled
    filterParams: {
      textMatcher: () => true, // Disables local filtering to keep padded objects intact
    },
  };

  totalRows = 0;
  pageSize = 10;
  gridApi: any;

  workflowAuthoritiesColumnDefs = [
    { field: 'documentId', headerName: 'Document ID', flex: 1 },
    { field: 'documentName', headerName: 'Document Name', flex: 1 },
    { field: 'version', headerName: 'Version Number', flex: 1 },
    { field: 'documentTypeId', headerName: 'Document Type', flex: 1 },
    { field: 'divisionName', headerName: 'Division', flex: 1 },
    { field: 'departmentName', headerName: 'Department', flex: 1 },
    { field: 'subDepartmentName', headerName: 'Sub-Department', flex: 1 },
    { field: 'businessDomainName', headerName: 'Business Domain', flex: 1 },
    { field: 'nextReviewDate', headerName: 'Next Review Date', flex: 1 },
  ];

  pinnedTopRowDataPlanning: AccessLevelColumns[] = [
    {
      policyName: '',
      level1Id: null,
      level2Id: null,
      level3Id: null,
      level4Id: null,
      documentTypeId: null,
      isNewRow: true,
    },
  ];

  private getColumns(): GridColumn[] {
    return [
      ...this.getFixedColumns(),
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
        required: false,
      },
    ];
  }

  private getFixedColumns(): GridColumn[] {
    return [
      {
        field: 'policyName',
        headerName: 'Policy Name',
        type: 'text',
        minWidth: 250,
        pinned: 'left',
        required: true,
      },
    ];
  }

  constructor(
    @Inject(NZ_MODAL_DATA) public modalData: any,
    private _documentTypeService: DocumentTypeCacheService,
    private _notificationToastService: NotificationToastService,
    private cabinetGridService: CabinetGridService,
    private readonly hierarchyService: CabinetHierarchyService,
    private _permissionService: PermissionService,
    private _workflowPolicyService: WorkflowPolicyService,
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

      this.GetAllWorkflowPolicies({
        pageNumber: 1,
        pageSize: this.pageSize,
        sortModel: [], // or your current sort/filter model
        filterModel: {},
      });
    });
  }

  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: this.pageSize,
      pageSizeOptions: [10, 20, 50, 100],
      enableSorting: true,
      enableFiltering: true,
      enableSelection: true,
      enableInlineAdd: this.canAdd,
      enableInlineEdit: this.canEdit,
      enableInlineDelete: this.canDelete,
      serverSide: true,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };
  }

  GetAllWorkflowPolicies(query: any = {}) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.pageSize;

    const searchText = query?.searchText || query?.filterModel?.policyName?.filter || '';

    // Map frontend column IDs to backend properties
    let sortColumn = sort?.colId || 'Id';
    const sortMapping: Record<string, string> = {
      policyName: 'Name',
      documentTypeId: 'DocumentType',
      documentTypeName: 'DocumentType',
      level1Id: 'Division',
      divisionName: 'Division',
      level2Id: 'Department',
      departmentName: 'Department',
      level3Id: 'SubDepartment',
      subDepartmentName: 'SubDepartment',
      level4Id: 'BusinessDomain',
      businessDomainName: 'BusinessDomain',
    };
    if (sortMapping[sortColumn]) {
      sortColumn = sortMapping[sortColumn];
    }

    this._workflowPolicyService
      .GetAllWorkflowPolicies(
        searchText,
        sort?.sort?.toUpperCase() || 'DESC',
        sortColumn,
        true,
        pageNumber,
        pageSize,
        this.modalData?.entityType,
      )
      .subscribe((res) => {
        const data = res?.Data;
        const items = data?.Items || (Array.isArray(data) ? data : []);
        this.totalRows = data?.TotalCount ?? items.length;

        if (Array.isArray(items)) {
          this.workflowPoliciesData = items.map((item: any) => ({
            Id: item.Id,
            policyName: item.Name,
            documentTypeId: item.DocumentTypeCode,
            documentTypeName: item.DocumentType,
            level1Id: item.DivisionCode,
            divisionName: item.Division,
            level2Id: item.DepartmentCode,
            departmentName: item.Department,
            level3Id: item.SubDepartmentCode,
            subDepartmentName: item.SubDepartment,
            level4Id: item.BusinessDomainCode,
            businessDomainName: item.BusinessDomain,
            IsActive: item.IsActive,
            IsDeleted: item.IsDeleted,
            CreatedAt: new CustomDateFormatPipe().transform(item.CreatedAt || ''),
            CreatedBy: item.CreatedBy,
            LastModifiedAt: new CustomDateFormatPipe().transform(item.LastModifiedAt || ''),
            LastModifiedBy: item.LastModifiedBy,
          }));

          // Array padding trick: Creates a fake footprint for un-fetched server records
          // const newRowData = new Array(this.totalRows).fill(null).map(() => ({}));
          // newRowData.splice((pageNumber - 1) * pageSize, mappedItems.length, ...mappedItems);

          // this.workflowPoliciesData = newRowData;

          // Jump grid to the exact required page so the newly padded data shows up
          setTimeout(() => {
            if (this.gridApi) {
              this.gridApi.paginationGoToPage(pageNumber - 1);
            }
          }, 0);
        } else {
          this.workflowPoliciesData = [];
          this.totalRows = 0;
        }
      });
  }

  onDataRequest(query: any) {
    this.GetAllWorkflowPolicies(query);
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;
    this.pageSize = pageSize;

    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(pageSize);
    }
  }

  onSelectionChanged(selectedRows: any[]): void {
    //console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }

  onGridReady(gridApi: any): void {
    this.gridApi = gridApi;
  }

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event;

    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      name: rowData.policyName,
      WorkflowPolicyName: rowData.policyName,
      DocumentTypeCode: rowData.documentTypeId,
      DivisionCode: rowData.level1Id,
      DepartmentCode: rowData.level2Id,
      SubDepartmentCode: rowData.level3Id,
      BusinessDomainCode: rowData.level4Id,
      EntityType: this.modalData?.entityType,
      IsActive: true,
    };

    this._workflowPolicyService.create(payLoad).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Workflow Policy',
        'Workflow Policy created successfully!',
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

    this.workflowPoliciesData = [rowWithId, ...this.workflowPoliciesData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    const { rowData, index } = event;

    const payLoad = {
      Id: rowData.Id || rowData.id,
      name: rowData.policyName,
      WorkflowPolicyName: rowData.policyName,
      DocumentTypeCode: rowData.documentTypeId,
      DivisionCode: rowData.level1Id,
      DepartmentCode: rowData.level2Id,
      SubDepartmentCode: rowData.level3Id,
      BusinessDomainCode: rowData.level4Id,
      EntityType: this.modalData?.entityType,
      IsActive: true,
    };

    this._workflowPolicyService.update(payLoad).subscribe({
      next: () => {
        this._notificationToastService.createNotification(
          'success',
          'Workflow Policy',
          'Workflow Policy updated successfully!'
        );

        // Update display names
        rowData.divisionName = this.getDisplayName(this.divisions, rowData.level1Id);
        rowData.departmentName = this.getDisplayName(this.departments, rowData.level2Id);
        rowData.subDepartmentName = this.getDisplayName(this.subDepartments, rowData.level3Id);
        rowData.businessDomainName = this.getDisplayName(this.subDepartments, rowData.level4Id);
        rowData.documentTypeName = this.getDisplayName(this.documentTypes, rowData.documentTypeId);

        this.workflowPoliciesData[index] = { ...rowData };
        this.workflowPoliciesData = [...this.workflowPoliciesData]; // Trigger change detection
      },
      error: (err: any) => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to update workflow policy.'
        );
      }
    });
  }

  onRowDeleted(rowIndex: number): void {
    const rowData = this.workflowPoliciesData[rowIndex];
    if (!rowData) return;
    
    const policyId = rowData.Id || rowData.id;
    this._workflowPolicyService.delete(policyId).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Workflow Policy',
        'Workflow Policy deleted successfully!',
      );
      this.workflowPoliciesData.splice(rowIndex, 1);
      this.workflowPoliciesData = [...this.workflowPoliciesData];
    });
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', JSON.stringify(event));

    // Handle calculations if needed
    if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
      const currentSalary = event.rowData.currentSalary || 0;
      const incrementPercentage = event.rowData.incrementPercentage || 0;
      event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

      // Update the row
      this.workflowPoliciesData[event.rowIndex] = { ...event.rowData };
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
  policyName: string = '';
  level1Id: string | null = null;
  level2Id: string | null = null;
  level3Id: string | null = null;
  level4Id: string | null = null;
  documentTypeId: string | null = null;
  isNewRow: boolean = false;
}
