import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CabinetStructureTabsConfigService } from '../CabinetStructureTabsConfig.service';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';


@Injectable({
  providedIn: 'root', // or provide in module if you prefer scoped instance
})
export class CabinetHierarchyService {
  private readonly MAX_LEVEL = 4; // ← you can make this injectable/configurable if needed

  // You can expose these as public properties if multiple components need them
  // or keep them private and expose via methods
  private _dropdownLevels: CabinetLevel[] = [];
  private _levelTitles: Record<number, string> = {};

  constructor(private readonly _cabinetTabConfigService: CabinetStructureTabsConfigService) {}

  /** Returns the default title for a child level */
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

  /**
   * Builds complete hierarchy array with fallback/default titles for missing levels
   * @param dbItems Raw items from API (expected: { Id: string|number, Name: string }[])
   * @param maxLevel Maximum hierarchy depth to support
   */
  public buildCabinetHierarchy(dbItems: any[], maxLevel: number = this.MAX_LEVEL): CabinetLevel[] {
    // ... same implementation as before ...
    const levelTitles: Record<number, string> = {};
    const dbLevels: CabinetLevel[] = dbItems.map((d) => ({
      level: Number(d.Id),
      title: d.Name?.trim() || `Level ${d.Id}`,
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

  /**
   * Loads hierarchy once and returns Observable<CabinetLevel[]>
   * You can subscribe to this in any component that needs the levels
   */
  public loadDropdownHierarchy(): Observable<CabinetLevel[]> {
    return this._cabinetTabConfigService
      .GetAllCabietStructureTabs('', 'ASC', 'Id', true, 1, 10)
      .pipe(
        map((res) => res?.Data?.Items ?? []),
        map((items) => this.buildCabinetHierarchy(items)),
        tap((levels) => {
          // Cache for synchronous access if needed
          this._dropdownLevels = levels;
          this._levelTitles = {};
          levels.forEach((l) => (this._levelTitles[l.level] = l.title));
        }),
        catchError((err) => {
          console.error('Failed to load cabinet hierarchy', err);
          this._dropdownLevels = [];
          return of([]);
        }),
      );
  }

  // Optional: if some component needs instant access after first load
  public getDropdownLevelsSnapshot(): CabinetLevel[] {
    return [...this._dropdownLevels];
  }

  public getLevelTitle(level: number): string {
    return this._levelTitles[level] ?? this.getDefaultChildTitle(level);
  }

  // ── Convenience getters ────────────────────────────────────────────────

  /** Get the full sorted list of hierarchy levels */
  public getDropdownLevels(): CabinetLevel[] {
    return [...this._dropdownLevels]; // return copy to prevent mutation
  }

  /** Get level → title lookup object */
  public getLevelTitles(): Record<number, string> {
    return { ...this._levelTitles };
  }

  /** Get title for a specific level (with fallback) */
  public getTitleForLevel(level: number): string {
    return this._levelTitles[level] ?? this.getDefaultChildTitle(level);
  }

  /** Clear cached data (useful for logout / refresh) */
  public clearCache(): void {
    this._dropdownLevels = [];
    this._levelTitles = {};
  }
}
