import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { ApiResponse, BusinessDomain, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs'; 

// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class BusinessDomainService {
  private _departments: ReplaySubject<BusinessDomain[]> = new ReplaySubject<BusinessDomain[]>(1);

  constructor(private http: HttpClient) {}

  get departments$(): Observable<BusinessDomain[]> {
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

  getBusinessDomainList(): Observable<any> {
    const uri = `${environment.baseUrl}/DMSBusinessDomain/get-all-business-domain-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getBusinessDomainsByDivisionCode(dCode: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSBusinessDomain/get-departments-by-division-code?dCode=${dCode}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getBusinessDomainCount(): Observable<GenericResponse<Number>> {
    const uri = `${environment.baseUrl}/DMSBusinessDomain/get-business-domain-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllBusinessDomains(
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

    const uri = `${environment.baseUrl}/DMSBusinessDomain/get-all-business-domain`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSBusinessDomain/create-business-domain`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.baseUrl}/DMSBusinessDomain/update-business-domain`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSBusinessDomain/delete-business-domain/${code}`
    );
  }
 
}
