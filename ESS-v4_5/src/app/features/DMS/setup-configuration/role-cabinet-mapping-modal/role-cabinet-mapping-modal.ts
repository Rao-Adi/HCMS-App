import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, switchMap } from 'rxjs';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { PermissionService } from '@app/shared/services/permission.service';
import {
  RoleCabinetMappingPayload,
  RoleCabinetMappingService,
} from '@app/shared/services/role-cabinet-mapping.service';
import { SpinnerComponent } from '@app/shared/spinner/spinner.component';

/**
 * Maps a People Partners Role to a DMS Cabinet. Division is required; Department, Sub-Department and
 * Business Domain are optional and, left blank, mean "All" -- the same way a workflow authority's
 * cabinet scope reads. Every add / edit / delete is saved straight away, then the list is re-read so
 * the grid always shows what the server actually stored.
 */
@Component({
  selector: 'app-role-cabinet-mapping-modal',
  imports: [CommonModule, FormsModule, EditableAgGridWrapper, SpinnerComponent],
  templateUrl: './role-cabinet-mapping-modal.html',
  styleUrl: './role-cabinet-mapping-modal.css',
})
export class RoleCabinetMappingModal implements OnInit {
  gridConfig: GridConfig = {} as GridConfig;

  // --- PERMISSION FLAGS (same form as the rest of the Users screen) ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'users';

  mappingsData: any[] = [];
  roles: Array<{ id: number; text: string }> = [];
  cabinetHierarchy: CabinetLevel[] = [];
  loading = false;

  pinnedTopRowData: any[] = [
    {
      roleId: null,
      level1Id: null,
      level2Id: null,
      level3Id: null,
      level4Id: null,
      isNewRow: true,
    },
  ];

  constructor(
    private _roleCabinetMappingService: RoleCabinetMappingService,
    private _peoplePartnersService: PeoplePartnersService,
    private _notificationToastService: NotificationToastService,
    private cabinetGridService: CabinetGridService,
    private readonly hierarchyService: CabinetHierarchyService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.loading = true;
      forkJoin({
        roles: this._peoplePartnersService.GetAllRoles(),
        levels: this.hierarchyService.loadDropdownHierarchy(),
      })
        .pipe(
          switchMap(({ roles, levels }) => {
            this.roles = (roles?.Data ?? [])
              .map((d: any) => ({ id: d.Id, text: d.Value }))
              .sort((a: any, b: any) => (a.text || '').localeCompare(b.text || ''));
            this.cabinetHierarchy = levels;
            return this.cabinetGridService.loadDropdownData(levels);
          }),
        )
        .subscribe({
          next: () => {
            this.buildGrid();
            this.loadMappings();
          },
          error: () => {
            this.loading = false;
            this.toast('error', 'Failed to load Roles and Cabinet.');
          },
        });
    });
  }

  private getColumns(): GridColumn[] {
    // Division is the first cabinet level and is the only one that must be chosen; the others stay
    // optional and read "Any" when blank.
    const cabinetColumns = this.cabinetGridService
      .buildCabinetColumns(this.cabinetHierarchy, { blankMeansAll: true })
      .map((col, index) => ({
        ...col,
        minWidth: 160,
        required: index === 0,
        // Division is required, so it never reads blank; its dropdown keeps the usual placeholder.
        emptyValueDisplay: index === 0 ? undefined : col.emptyValueDisplay,
        placeholder: index === 0 ? undefined : col.placeholder,
      }));

    return [
      {
        field: 'roleId',
        headerName: 'Role',
        type: 'dropdown',
        dropdownOptions: this.roles,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 220,
        placeholder: 'Select Role',
        showSearch: true,
        required: true,
      },
      ...cabinetColumns,
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

  private loadMappings(): void {
    this.loading = true;
    this._roleCabinetMappingService.getAll().subscribe({
      next: (res) => {
        const items: any[] = res?.Success && Array.isArray(res.Data) ? res.Data : [];
        // The grid keeps codes / ids as the cell values and shows their names from the dropdown options.
        this.mappingsData = items.map((item) => ({
          Id: item.Id,
          roleId: item.RoleId,
          level1Id: item.DivisionCode ?? '',
          level2Id: item.DepartmentCode ?? '',
          level3Id: item.SubDepartmentCode ?? '',
          level4Id: item.BusinessDomainCode ?? '',
        }));
        this.loading = false;
      },
      error: () => {
        this.mappingsData = [];
        this.loading = false;
        this.toast('error', 'Failed to load Role Cabinet Mappings.');
      },
    });
  }

  private toPayload(rowData: any): RoleCabinetMappingPayload {
    return {
      roleId: Number(rowData.roleId),
      divisionCode: rowData.level1Id,
      departmentCode: rowData.level2Id || null,
      subDepartmentCode: rowData.level3Id || null,
      businessDomainCode: rowData.level4Id || null,
    };
  }

  onRowAdded(event: { rowData: any }): void {
    this.loading = true;
    this._roleCabinetMappingService.create(this.toPayload(event.rowData)).subscribe({
      next: () => {
        this.toast('success', 'Role mapped to cabinet successfully!');
        this.loadMappings();
      },
      error: (err) => {
        this.loading = false;
        this.toast('error', err?.error?.Message || err?.Message || 'Failed to map Role.');
      },
    });
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    const { rowData } = event;
    this.loading = true;
    this._roleCabinetMappingService
      .update({ id: rowData.Id, ...this.toPayload(rowData) })
      .subscribe({
        next: () => {
          this.toast('success', 'Role cabinet mapping updated successfully!');
          this.loadMappings();
        },
        error: (err) => {
          this.toast('error', err?.error?.Message || err?.Message || 'Failed to update mapping.');
          // Put the grid back to what is actually stored.
          this.loadMappings();
        },
      });
  }

  onRowDeleted(rowIndex: number): void {
    const rowData = this.mappingsData[rowIndex];
    if (!rowData?.Id) return;

    this.loading = true;
    this._roleCabinetMappingService.delete(rowData.Id).subscribe({
      next: () => {
        this.toast('success', 'Role cabinet mapping deleted successfully!');
        this.loadMappings();
      },
      error: (err) => {
        this.loading = false;
        this.toast('error', err?.error?.Message || err?.Message || 'Failed to delete mapping.');
      },
    });
  }

  private toast(type: 'success' | 'error', message: string): void {
    this._notificationToastService.createNotification(type, 'Role Cabinet Mapping', message);
  }
}
