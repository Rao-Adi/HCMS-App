import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { ApiResponse, Designation, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class DesignationService {
  private _designations: ReplaySubject<Designation[]> = new ReplaySubject<Designation[]>(1);

  constructor(private http: HttpClient) {}

  get designations$(): Observable<Designation[]> {
    return this._designations.asObservable();
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

  getDesignationList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDesignation/get-all-designation-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDesignations(
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

    const uri = `${environment.baseUrl}/DMSDesignation/get-all-designations`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDesignation/create-designation`,
      payload
    );
  }

  update(payload: any) {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDesignation/update-designation`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDesignation/delete-designation/${code}`
    );
  }
 
}
