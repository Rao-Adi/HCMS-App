import { Injectable } from '@angular/core';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { Observable } from 'rxjs';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { BusinessDomainService } from '../businessDomain.service';
import { BusinessDomain } from '@app/shared/interfaces/interfaces';

@Injectable({ providedIn: 'root' })
export class BusinessDomainCacheService {
  private readonly CACHE_KEY = MASTER_CACHE_KEYS.BUSINESS_DOMAIN;

  constructor(
    private masterCache: Mastercacheservice,
    private businessDomain: BusinessDomainService,
  ) {}

  getBusinessDomains(): Observable<BusinessDomain[]> {
    return this.masterCache.getMasterData<any>({
      cacheKey: this.CACHE_KEY,
      getCount$: () => this.businessDomain.getBusinessDomainCount(),
      getData$: () => this.businessDomain.GetAllBusinessDomains('', 'ASC', 'Name', true, 1, 1000),
      mapFn: (item) => ({
        Id: item.Id || item.id,
        Code: item.Code || item.code,
        Name: item.Name || item.name,
        SubDepartmentCode: item.SubDepartmentCode || item.subDepartmentCode,
        SubDepartment: item.SubDepartment || item.subDepartment,
        CreatedBy: item.CreatedBy || item.createdBy || '',
        CreatedByName: item.CreateByName || item.createByName || item.CreatedByName || item.createdByName || '',
        CreatedAt: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdAt || ''),
        LastModifiedBy: item.LastModifiedBy || item.lastModifiedBy || '',
        LastModifiedByName: item.LastModifiedByName || item.lastModifiedByName || item.LastModifiedBy || item.lastModifiedBy || '',
        LastModifiedAt: new CustomDateFormatPipe().transform(
          item.LastModifiedAt || item.lastModifiedAt || '',
        ),
      }),
    });
  }

  clearCache() {
    this.masterCache.clear(this.CACHE_KEY);
  }
}
