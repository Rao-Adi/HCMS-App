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
        placeholder: 'Please select any',
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

    // Keep approvalAuthority as the employee code (matches what the server stores and
    // returns as ApprovalUserId) — the grid's dropdown valueFormatter resolves it to a
    // friendly name via dropdownOptions, which already has this division's employees loaded
    // since that's where this selection came from.
    const rowWithId = {
      ...rowData,
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
    const { rowData } = event;

    // Reflect the edit immediately in the grid
    this.manualUserData[event.index] = { ...rowData };
    this.manualUserData = [...this.manualUserData]; // Trigger change detection

    // Only persisted rows have an Id — the pinned "add new row" is handled by onRowAdded
    if (!rowData.id) return;

    const payLoad = {
      id: rowData.id,
      divisionCode: rowData.divisionCode,
      ApproverEmpCode: rowData.approvalAuthority,
      approvalroleid: rowData.approvalAuthority,
      approvaluserid: rowData.approvalAuthority,
    };

    this._transferWorkflowPolicyService.update(payLoad).subscribe({
      next: () => {
        this._notificationToastService.createNotification(
          'success',
          'Success',
          'Record updated successfully!',
        );
        this.GetAllResponsibilityTransferWorkflows();
      },
      error: (err) => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to update record.',
        );
        // Revert: reload from the server so the grid doesn't keep showing the unsaved edit
        this.GetAllResponsibilityTransferWorkflows();
      },
    });
  }

  onRowDeleted(rowIndex: number): void {
    const row = this.manualUserData[rowIndex];
    const previousData = this.manualUserData;

    // Remove optimistically so the grid updates immediately
    this.manualUserData = this.manualUserData.filter((_, i) => i !== rowIndex);

    if (!row?.id) return;

    this._transferWorkflowPolicyService.delete(row.id).subscribe({
      next: () => {
        this._notificationToastService.createNotification(
          'success',
          'Success',
          'Record deleted successfully!',
        );
      },
      error: (err) => {
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to delete record.',
        );
        // Revert: restore the optimistically removed record
        this.manualUserData = previousData;
      },
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
      this.manualUserData[event.rowIndex] = { ...event.rowData };
    }

    if (event.field === 'file-preview') {
      // Handle file preview
      // this.previewFile(event.value);
    } else if (event.field === 'divisionCode') {
      if (event.value) {
        this.GetEmployeesByDivisionId(event.value);
      }
      // Note: approvalAuthority (the dropdown option pool) is intentionally left alone here
      // even when the division is cleared — it now accumulates every division touched across
      // the whole grid (see GetEmployeesByDivisionId), so wiping it would blank out the
      // dropdown/valueFormatter for every other row too, not just this one.
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
            // The actually-saved approver — NOT item.DivisionHeadName/DivisionHeadDesignation,
            // which describe the division's separate HR-configured head. Mapping from those
            // was the bug: no matter who got saved as approver, the grid always showed the
            // division head instead.
            approvalAuthority: item.ApprovalUserId || item.approvaluserid || null,
          })).sort((a: any, b: any) => {
            const divA = this.getDisplayName(this.divisions, a.divisionCode).toLowerCase();
            const divB = this.getDisplayName(this.divisions, b.divisionCode).toLowerCase();
            return divA.localeCompare(divB);
          });

          // Resolve every row's approver code to a friendly name for the read-only view.
          // dropdownOptions is shared by the editor AND the valueFormatter, so without this
          // sweep only whichever division was most recently edited would show a name instead
          // of a bare code.
          this.loadApprovalAuthorityForAllDivisions();
        } else {
          this.manualUserData = [];
        }
      });
  }

  private loadApprovalAuthorityForAllDivisions(): void {
    const divisionCodes = Array.from(
      new Set(this.manualUserData.map((row) => row.divisionCode).filter((code) => !!code)),
    );
    divisionCodes.forEach((code) => this.GetEmployeesByDivisionId(code));
  }

  getAllDivisionList = () => {
    this._peoplePartnersService.GetAllDivisions().subscribe((res) => {
      if (res?.Data) {
        this.divisions = (res.Data ?? [])
          .map((d: any) => ({
            id: d.Id || d.id,
            text: d.Value || d.value,
          }))
          .sort((a: any, b: any) => (a.text || '').localeCompare(b.text || ''));
      } else {
        this.divisions = [];
      }
      this.buildGrid();
      //this.cdr.detectChanges(); // force update
    });
  };

  GetEmployeesByDivisionId = (divId: string, onLoaded?: () => void) => {
    this._peoplePartnersService.GetEmployeesByDivisionId(divId).subscribe((res) => {
      const employees = res?.Data
        ? (res.Data ?? []).map((d: any) => ({
            id: d.EmployeeCode || d.employeecode,
            text:
              d.employeecode +
              ' - ' +
              (d.FullName || d.fullname) +
              ' (' +
              (d.Designation || d.designation) +
              ')',
            rawName: d.FullName || d.fullname || '',
          }))
        : [];

      // Merge rather than overwrite — approvalAuthority backs the dropdown for whichever
      // row is being edited/added AND the read-only valueFormatter for every other row, so
      // employees loaded for other divisions must stay available.
      const existingIds = new Set(this.approvalAuthority.map((o) => o.id));
      this.approvalAuthority = [
        ...this.approvalAuthority,
        ...employees.filter((e: any) => !existingIds.has(e.id)),
      ].sort((a: any, b: any) => (a.rawName || '').localeCompare(b.rawName || ''));

      this.buildGrid();
      onLoaded?.();
      //this.cdr.detectChanges(); // force update
    });
  };

  onRowEditingStarted(event: { rowData: any; index: number }): void {
    const { rowData } = event;
    // approvalAuthority now accumulates every division touched so far (initial load sweep,
    // prior edits) — this is just a safety net for a division that hasn't been loaded yet.
    if (rowData?.divisionCode) {
      this.GetEmployeesByDivisionId(rowData.divisionCode);
    }
  }
}

class AccessLevelColumns {
  divisionCode: string | null = null;
  approvalAuthority: string | null = null;
  isNewRow: boolean = false;
}
