import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';

 
export interface MasterCacheEntry<T> {
  count: number;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class Mastercacheservice {
  constructor() {}

  /**
   * Generic cache handler for all master data
   */
  getMasterData<T>(config: {
    cacheKey: string;
    getCount$: () => Observable<any>;
    getData$: () => Observable<any>;
    mapFn: (item: any) => T;
  }): Observable<T[]> {
    const cached = localStorage.getItem(config.cacheKey);

    // 1️⃣ Cache exists → validate using count
    if (cached) {
      const parsed = JSON.parse(cached) as { count: number; data: T[] };

      return config.getCount$().pipe(
        switchMap((res) => {
          const dbCount = res?.Data ?? res;

          // ✅ Cache valid
          if (parsed.count === dbCount) {
            return of(parsed.data);
          }

          // ❌ Cache outdated → fetch fresh
          return this.fetchAndCache(config, dbCount);
        })
      );
    }

    // 2️⃣ No cache → fetch
    return this.fetchAndCache(config);
  }

  /**
   * Fetch fresh data and update cache
   */
  private fetchAndCache<T>(
  config: {
    cacheKey: string;
    getCount$: () => Observable<any>;
    getData$: () => Observable<any>;
    mapFn: (item: any) => T;
  },
  knownCount?: number
): Observable<T[]> {
  return config.getData$().pipe(
    switchMap((res) => {
      const items = res?.Data?.Items ?? [];
      const totalCount = knownCount ?? res?.Data?.TotalCount ?? items.length;

      // 🔒 HARD STOP: do NOT cache empty data
      if (!items.length || totalCount === 0) {
        console.warn(
          `[MasterCacheService] Skipping cache update for ${config.cacheKey} (empty result)`
        );
        return of([] as T[]);
      }

      const mapped = items.map(config.mapFn);

      localStorage.setItem(
        config.cacheKey,
        JSON.stringify({
          count: totalCount,
          data: mapped,
        })
      );

      return of(mapped);
    })
  );
}


  /**
   * Manual cache clear
   */
  clear(key: string) {
    localStorage.removeItem(key);
  }

  clearAll() {
    localStorage.clear();
  }
}
