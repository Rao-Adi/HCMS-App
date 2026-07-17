import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusinessDomainComponent } from '@app/shared/components/business-domain-component/business-domain-component';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DepartmentComponent } from '@app/shared/components/department-component/department-component';
import { DivisionComponent } from '@app/shared/components/division-component/division-component';
import { DocumentTypeComponent } from '@app/shared/components/document-type-component/document-type-component';
import { SubDepartmentComponent } from '@app/shared/components/sub-department-component/sub-department-component';
import { CabinetTabVM } from '@app/shared/interfaces/interfaces';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { CabinetStructureTabsConfigService } from '@app/shared/services/CabinetStructureTabsConfig.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { PermissionService } from '@app/shared/services/permission.service';

@Component({
  selector: 'app-cabinet-structure',
  imports: [
    CommonModule,
    FormsModule,
    CustomDateFormatPipe,
    SafeTranslatePipe,
    DivisionComponent,
    BusinessDomainComponent,
    DepartmentComponent,
    DocumentTypeComponent,
    SubDepartmentComponent,
    NzSwitchModule,
  ],
  templateUrl: './cabinet-structure.html',
  styleUrl: './cabinet-structure.css',
})
export class CabinetStructure {
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'cabinetstructure'; // Example FormId for this page

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
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.cabinetHierarchy.loadDropdownHierarchy().subscribe((levels) => {
        this.levelTitles = this.cabinetHierarchy.getLevelTitles();

        this.tabs = levels.map((l) => ({
          level: l.level,
          title: l.title,
          createdBy: l.createdBy,
          createdByName: l.createdByName,
          createdAt: l.createdAt,
          lastModifiedBy: l.lastModifiedBy,
          lastModifiedByName: l.lastModifiedByName,
          lastModifiedAt: this.formatDate(l.lastModifiedAt),
          isActive: l.isActive,
        }));

        if (this.tabs?.length) {
          this.activateFirstTab();
        }
      });
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
          isActive: d.IsActive,
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
              isActive: false,
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

  formatDate(dateVal: any): string {
    if (!dateVal) return 'N/A';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return String(dateVal);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
  }

  saveTabTitle(): void {
    const payload = {
      Id: this.selectedTabLevel,
      Name: this.selectedTabTitle,
      IsActive: true,
    };

    this._cabietTabConfigService.update(payload).subscribe({
      next: (updated: any) => {
        const updatedData = updated.Data;
        this.tabs = this.tabs.map((tab) =>
          tab.level === updatedData.Id
            ? {
                ...tab,
                title: updatedData.Name,
                lastModifiedBy: updatedData.LastModifiedBy,
                lastModifiedAt: this.formatDate(updatedData.LastModifiedAt),
              }
            : tab,
        );

        if (this.cabinetConfigStructure?.level === updatedData.Id) {
          this.cabinetConfigStructure.title = updatedData.Name;
          this.cabinetConfigStructure.lastModifiedBy = updatedData.LastModifiedBy;
          this.cabinetConfigStructure.lastModifiedAt = this.formatDate(updatedData.LastModifiedAt);
        }
      }
    });
  }

  onToggleChange(tab: CabinetTabVM, isActive: boolean): void {
    const payload = {
      Id: tab.level,
      Name: tab.title,
      IsActive: isActive,
    };
    this._cabietTabConfigService.update(payload).subscribe({
      next: () => {
        const updatedTab = this.tabs.find(t => t.level === tab.level);
        if (updatedTab) {
          updatedTab.isActive = isActive;
        }
        if (this.cabinetConfigStructure && this.cabinetConfigStructure.level === tab.level) {
          this.cabinetConfigStructure.isActive = isActive;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update toggle state', err);
        // Optionally revert the toggle state on error
        const updatedTab = this.tabs.find(t => t.level === tab.level);
        if (updatedTab) {
          updatedTab.isActive = !isActive;
          if (this.cabinetConfigStructure && this.cabinetConfigStructure.level === tab.level) {
            this.cabinetConfigStructure.isActive = !isActive;
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  trackByTabId(index: number, tab: any) {
    return tab.Id;
  }
}
