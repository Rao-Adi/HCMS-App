import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { Template } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  private _cabietStructureConfig = new ReplaySubject<Template[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<Template[]> {
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
    const uri = `${environment.baseUrl}/DMSTemplate/get-all-templates-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getCabietTabsById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSTemplate/get-template-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllCabietStructureTabs(
    searchText: string,
    sortBy: 'ASC' | 'DESC',
    sortColumn: string,
    isActive: boolean,
    pageNumber: number,
    pageSize: number
  ): Observable<any> {
    const body = {
      searchText,
      sortBy,
      sortColumn,
      isActive,
      pageNumber,
      pageSize,
    };

    const uri = `${environment.baseUrl}/DMSTemplate/get-all-template`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(shortcut: Template): Observable<Template> {
    return this.cabietStructureConfig$.pipe(
      take(1),
      switchMap((cabietStructureConfig) =>
        this.http.post<Template>('/DMSTemplate/create-template', { shortcut }).pipe(
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

  update(shortcut: Template): Observable<Template> {
    const payload = {
      id: shortcut.id,
      departmentCode: shortcut.departmentCode,
      isActive: true,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json-patch+json',
      accept: '*/*',
    });

    return this.http
      .put<Template>(`${environment.baseUrl}/DMSTemplate/update-template`, payload, {
        headers,
      })
      .pipe(
        tap((updated) => {
          // 🔹 Update cached state AFTER API success
          this.cabietStructureConfig$.pipe(take(1)).subscribe((list) => {
            const index = list.findIndex((i) => i.id === updated.id);
            if (index !== -1) {
              const newList = [...list];
              newList[index] = updated;
              this._cabietStructureConfig.next(newList);
            }
          });
        })
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(`${environment.baseUrl}/DMSTemplate/delete-template`, {
        params: { id },
      })
      .pipe(
        tap(() => {
          this.cabietStructureConfig$.pipe(take(1)).subscribe((list) => {
            this._cabietStructureConfig.next(list.filter((item) => item.id !== id));
          });
        })
      );
  }
}
