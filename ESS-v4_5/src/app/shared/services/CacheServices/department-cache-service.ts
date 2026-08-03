import { Injectable } from '@angular/core';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { DepartmentService } from '../department.service';
import { Department } from '@app/shared/interfaces/interfaces';
import { Observable } from 'rxjs';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

@Injectable({ providedIn: 'root' })
export class DepartmentCacheService {
  private readonly CACHE_KEY = MASTER_CACHE_KEYS.DEPARTMENTS;

  constructor(
    private masterCache: Mastercacheservice,
    private departmentService: DepartmentService,
  ) {}

  getDepartments(): Observable<Department[]> {
    return this.masterCache.getMasterData<Department>({
      cacheKey: this.CACHE_KEY,
      getCount$: () => this.departmentService.getDepartmentCount(),
      getData$: () => this.departmentService.GetAllDepartments('', 'ASC', 'Name', true, 1, 1000),
      mapFn: (item) => ({
        Id: item.Id ?? item.id,
        Code: item.Code ?? item.code,
        Name: item.Name ?? item.name,
        Division: item.Division ?? item.division ?? '',
        DivisionCode: item.DivisionCode ?? item.divisionCode ?? '',
        IsActive: item.isActive || item.IsActive || false,
        IsDeleted: item.isDeleted || item.IsDeleted || false,
        CreatedBy: item.CreatedBy ?? item.createdBy ?? '',
        CreatedByName:
          item.CreateByName ?? item.createByName ?? item.CreatedByName ?? item.createdByName ?? '',
        CreatedAt:
          new CustomDateFormatPipe().transform(item.CreatedAt ?? item.createdAt ?? '') ?? '',
        LastModifiedBy: item.LastModifiedBy ?? item.lastModifiedBy ?? '',
        LastModifiedByName:
          item.LastModifiedByName ??
          item.lastModifiedByName ??
          item.LastModifiedBy ??
          item.lastModifiedBy ??
          '',
        LastModifiedAt:
          new CustomDateFormatPipe().transform(item.LastModifiedAt || item.lastModifiedAt || '') ??
          '',
      }),
    });
  }

  clearCache() {
    this.masterCache.clear(this.CACHE_KEY);
  }
}
