import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { GridConfig } from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { ManualManageEmployee } from './manual-manage-employee/manual-manage-employee';
import { PeoplePartnersEmployee } from './people-partners-employee/people-partners-employee';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    FormsModule,
    NzSwitchModule,
    NzIconModule,
    NzModalModule,
    ManualManageEmployee,
    PeoplePartnersEmployee,
  ],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  gridConfig: GridConfig = {} as GridConfig;
  private tabDataCache = new Set<string>();
  public noRowsOverlay: string = '';

  selectedTab: string = 'Upload';
  loading = false;
  switchValue1 = false;
  switchValue2 = false;
  // single state
  activeMode: 'manual' | 'integration' | null = null;
  pageSize = 10;
  manualUserData: any[] = [];

  constructor() {}

  ngOnInit() {}

  clickSwitch(mode: 'manual' | 'integration'): void {
    if (this.loading) return;

    this.loading = true;

    this.loadDataByTab(mode);

    setTimeout(() => {
      this.activeMode = mode;

      // mutually exclusive switches
      this.switchValue1 = mode === 'manual';
      this.switchValue2 = mode === 'integration';

      this.loading = false;
    }, 300); // keep UX fast
  }

  // Default Column Definitions: Apply configuration across all columns

  loadDataByTab(tabId: string): void {
    if (this.tabDataCache.has(tabId)) return;

    const apiMap: Record<string, () => void> = {
      // manual: () =>
      //   this.GetAllManuallyManageEmployee({
      //     pageNumber: 1,
      //     pageSize: this.pageSize,
      //     sortModel: [],
      //     filterModel: {},
      //   }),
      // integration: () =>
      //   this.GetAllIntegeratedPeoplepartners({
      //     pageNumber: 1,
      //     pageSize: this.pageSize,
      //     sortModel: [],
      //     filterModel: {},
      //   }),
    };

    apiMap[tabId]?.();
    this.tabDataCache.add(tabId);
  }
}
