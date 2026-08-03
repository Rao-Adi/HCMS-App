import { Injectable } from '@angular/core';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { SubDepartment } from '@app/shared/interfaces/interfaces';
import { Observable } from 'rxjs';
import { SubDepartmentService } from '../subdepartment.service';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

@Injectable({ providedIn: 'root' })
export class SubDepartmentCacheService {
  private readonly CACHE_KEY = MASTER_CACHE_KEYS.SUB_DEPARTMENTS;

  constructor(
    private masterCache: Mastercacheservice,
    private subDepartmentService: SubDepartmentService,
  ) {}

  getSubDepartments(): Observable<SubDepartment[]> {
    return this.masterCache.getMasterData<SubDepartment>({
      cacheKey: this.CACHE_KEY,
      getCount$: () => this.subDepartmentService.getSubDepartmentCount(),
      getData$: () =>
        this.subDepartmentService.GetAllSubDepartments('', 'ASC', 'Name', true, 1, 1000),
      mapFn: (item) => ({
        Id: item.Id || item.id,
        Code: item.Code || item.code,
        Name: item.Name || item.name,
        IsActive: item.isActive || item.IsActive || false,
        IsDeleted: item.isDeleted || item.IsDeleted || false,
        DepartmentCode: item.DepartmentCode || item.departmentCode,
        Department: item.Department || item.department,
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
