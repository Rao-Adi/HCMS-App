import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { CabinetStructureTabsConfig2, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { CabinetStructureTabsConfig } from '../interfaces/interfaces';
// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class CabinetStructureTabsConfigService {
  private _cabietStructureConfig = new ReplaySubject<CabinetStructureTabsConfig[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<CabinetStructureTabsConfig[]> {
    return this._cabietStructureConfig.asObservable();
  }

  private getHeaders(): HttpHeaders {
    // Customize headers as needed (e.g., authorization token, content type)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Access-Control-Allow-Origin': '*'
      // Add any other headers you may need
    });
    return headers;
  }

  getCabietStructureTabsList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/get-all-cabinet-tabs-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getCabietTabsById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/get-cabinet-tab-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllCabietStructureTabs(
    searchText: string,
    sortBy: 'ASC' | 'DESC',
    sortColumn: string,
    isActive: boolean,
    pageNo: number,
    pageSize: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('SearchText', searchText)
      .set('SortBy', sortBy)
      .set('SortColumn', sortColumn)
      .set('IsActive', isActive.toString())
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());

    const uri = `${environment.baseUrl}/get-all-cabinet-tabs`;

    return this.http.post(uri, null, {
      params,
      headers: this.getHeaders(),
    });
  }

  create(shortcut: CabinetStructureTabsConfig): Observable<CabinetStructureTabsConfig> {
    return this.cabietStructureConfig$.pipe(
      take(1),
      switchMap((cabietStructureConfig) =>
        this.http.post<CabinetStructureTabsConfig>('create-cabinet-tab', { shortcut }).pipe(
          map((newcabietStructureConfig) => {
            // Update the cabietStructureConfig with the new shortcut
            this._cabietStructureConfig.next([...cabietStructureConfig, newcabietStructureConfig]);

            // Return the new shortcut from observable
            return newcabietStructureConfig;
          })
        )
      )
    );
  }

  update(shortcut: CabinetStructureTabsConfig): Observable<CabinetStructureTabsConfig> {
    const payload = {
      id: shortcut.Id,
      name: shortcut.Name,
      isActive: true,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json-patch+json',
      accept: '*/*',
    });

    return this.http
      .put<CabinetStructureTabsConfig>(`${environment.baseUrl}/update-cabinet-tab`, payload, {
        headers,
      })
      .pipe(
        tap((updated) => {
          // 🔹 Update cached state AFTER API success
          this.cabietStructureConfig$.pipe(take(1)).subscribe((list) => {
            const index = list.findIndex((i) => i.Id === updated.Id);
            if (index !== -1) {
              const newList = [...list];
              newList[index] = updated;
              this._cabietStructureConfig.next(newList);
            }
          });
        })
      );
  }
 
  delete(id: number): Observable<boolean> {
    return this.http
      .delete<boolean>(`${environment.baseUrl}/delete-cabinet-tab`, {
        params: { id },
      })
      .pipe(
        tap(() => {
          this.cabietStructureConfig$.pipe(take(1)).subscribe((list) => {
            this._cabietStructureConfig.next(list.filter((item) => item.Id !== id));
          });
        })
      );
  }
}
