import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { ApiResponse, SubDepartment } from '../interfaces/interfaces';

@Injectable({ providedIn: 'root' })
export class SubDepartmentService {
  private _departments: ReplaySubject<SubDepartment[]> = new ReplaySubject<SubDepartment[]>(1);

  constructor(private http: HttpClient) {}

  get departments$(): Observable<SubDepartment[]> {
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

  getSubDepartmentList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSSubDepartment/get-all-subdepartment-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getSubDepartmentsByDivisionCode(departmentCode: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSSubDepartment/get-subdepartment-by-department-code/${departmentCode}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getSubDepartmentCount(): Observable<GenericResponse<Number>> {
    const uri = `${environment.baseUrl}/DMSSubDepartment/get-subdepartment-count`;
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

    const uri = `${environment.baseUrl}/DMSSubDepartment/get-all-subdepartment`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSSubDepartment/create-subdepartment`,
      payload
    );
  }

  update(payload: any) {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSSubDepartment/update-subdepartment`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSSubDepartment/delete-subdepartment/${code}`
    );
  }
}
