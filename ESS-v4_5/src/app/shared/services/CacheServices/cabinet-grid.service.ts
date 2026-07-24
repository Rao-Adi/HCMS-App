import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CabinetStructureTabsConfigService } from '../CabinetStructureTabsConfig.service';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { DivisionCacheService } from './division-cache-service';
import { DepartmentCacheService } from './department-cache-service'; 
import { BusinessDomainCacheService } from './business-domain-cache-service';
import { GridColumn } from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { SubDepartmentCacheService } from './sub-department-cache-service';


@Injectable({ providedIn: 'root' })
export class CabinetGridService {
  dropdownDataSources: Record<number, any[]> = {};

  constructor(
    private divisionService: DivisionCacheService,
    private departmentService: DepartmentCacheService,
    private subDepartmentService: SubDepartmentCacheService,
    private businessDomainService: BusinessDomainCacheService,
  ) {}

  // 🔥 UNIVERSAL column builder
  buildCabinetColumns(levels: CabinetLevel[]): GridColumn[] { 
    return levels
      .filter(level => level.isActive)
      .map((level, index) => {
        const parentLevel = index > 0 ? levels[index - 1].level : null;
        
        return {
          field: `level${level.level}Id`,
          headerName: level.title,
          type: 'dropdown',
          dropdownOptions: this.dropdownDataSources[level.level],
          dropdownValueField: 'id',
          dropdownDisplayField: 'text',
          dependsOn: parentLevel ? `level${parentLevel}Id` : undefined,
          filterKey: parentLevel ? 'parentId' : undefined,
          minWidth: 220,
          required: false,
        } as GridColumn;
      });
  }

  // 🔥 UNIVERSAL dropdown loader
  loadDropdownData(levels: CabinetLevel[]): Observable<void> {
    const loaders: Observable<any>[] = [];

    levels.forEach((l) => {
      loaders.push(
        this.getLoaderForLevel(l.level).pipe(
          tap((data) => (this.dropdownDataSources[l.level] = data)),
        ),
      );
    });

    return forkJoin(loaders).pipe(map(() => void 0));
  }

  // 🔥 Level → data source mapping (single place!)
  private getLoaderForLevel(level: number): Observable<any[]> {
    switch (level) {
      case 1:
        return this.divisionService.getDivisions().pipe(
          map((res) => res.map((d) => ({ id: d.Code, text: d.Name }))),
        );

      case 2:
        return this.departmentService.getDepartments().pipe(
          map((res) =>
            res.map((d) => ({
              id: d.Code,
              text: d.Name,
              parentId: d.DivisionCode,
            })),
          ),
        );

      case 3:
        return this.subDepartmentService.getSubDepartments().pipe(
          map((res) =>
            res.map((d) => ({
              id: d.Code,
              text: d.Name,
              parentId: d.DepartmentCode,
            })),
          ),
        );

      case 4:
        return this.businessDomainService.getBusinessDomains().pipe(
          map((res) =>
            res.map((d) => ({
              id: d.Code,
              text: d.Name,
              parentId: d.SubDepartmentCode,
            })),
          ),
        );

      default:
        return of([]);
    }
  }
}
