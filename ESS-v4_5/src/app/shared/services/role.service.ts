import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, Role } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private _cabietStructureConfig = new ReplaySubject<Role[]>(1);

  constructor(private http: HttpClient,
    private _config: AppConfigService
  ) {}

  get cabietStructureConfig$(): Observable<Role[]> {
    return this._cabietStructureConfig.asObservable();
  }

   // We make apiUrl a getter. It's only called when needed.
  private get apiUrl(): string {
    if (!this._config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return ''; // Failsafe
    }
    return this._config.baseUrl;
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

  getRoleList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSRole/get-all-role-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getRoleById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSRole/get-role-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllRole(
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

    const uri = `${this.apiUrl}/DMSRole/get-all-role`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/DMSRole/create-role`, payload);
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/DMSRole/update-role`, payload);
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/DMSRole/delete-role/${code}`);
  }
}
