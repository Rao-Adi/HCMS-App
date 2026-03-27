import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { ApiResponse, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { Department } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private _departments: ReplaySubject<Department[]> = new ReplaySubject<Department[]>(1);

  constructor(private http: HttpClient,
    private _config: AppConfigService
  ) {}

   // We make apiUrl a getter. It's only called when needed.
  private get apiUrl(): string {
    if (!this._config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return ''; // Failsafe
    }
    return this._config.baseUrl;
  }

  get departments$(): Observable<Department[]> {
    return this._departments.asObservable();
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

  getDepartmentList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDepartment/get-all-department-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDepartmentsByDivisionCode(dCode: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDepartment/get-departments-by-division-code/${dCode}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDepartmentCount(): Observable<GenericResponse<Number>> {
    const uri = `${this.apiUrl}/DMSDepartment/get-department-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDepartments(
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

    const uri = `${this.apiUrl}/DMSDepartment/get-all-departments`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDepartment/create-department`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSDepartment/update-department`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSDepartment/delete-department/${code}`
    );
  }
  
}
