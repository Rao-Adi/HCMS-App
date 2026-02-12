import { Component, EventEmitter, Output } from '@angular/core';
import { DivisionList } from '../division-list/division-list';
import { DepartmentList } from '../department-list/department-list';
import { SubDepartmentList } from '../sub-department-list/sub-department-list';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CabinetStructureTabsConfigService } from '@app/shared/services/CabinetStructureTabsConfig.service';
import { CabinetTabVM } from '@app/shared/interfaces/interfaces';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { Observable, tap } from 'rxjs';
import { BusinessDomainList } from '../business-domain-list/business-domain-list';

interface CabinetDropdownConfig {
  level: number;
  title: string;
  component: 'division' | 'department' | 'subDepartment' | 'businessDomain';
}

interface CabinetLevel {
  level: number;
  title: string;
}
@Component({
  selector: 'app-cabinet-structure-list',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    DivisionList,
    DepartmentList,
    SubDepartmentList,
    BusinessDomainList,
  ],
  templateUrl: './cabinet-structure-list.html',
  styleUrl: './cabinet-structure-list.css',
})
export class CabinetStructureList {
  @Output() hierarchyChange = new EventEmitter<{ level: number; title: string; value: any }[]>();
  
  readonly MAX_LEVEL = 4;

  dropdownLevels: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};
  selectedValues: Record<number, any> = {};
  hierarchyLevels$!: Observable<CabinetLevel[]>;
  levelMap: Record<number, string> = {};

  constructor(
    private _cabietTabConfigService: CabinetStructureTabsConfigService,
    private _cabinetHirarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit() {
    // this.hierarchyLevels$ = this._cabinetHirarchyService.loadDropdownHierarchy(); // 🔥 REQUIRED
    this.hierarchyLevels$ = this._cabinetHirarchyService.loadDropdownHierarchy().pipe(
      tap((levels) => {
        this.levelMap = {};

        levels.forEach((l) => {
          this.levelMap[l.level] = l.title;
        });
      }),
    );
    // this._cabinetHirarchyService.loadDropdownHierarchy().subscribe(levels => {
    //   this.dropdownLevels = levels;
    //   this.levelTitles = this._cabinetHirarchyService.getLevelTitles();
    // });
  }

  onValueChange(level: number, value: any) {
    this.selectedValues[level] = value;

    // clear child selections
    Object.keys(this.selectedValues)
      .map(Number)
      .filter((l) => l > level)
      .forEach((l) => delete this.selectedValues[l]);

    // 🔥 Emit updated hierarchy
    // 🔥 Build clean hierarchy payload
    const payload = Object.keys(this.selectedValues)
      .map(Number)
      .sort((a, b) => a - b)
      .map((l) => ({
        level: l,
        title: this.levelMap[l], // 👈 dropdown name
        value: this.selectedValues[l],
      }));

    this.hierarchyChange.emit(payload);
  }

  private getDefaultChildTitle(level: number): string {
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

  buildCabinetHierarchy(dbItems: any[], maxLevel: number): CabinetLevel[] {
    const levelTitles: Record<number, string> = {};
    const dbLevels: CabinetLevel[] = dbItems.map((d) => ({
      level: Number(d.Id),
      title: d.Name,
    }));

    dbLevels.forEach((l) => (levelTitles[l.level] = l.title));

    const derived: CabinetLevel[] = [];

    dbLevels.forEach((l) => {
      derived.push(l);

      if (l.level < maxLevel && !levelTitles[l.level + 1]) {
        derived.push({
          level: l.level + 1,
          title: this.getDefaultChildTitle(l.level + 1),
        });
      }
    });

    return derived
      .filter((v, i, a) => a.findIndex((t) => t.level === v.level) === i)
      .sort((a, b) => a.level - b.level);
  }

  loadDropdownHierarchy(): void {
    this._cabietTabConfigService
      .GetAllCabietStructureTabs('', 'ASC', 'Id', true, 1, 10)
      .subscribe((res) => {
        this.dropdownLevels = this.buildCabinetHierarchy(res.Data.Items, this.MAX_LEVEL);

        this.levelTitles = {};
        this.dropdownLevels.forEach((l) => {
          this.levelTitles[l.level] = l.title;
        });
      });
  }

  resetHierarchy(): void {
    this.selectedValues = {};

    // Optional — notify parent that hierarchy is cleared
    this.hierarchyChange.emit([]);
  }
}
