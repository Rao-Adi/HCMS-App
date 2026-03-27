import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { ApiResponse, Division, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { AppConfigService } from '@app/core/services/app-config';
// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class DivisionService {
  private _divisions: ReplaySubject<Division[]> = new ReplaySubject<Division[]>(1);

  constructor(private http: HttpClient,
    private _config: AppConfigService
  ) {}

   // We make apiUrl a getter. It's only called when needed.
  private get apiUrl(): string {
    if (!this.apiUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return ''; // Failsafe
    }
    return this.apiUrl;
  }


  get divisions$(): Observable<Division[]> {
    return this._divisions.asObservable();
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

  getDivisionList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDivision/get-all-division-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDivisionCount(): Observable<GenericResponse<Number>> {
    const uri = `${this.apiUrl}/DMSDivision/get-division-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDivisions(
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

    const uri = `${this.apiUrl}/DMSDivision/get-all-divisions`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDivision/create-division`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSDivision/update-division`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSDivision/delete-division/${code}`
    );
  } 
}
