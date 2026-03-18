import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, UserAccessLevel } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserAccesssLevelService {
  private _cabietStructureConfig = new ReplaySubject<UserAccessLevel[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<UserAccessLevel[]> {
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
 

  getCabietTabsById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSUserAccessLevel/get-user-access-level-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllUser(
    searchText: string,
    sortBy: 'ASC' | 'DESC',
    sortColumn: string,
    isActive: boolean,
    pageNumber: number,
    pageSize: number,
  ): Observable<any> {
    const body = {
      searchText,
      sortBy,
      sortColumn,
      isActive,
      pageNumber,
      pageSize,
    };

    const uri = `${environment.baseUrl}/DMSUserAccessLevel/get-all-user-access-levels`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.baseUrl}/DMSUserAccessLevel/create-user-access-level`, payload);
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(`${environment.baseUrl}/DMSUserAccessLevel/update-user-access-level`, payload);
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(`${environment.baseUrl}/DMSUserAccessLevel/delete-user-access-level/${code}`);
  }
}
