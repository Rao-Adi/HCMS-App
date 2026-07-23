import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { BehaviorSubject } from 'rxjs';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { DivisionCacheService } from '@app/shared/services/CacheServices/division-cache-service';
import { TransferWorkflowPolicyService } from '@app/shared/services/transfer-workflow-policy.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';

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
  formId = 'responsibilitiestransferpolicy';

  public noRowsOverlay: string = '';
  gridConfig: GridConfig = {} as GridConfig;
  manualUserData: any[] = [];

  pinnedTopRowDataPlanning: AccessLevelColumns[] = [
    {
      divisionCode: null,
      approvalAuthority: null,
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
  // single state
 
  pageSize = 10;
  rowData: any[] = [];
  totalRows = 0;
  divisions: any[] = [];

  approvalAuthority: any[] = [];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  constructor(
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
    private _peoplePartnersService: PeoplePartnersService,
    private _transferWorkflowPolicyService: TransferWorkflowPolicyService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.getAllDivisionList();
      this.buildGrid();
      this.GetAllResponsibilityTransferWorkflows();
    });
  }

  private getColumns(): GridColumn[] {
    return [
      // ✅ DIVISION
      {
        field: 'divisionCode',
        headerName: 'Division',
        type: 'dropdown',
        dropdownOptions: this.divisions,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },

      // ✅ APPROVAL AUTHORITY
      {
        field: 'approvalAuthority',
        headerName: 'Approval Authority',
        type: 'dropdown',
        dropdownOptions: this.approvalAuthority,
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
      enableInlineEdit: this.canEdit,
      enableInlineDelete: this.canDelete,
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
    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      divisionCode: rowData.divisionCode,
      ApproverEmpCode: rowData.approvalAuthority,
      approvalroleid: rowData.approvalAuthority,
      approvaluserid: rowData.approvalAuthority,
    };

    const selectedOption = this.approvalAuthority.find(
      (opt) => opt.id === rowData.approvalAuthority
    );
    let displayName = rowData.approvalAuthority;
    if (selectedOption) {
      const parts = selectedOption.text.split('-');
      displayName = parts.length > 1 ? parts.slice(1).join('-') : selectedOption.text;
    }

    const rowWithId = {
      ...rowData,
      approvalAuthority: displayName,
      id: this.generateId(),
    };

    this.manualUserData = [rowWithId, ...this.manualUserData];

    this._transferWorkflowPolicyService.create(payLoad).subscribe({
      next: () => {
        this._notificationToastService.createNotification(
          'success',
          'Success',
          'Record added successfully!',
        );
        this.GetAllResponsibilityTransferWorkflows();
      },
      error: (err) => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to add record.',
        );
        // Revert: Remove the optimistically added record from the grid
        this.manualUserData = this.manualUserData.filter((row) => row.id !== rowWithId.id);
      },
    });
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    //console.log('Row updated:', event);
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
    } else if (event.field === 'divisionCode') {
      if (event.value) {
        this.GetEmployeesByDivisionId(event.value);
      } else {
        this.approvalAuthority = [];
        this.buildGrid();
      }
      event.rowData.approvalAuthority = null;
      if (event.rowIndex !== undefined && event.rowIndex !== null && event.rowIndex >= 0) {
        this.manualUserData[event.rowIndex] = { ...event.rowData };
        this.manualUserData = [...this.manualUserData];
      } else {
        // Apply changes to the Pinned Top Row (New Row)
        this.pinnedTopRowDataPlanning[0] = { ...event.rowData };
        this.pinnedTopRowDataPlanning = [...this.pinnedTopRowDataPlanning];
      }
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
      .subscribe((res: any) => {
        if (res?.Success && res.Data?.Items) {
          this.manualUserData = res.Data.Items.map((item: any) => ({
            id: item.Id,
            divisionCode: item.DivisionCode,
            approvalAuthority: item.DivisionHeadName +"("+ item.DivisionHeadDesignation + ")" ? item.DivisionHeadName.toString() +"("+ item.DivisionHeadDesignation + ")"  : null,
          }));
        } else {
          this.manualUserData = [];
        }
      });
  }

  getAllDivisionList = () => {
    this._peoplePartnersService.GetAllDivisions().subscribe((res) => {
      if (res?.Data) {
        this.divisions = (res.Data ?? []).map((d: any) => ({
          id: d.Id || d.id,
          text: d.Value || d.value,
        }));
      } else {
        this.divisions = [];
      }
      this.buildGrid();
      //this.cdr.detectChanges(); // force update
    });
  };

  GetEmployeesByDivisionId = (divId: string) => {
    this._peoplePartnersService.GetEmployeesByDivisionId(divId).subscribe((res) => {
      if (res?.Data) {
        this.approvalAuthority = (res.Data ?? []).map((d: any) => ({
          id: d.EmployeeCode || d.employeecode,
          text: d.employeecode + "-"+ (d.FullName || d.fullname) + "(" + (d.Designation || d.designation) + ")" ,
        }));
      } else {
        this.approvalAuthority = [];
      }
      this.buildGrid();
      //this.cdr.detectChanges(); // force update
    });
  };
}

class AccessLevelColumns {
  divisionCode: string | null = null;
  approvalAuthority: string | null = null;
  isNewRow: boolean = false;
}
