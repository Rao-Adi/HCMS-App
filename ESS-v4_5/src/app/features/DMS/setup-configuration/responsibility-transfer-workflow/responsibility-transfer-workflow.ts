import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { BehaviorSubject } from 'rxjs'; 
import { UserService } from '@app/shared/services/user-service';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { NotificationService } from '@app/shared/notification/notification.service';
import { DivisionCacheService } from '@app/shared/services/CacheServices/division-cache-service'; 
import { TransferWorkflowPolicyService } from '@app/shared/services/transfer-workflow-policy.service';
import { UtilitiesService } from '@app/core/services/utilities.service';

@Component({
  selector: 'app-responsibility-transfer-workflow',
  imports: [CommonModule, FormsModule, SafeTranslatePipe, EditableAgGridWrapper],
  templateUrl: './responsibility-transfer-workflow.html',
  styleUrl: './responsibility-transfer-workflow.css',
})
export class ResponsibilityTransferWorkflow {
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'DMS-RTW'; // Example FormId for this page

  public noRowsOverlay: string = '';
  gridConfig: GridConfig = {} as GridConfig;
  manualUserData: any[] = [];

  pinnedTopRowDataPlanning: AccessLevelColumns[] = [
    {
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      documentTypeId: null,
      isNewRow: true,
    },
  ];

  selectedTab: string = 'Request';
  switchValue1 = false;
  switchValue2 = false;
  loading = false;
  showExclusionTable = false;
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser?: string;
  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedDocumentType?: string = '';
  selectedDesignation?: string = '';
  selectedRole?: string = '';
  radioValue = '';
  // single state
  activeMode: 'manual' | 'integration' | null = null;

  pageSize = 10;
  rowData: any[] = [];
  totalRows = 0;
  divisions: any[] = [];
 
  workflowExclude: any[] = [
    { id: '1', text: 'Director Of Board' },
    { id: '2', text: 'Quality Director' },
    { id: '3', text: 'Bizex Manager' },
  ];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  constructor(
    private _userService: UserService,
    private _notification: NotificationService,
    private _utilities: UtilitiesService, // Inject UtilitiesService
    private _divisionServices: DivisionCacheService,
    private _transferWorkflowPolicyService: TransferWorkflowPolicyService
  ) {}

  ngOnInit() {
   this.checkPermissions();
   this.getAllDivisionList();
   this.GetAllResponsibilityTransferWorkflows();
  }

  private checkPermissions(): void {
    this._utilities.CanInsert(this.formId).subscribe(res => this.canAdd = res);
    this._utilities.CanEdit(this.formId).subscribe(res => this.canEdit = res);
    this._utilities.CanDelete(this.formId).subscribe(res => this.canDelete = res);
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
        field: 'approvalAuthority',
        headerName: 'Approval Authority',
        type: 'dropdown', 
        dropdownOptions: this.workflowExclude,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
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
      enableFiltering: false, // Set to false as per your request
      enableSelection: true,
      enableInlineAdd: this.canAdd,
      enableInlineEdit: true,
      enableInlineDelete: true,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };
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
      CompanyId: MASTER_DEFAULT_KEYS.COMPANYID,
      divisionCode: rowData.divisionName || rowData.divisionName,
      approvalroleid: 1,
      approvaluserid: 1
    };

    this._transferWorkflowPolicyService.create(payLoad).subscribe(() => {
      this._notification.createNotification(
        'success',
        'Access Level',
        'Access Level created successfully!',
      );
    });
    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      // divisionName: this.getDisplayName(this.divisions, rowData.level1Id),
      // departmentName: this.getDisplayName(this.departments, rowData.level2Id),
      // subDepartmentName: this.getDisplayName(this.subDepartments, rowData.level3Id),
      // businessDomainName: this.getDisplayName(this.subDepartments, rowData.level4Id),
      // documentTypeId: this.getDisplayName(this.documentTypes, rowData.documentTypeId),
    };

    this.manualUserData = [rowWithId, ...this.manualUserData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    console.log('Row updated:', event);
    debugger;
    // Update display names
    // event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
    // event.rowData.departmentName = this.getDisplayName(
    //   this.departments,
    //   event.rowData.departmentId,
    // );
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
      // this.previewFile(event.value);
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

  GetAllResponsibilityTransferWorkflows(query: any = {}) {
      const sort = query.sortModel?.[0];
      const pageNumber = Number(query?.pageNumber) || 1;
      const pageSize = Number(query?.pageSize) || this.pageSize;
  
      const searchText = query?.searchText || query?.filterModel?.fname?.filter || '';
  
      this._transferWorkflowPolicyService
        .GetAllTransferWorkflowPolicies(
          searchText,
          sort?.sort?.toUpperCase() || 'ASC',
          sort?.colId || 'fname',
          true,
          pageNumber,
          pageSize,
        )
        .subscribe((res:any) => {
          if (res?.Success && res.Data?.Items) { 
  
            this.manualUserData = res.Data.Items.map((item: any) => ({
              id: item.Id,
              divisionName: item.DivisionCode,
              approvalAuthority: item.ApprovalRoleId ? item.ApprovalRoleId.toString() : null
            }));
          } else {
            this.manualUserData = []; 
          }
        });
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
