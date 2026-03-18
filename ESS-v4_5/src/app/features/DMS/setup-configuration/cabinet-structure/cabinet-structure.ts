import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusinessDomainComponent } from '@app/shared/components/business-domain-component/business-domain-component';
import { DepartmentComponent } from '@app/shared/components/department-component/department-component';
import { DivisionComponent } from '@app/shared/components/division-component/division-component';
import { DocumentTypeComponent } from '@app/shared/components/document-type-component/document-type-component';
import { SubDepartmentComponent } from '@app/shared/components/sub-department-component/sub-department-component';
import { MASTER_DEFAULT_KEYS } from '@app/shared/interfaces/const';
import { CabinetStructureTabsConfig, CabinetTabVM } from '@app/shared/interfaces/interfaces';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { CabinetStructureTabsConfigService } from '@app/shared/services/CabinetStructureTabsConfig.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

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
  readonly MAX_LEVEL = 4;
  level1Title: string = 'Level 1';
  level2Title: string = 'Level 2';
  level3Title: string = 'Level 3';
  level4Title: string = 'Level 4';
  level5Title: string = 'Document Type';
  //cabinetConfigStructure!: CabinetStructureTabsConfig;
  selectedTab: string = 'Level 1';
  activeTab!: number | 'DOCUMENT_TYPE';
  //tabs: CabinetStructureTabsConfig[] = [];
  selectedTabId!: number;
  selectedTabTitle = ''; // for textbox editing
  // CabinetStructureComponent
  tabs: CabinetTabVM[] = [];
  levelTitles: Record<number, string> = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private _cabietTabConfigService: CabinetStructureTabsConfigService,
    private readonly cabinetHierarchy: CabinetHierarchyService,
  ) {}

  ngOnInit() {
    this.cabinetHierarchy.loadDropdownHierarchy().subscribe((levels) => {
      this.levelTitles = this.cabinetHierarchy.getLevelTitles();

      this.tabs = levels.map((l) => ({
        level: l.level,
        title: l.title,
        createdBy: l.createdBy,
        createdAt: l.createdAt,
        lastModifiedBy: l.lastModifiedBy,
        lastModifiedAt: l.lastModifiedAt,
      }));

      if (this.tabs?.length) {
        this.activateFirstTab();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.tabs?.length) {
      this.onTabChange(this.tabs[0]); // first level active
    }
  }

  activateFirstTab(): void {
    const firstTab = this.tabs[0];
    this.onTabChange(firstTab);
  }

  getDefaultChildTitle(level: number): string {
    switch (level) {
      case 2:
        return 'Department';
      case 3:
        return 'Sub-Department';
      case 4:
        return 'Business Domain';
      default:
        return `Level ${level}`;
    }
  }

  loadTabs(): void {
    this._cabietTabConfigService
      .GetAllCabietStructureTabs('', 'ASC', 'Id', true, 1, 10)
      .subscribe((res) => {
        if (!res?.Data?.Items?.length) {
          this.tabs = [];
          this.levelTitles = {};
          return;
        }

        const dbLevels = res.Data.Items.map((d: any) => ({
          level: Number(d.Id),
          title: d.Name,
          createdBy: d.CreatedBy,
          createdAt: new CustomDateFormatPipe().transform(d.CreatedAt || ''),
          lastModifiedBy: d.LastModifiedBy,
          lastModifiedAt: new CustomDateFormatPipe().transform(d.LastModifiedAt || ''),
        }));

        // Build lookup from DB
        this.levelTitles = {};
        dbLevels.forEach((l: any) => {
          this.levelTitles[l.level] = l.title;
        });

        // 🔥 BUILD DERIVED TABS
        const derivedTabs: any[] = [];

        dbLevels.forEach((l: any) => {
          // Current level tab
          derivedTabs.push(l);

          // Child level tab (if within limit)
          if (l.level < this.MAX_LEVEL && !this.levelTitles[l.level + 1]) {
            derivedTabs.push({
              level: l.level + 1,
              title: this.getDefaultChildTitle(l.level + 1),
              createdBy: null,
              createdAt: null,
              lastModifiedBy: null,
              lastModifiedAt: null,
            });
          }
        });

        // Remove duplicates & sort
        this.tabs = derivedTabs
          .filter((v, i, a) => a.findIndex((t) => t.level === v.level) === i)
          .sort((a, b) => a.level - b.level);

        // Default tab
        this.onTabChange(this.tabs[0]);
      });
  }

  // loadTabs(): void {
  //   this._cabietTabConfigService
  //     .GetAllCabietStructureTabs('', 'ASC', 'Id', true, 1, 10)
  //     .subscribe((res) => {
  //       if (res?.Data) {
  //         this.tabs = (res.Data.Items ?? []).map((d: any) => ({
  //           Id: Number(d.Id), // 🔥 FIX
  //           Name: d.Name,
  //           CreatedBy: d.CreatedBy,
  //           CreatedAt: new CustomDateFormatPipe().transform(d.CreatedAt || ''),
  //           LastModifiedBy: d.LastModifiedBy,
  //           LastModifiedAt: new CustomDateFormatPipe().transform(d.LastModifiedAt || ''),
  //         }));

  //         this.levelTitles = (res.Data.Items ?? []).map((d: any) => ({
  //           Id: Number(d.Id), // 🔥 FIX
  //           Name: d.Name,
  //         }));
  //         console.log(this.levelTitles);
  //       } else {
  //         this.tabs = [];
  //       }

  //       // select first tab by default
  //       if (this.tabs.length > 0) {
  //         this.onTabChange(this.tabs[0]);
  //       }
  //     });
  // }

  // onTabChange(tab: CabinetStructureTabsConfig): void {
  //   this.cabinetConfigStructure = tab;
  //   this.selectedTabId = tab.Id;
  //   this.selectedTabTitle = tab.Name;
  // }

  selectedTabLevel!: number;
  cabinetConfigStructure!: CabinetTabVM;

  onTabChange(tab: CabinetTabVM): void {
    this.activeTab = tab.level;
    this.cabinetConfigStructure = tab;
    this.selectedTabLevel = tab.level;
    this.selectedTabTitle = tab.title;
  }

  onDocumentTypeClick(): void {
    this.activeTab = 'DOCUMENT_TYPE';
    this.cabinetConfigStructure = null!;
  }

  saveTabTitle(): void {
    const payload = {
      CompanyId: MASTER_DEFAULT_KEYS.COMPANYID,
      Id: this.selectedTabLevel,
      Name: this.selectedTabTitle,
      IsActive: true,
    };

    this._cabietTabConfigService.update(payload).subscribe({
      next: (updated: any) => {
        // Update tabs
        this.tabs = this.tabs.map((tab) =>
          tab.level === updated.Data.Id
            ? {
                ...tab,
                title: updated.Data.Name,
                lastModifiedBy: updated.Data.LastModifiedBy,
                lastModifiedAt: updated.Data.LastModifiedAt,
              }
            : tab,
        );

        // 🔥 CRITICAL: update levelTitles
        this.levelTitles = {
          ...this.levelTitles,
          [updated.Data.Id]: updated.Data.Name,
        };

        // Update selected tab
        this.cabinetConfigStructure = {
          ...this.cabinetConfigStructure,
          title: updated.Data.Name,
          lastModifiedBy: updated.Data.LastModifiedBy,
          lastModifiedAt: updated.Data.LastModifiedAt,
        };

        this.cdr.detectChanges();
      },
    });
  }

  // saveTabTitle(): void {
  //   const payload: CabinetStructureTabsConfig = {
  //     Id: this.selectedTabId,
  //     Name: this.selectedTabTitle,
  //     CreatedAt: null,
  //     CreatedBy: null,
  //     LastModifiedAt: null,
  //     LastModifiedBy: null,
  //   };

  //   this._cabietTabConfigService.update(payload).subscribe({
  //     next: (updated: any) => {
  //       // Update tabs array
  //       this.tabs = this.tabs.map((tab) =>
  //         tab.level === updated.Data.Id
  //           ? {
  //               ...tab,
  //               Name: updated.Data.Name,
  //               LastModifiedBy: updated.Data.LastModifiedBy,
  //               LastModifiedAt: updated.Data.LastModifiedAt,
  //             }
  //           : tab,
  //       );

  //       // Update selected tab reference too (for UI refresh)
  //       if (this.cabinetConfigStructure.level === updated.Data.Id) {
  //         this.cabinetConfigStructure = {
  //           ...this.cabinetConfigStructure,
  //           title: updated.Data.Name,
  //           lastModifiedBy: updated.Data.LastModifiedBy,
  //           lastModifiedAt: updated.Data.LastModifiedAt,
  //         };
  //       }
  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       console.error(err);
  //     },
  //   });
  // }

  trackByTabId(index: number, tab: any) {
    return tab.Id;
  }
}
