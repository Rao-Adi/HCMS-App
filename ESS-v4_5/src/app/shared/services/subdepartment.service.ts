import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { ApiResponse, SubDepartment } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({ providedIn: 'root' })
export class SubDepartmentService {
  private _departments: ReplaySubject<SubDepartment[]> = new ReplaySubject<SubDepartment[]>(1);

  constructor(private http: HttpClient,
    private _config: AppConfigService
  ) {}

  get departments$(): Observable<SubDepartment[]> {
    return this._departments.asObservable();
  }

   // We make apiUrl a getter. It's only called when needed.
  private get apiUrl(): string {
    if (!this.apiUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return ''; // Failsafe
    }
    return this.apiUrl;
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

  getSubDepartmentList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSSubDepartment/get-all-subdepartment-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getSubDepartmentsByDivisionCode(departmentCode: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSSubDepartment/get-subdepartment-by-department-code/${departmentCode}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getSubDepartmentCount(): Observable<GenericResponse<Number>> {
    const uri = `${this.apiUrl}/DMSSubDepartment/get-subdepartment-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllSubDepartments(
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

    const uri = `${this.apiUrl}/DMSSubDepartment/get-all-subdepartment`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSSubDepartment/create-subdepartment`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSSubDepartment/update-subdepartment`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSSubDepartment/delete-subdepartment/${code}`
    );
  }
}
