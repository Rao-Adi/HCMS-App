import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusinessDomainComponent } from '@app/shared/components/business-domain-component/business-domain-component';
import { DepartmentComponent } from '@app/shared/components/department-component/department-component';
import { DivisionComponent } from '@app/shared/components/division-component/division-component';
import { DocumentTypeComponent } from '@app/shared/components/document-type-component/document-type-component';
import { SubDepartmentComponent } from '@app/shared/components/sub-department-component/sub-department-component';
import { CabinetStructureTabsConfig } from '@app/shared/interfaces/interfaces';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { CabinetStructureTabsConfigService } from '@app/shared/services/CabinetStructureTabsConfig.service';


@Component({
  selector: 'app-cabinet-structure',
  imports: [
    CommonModule,
    FormsModule, 
    SafeTranslatePipe,
    CustomDateFormatPipe,
    DivisionComponent,
    BusinessDomainComponent,
    DepartmentComponent,
    DocumentTypeComponent,
    SubDepartmentComponent,
  ],
  templateUrl: './cabinet-structure.html',
  styleUrl: './cabinet-structure.css',
})
export class CabinetStructure {
  level1Title: string = 'Level 1';
  level2Title: string = 'Level 2';
  level3Title: string = 'Level 3';
  level4Title: string = 'Level 4';
  level5Title: string = 'Document Type';
  selectedTab!: CabinetStructureTabsConfig;

  tabs: CabinetStructureTabsConfig[] = [];
  selectedTabId!: number;
  selectedTabTitle = ''; // for textbox editing

  constructor(
    private cdr: ChangeDetectorRef,
    private _cabietTabConfigService: CabinetStructureTabsConfigService
  ) {}

  ngOnInit() {
    this.loadTabs();
  }

  loadTabs(): void {
    this._cabietTabConfigService
      .GetAllCabietStructureTabs('', 'ASC', 'Id', true, 1, 10)
      .subscribe((res) => {
        if (res?.Data) {
          this.tabs = (res.Data.Items ?? []).map((d: any) => ({
            Id: Number(d.Id), // 🔥 FIX
            Name: d.Name,
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

  onTabChange(tab: CabinetStructureTabsConfig): void {
    this.selectedTab = tab;
    this.selectedTabId = tab.Id;
    this.selectedTabTitle = tab.Name;
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
      next: (updated: any) => {
        // Update tabs array
        this.tabs = this.tabs.map((tab) =>
          tab.Id === updated.Data.Id
            ? {
                ...tab,
                Name: updated.Data.Name,
                LastModifiedBy: updated.Data.LastModifiedBy,
                LastModifiedAt: updated.Data.LastModifiedAt,
              }
            : tab
        );

        // Update selected tab reference too (for UI refresh)
        if (this.selectedTab.Id === updated.Data.Id) {
          this.selectedTab = {
            ...this.selectedTab,
            Name: updated.Data.Name,
            LastModifiedBy: updated.Data.LastModifiedBy,
            LastModifiedAt: updated.Data.LastModifiedAt,
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
    return tab.Id;
  }
}
