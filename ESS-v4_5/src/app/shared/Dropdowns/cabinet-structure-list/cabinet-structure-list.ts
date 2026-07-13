import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CabinetSelection } from '@app/shared/interfaces/interfaces';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { Observable, tap } from 'rxjs';
import { BusinessDomainList } from '../business-domain-list/business-domain-list';
import { DepartmentList } from '../department-list/department-list';
import { DivisionList } from '../division-list/division-list';
import { SubDepartmentList } from '../sub-department-list/sub-department-list';

interface CabinetLevel {
  level: number;
  title: string;
  isActive: boolean;
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
  @Input() hierarchy: CabinetSelection[] | null = null;
  
  @Input() divisionCode: string | null = '';
  @Input() departmentCode: string | null = '';
  @Input() subDepartmentCode: string | null = '';
  @Input() businessDomainCode: string | null = '';
  @Input() disabled: boolean = false;

  @Output() hierarchyChange = new EventEmitter<CabinetSelection[]>();

  selectedValues: Record<number, any> = {};
  levels: CabinetLevel[] = [];
  levelMap: Record<number, string> = {};

  constructor(private _cabinetHirarchyService: CabinetHierarchyService) {}

  ngOnInit() {
    this._cabinetHirarchyService.loadDropdownHierarchy().subscribe(
      (allLevels) => {
        this.levels = allLevels.filter(l => l.isActive);
        this.levelMap = {};
        this.levels.forEach((l) => {
          this.levelMap[l.level] = l.title;
        });
      }
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('hierarchy' in changes) {
      this.applyHierarchy(changes['hierarchy'].currentValue as CabinetSelection[] | null);
    }

    // Support mapping individual level inputs 
    let updated = false;
    const newValues = { ...this.selectedValues };
    
    if ('divisionCode' in changes) { newValues[1] = this.divisionCode; updated = true; }
    if ('departmentCode' in changes) { newValues[2] = this.departmentCode; updated = true; }
    if ('subDepartmentCode' in changes) { newValues[3] = this.subDepartmentCode; updated = true; }
    if ('businessDomainCode' in changes) { newValues[4] = this.businessDomainCode; updated = true; }

    if (updated) {
      this.selectedValues = newValues;
    }
  }

  onValueChange(level: number, value: any) {
    this.selectedValues[level] = value;

    Object.keys(this.selectedValues)
      .map(Number)
      .filter((l) => l > level)
      .forEach((l) => delete this.selectedValues[l]);

    const payload: CabinetSelection[] = Object.keys(this.selectedValues)
      .map(Number)
      .sort((a, b) => a - b)
      .map((l) => ({
        level: l,
        title: this.levelMap[l] ?? `Level ${l}`,
        value: this.selectedValues[l],
      }));

    this.hierarchyChange.emit(payload);
  }

  resetHierarchy(): void {
    this.selectedValues = {};
    this.hierarchyChange.emit([]);
  }

  private applyHierarchy(values: CabinetSelection[] | null): void {
    this.selectedValues = {};

    if (!values?.length) return;

    values.forEach((item) => {
      if (!item) return;
      if (item.value === null || item.value === undefined || item.value === '') return;
      this.selectedValues[item.level] = item.value;
    });
  }
}
