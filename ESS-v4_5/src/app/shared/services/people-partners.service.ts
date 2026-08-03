import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, User } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class PeoplePartnersService {
  private _cabietStructureConfig = new ReplaySubject<User[]>(1);

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  get cabietStructureConfig$(): Observable<User[]> {
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

  GetAllRoles(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-roles`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDesignationList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-designations`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }
 

  GetAllDivisions(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-divisions`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDepartments(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-departments`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllSubdepartments(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-subdepartments`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getUserByRoleId(roleId: string, payload: any): Observable<ApiResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-employees-by-role/${roleId}`;
    return this.http.post<ApiResponse<any>>(uri, payload, { headers: this.getHeaders() });
  }

  GetEmployeesByDivisionId(divId: string): Observable<ApiResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-employees-by-divisionId/${divId}`;
    return this.http.get<ApiResponse<any>>(uri, { headers: this.getHeaders() });
  }
  
  GetEmployeeList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-employee-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetHeadByDivisionId(divId: string): Observable<ApiResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-head-by-division-id/${divId}`;
    return this.http.get<ApiResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetDepartmentsByDivisionId(divId: string): Observable<ApiResponse<any>> {
    const uri = `${this.apiUrl}/DMSPeoplePartners/get-departments-by-division-id/${divId}`;
    return this.http.get<ApiResponse<any>>(uri, { headers: this.getHeaders() });
  }

  //   GetUserByFilters(payload: any): Observable<ApiResponse<any>> {
  //     return this.http.post<ApiResponse<any>>(`${this.apiUrl}/DMSPeoplePartners/get-user-with-filters`, payload);
  //   }

  //   create(payload: any): Observable<ApiResponse<any>> {
  //     return this.http.post<ApiResponse<any>>(`${this.apiUrl}/DMSPeoplePartners/create-user`, payload);
  //   }

  //   update(payload: any) {
  //     return this.http.put<ApiResponse<any>>(`${this.apiUrl}/DMSPeoplePartners/update-user`, payload);
  //   }

  //   delete(code: string) {
  //     return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/DMSPeoplePartners/delete-user/${code}`);
  //   }

  GetAllSetupsDetails(
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

    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-setups-detail`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  GetAllDeptStrMaster(
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

    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-deptstr-master`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  GetAllDeptStrDetails(
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

    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-deptstr-detail`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  GetAllEmpJobProfile(
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

    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-emp-job-profile`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  GetAllEmployees(
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

    const uri = `${this.apiUrl}/DMSPeoplePartners/get-all-employees`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  createEmployee(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSPeoplePartners/create-employee`,
      payload,
    );
  }
}
