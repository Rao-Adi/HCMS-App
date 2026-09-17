import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { AppConfigService } from '@app/core/services/app-config';

 
export interface MasterCacheEntry<T> {
  count: number;
  data: T[];
  /** Which API + company this data came from -- see Mastercacheservice.currentScope(). */
  scope?: string;
  /** Date.now() at the time it was cached. */
  cachedAt?: number;
}

@Injectable({ providedIn: 'root' })
export class Mastercacheservice {
  /**
   * How long a cached master list may be trusted without re-reading it.
   *
   * The count check below cannot see a change that leaves the count the same -- a rename, or a
   * delete paired with an add. Both happen in normal use, and until one of them changed the count
   * the stale list was served forever. A deleted document type staying in dropdowns is the worst
   * of these, because it quietly defeats the rule that a deleted type must disappear everywhere.
   */
  private readonly ttlMs = 15 * 60 * 1000;

  constructor(private _config: AppConfigService) {}

  /**
   * Identifies where this data came from, so a cache is never reused across a different API or
   * company. Pointing the app at another database is the case this exists for: master lists there
   * are different rows entirely, but very often the same NUMBER of rows, so the count check
   * happily kept serving the previous database's list -- which is how a live Policy type ended up
   * rendering as the raw code DT-0006, with nothing in the cached list to resolve it against.
   */
  private currentScope(): string {
    let apiBase = '';
    try {
      apiBase = this._config.baseUrl ?? '';
    } catch {
      apiBase = '';
    }

    let companyId = '';
    try {
      companyId = localStorage.getItem('HRISCompanyId') ?? '';
    } catch {
      companyId = '';
    }

    return apiBase + '|' + companyId;
  }

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

    // 1️⃣ Cache exists → validate before trusting it
    if (cached) {
      const parsed = JSON.parse(cached) as MasterCacheEntry<T>;

      // Checked before the count call so a cache that is already disqualified does not cost a
      // round trip. Entries written before these two fields existed have neither, so they fail
      // both checks and get refetched once -- which is the intended way to clear them out.
      const scopeChanged = parsed.scope !== this.currentScope();
      const expired = !parsed.cachedAt || Date.now() - parsed.cachedAt > this.ttlMs;

      if (scopeChanged || expired) {
        return this.fetchAndCache(config);
      }

      return config.getCount$().pipe(
        switchMap((res) => {
          const dbCount = res?.Data ?? res;

            // Verify the cached data contains the new schema fields
            const isStaleSchema = parsed.data.length > 0 && !('CreatedByName' in (parsed.data[0] as any));

            // ✅ Cache valid (count matches AND schema is up to date)
            if (parsed.count === dbCount && !isStaleSchema) {
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
      const items = Array.isArray(res?.Data) ? res.Data : (res?.Data?.Items ?? []);
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
          scope: this.currentScope(),
          cachedAt: Date.now(),
        } as MasterCacheEntry<T>)
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
