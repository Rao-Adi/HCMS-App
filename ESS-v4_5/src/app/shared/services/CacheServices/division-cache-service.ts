import { Injectable } from '@angular/core';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { Division } from '@app/shared/interfaces/interfaces';
import { Observable } from 'rxjs';
import { DivisionService } from '../division.services';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';

@Injectable({ providedIn: 'root' })
export class DivisionCacheService {
  private readonly CACHE_KEY = MASTER_CACHE_KEYS.DIVISIONS;

  constructor(private masterCache: Mastercacheservice, private divisionService: DivisionService) {}

  getDivisions(): Observable<Division[]> {
    return this.masterCache.getMasterData<any>({
      cacheKey: this.CACHE_KEY,
      getCount$: () => this.divisionService.getDivisionCount(),
      getData$: () => this.divisionService.GetAllDivisions('', 'ASC', 'Name', true, 1, 1000),
      mapFn: (item) => ({
        Id: item.Id || item.id,
        Code: item.Code || item.code,
        Name: item.Name || item.name,
        CreatedBy: item.CreatedBy || item.createdBy || '',
        CreatedAt: item.CreatedAt || item.createdAt || '',
        LastModifiedBy: item.LastModifiedBy || item.lastModifiedBy || '',
        LastModifiedAt: item.LastModifiedAt || item.lastModifiedAt || '',
      }),
    });
  }

  clearCache() {
    this.masterCache.clear(this.CACHE_KEY);
  }
}
