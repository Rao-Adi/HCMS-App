import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, AuditLog } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private _cabietStructureConfig = new ReplaySubject<AuditLog[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<AuditLog[]> {
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
    const uri = `${environment.baseUrl}/DMSAuditLog/get-all-audit-log-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getCabietTabsById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSAuditLog/get-audit-log-by-id/id=${Id}`;
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

    const uri = `${environment.baseUrl}/DMSAuditLog/get-all-audit-log`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSAuditLog/create-audit-log`,
      payload
    );
  }

  update(payload: any) {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSAuditLog/update-audit-log`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSAuditLog/delete-audit-log/${code}`
    );
  }

  // create(shortcut: AuditLog): Observable<AuditLog> {
  //   return this.cabietStructureConfig$.pipe(
  //     take(1),
  //     switchMap((cabietStructureConfig) =>
  //       this.http.post<AuditLog>('/DMSAuditLog/create-audit-log', { shortcut }).pipe(
  //         map((newcabietStructureConfig) => {
  //           // Update the cabietStructureConfig with the new shortcut
  //           this._cabietStructureConfig.next([...cabietStructureConfig, newcabietStructureConfig]);

  //           // Return the new shortcut from observable
  //           return newcabietStructureConfig;
  //         })
  //       )
  //     )
  //   );
  // }

  // update(shortcut: AuditLog): Observable<AuditLog> {
  //   const payload = {
  //     id: shortcut.id,
  //     entityId: shortcut.entityId,
  //     isActive: true,
  //   };

  //   const headers = new HttpHeaders({
  //     'Content-Type': 'application/json-patch+json',
  //     accept: '*/*',
  //   });

  //   return this.http
  //     .put<AuditLog>(`${environment.baseUrl}/DMSAuditLog/update-audit-log`, payload, {
  //       headers,
  //     })
  //     .pipe(
  //       tap((updated) => {
  //         // 🔹 Update cached state AFTER API success
  //         this.cabietStructureConfig$.pipe(take(1)).subscribe((list) => {
  //           const index = list.findIndex((i) => i.id === updated.id);
  //           if (index !== -1) {
  //             const newList = [...list];
  //             newList[index] = updated;
  //             this._cabietStructureConfig.next(newList);
  //           }
  //         });
  //       })
  //     );
  // }

  // delete(id: string): Observable<boolean> {
  //   return this.http
  //     .delete<boolean>(`${environment.baseUrl}/DMSAuditLog/delete-audit-log`, {
  //       params: { id },
  //     })
  //     .pipe(
  //       tap(() => {
  //         this.cabietStructureConfig$.pipe(take(1)).subscribe((list) => {
  //           this._cabietStructureConfig.next(list.filter((item) => item.id !== id));
  //         });
  //       })
  //     );
  // }
}
