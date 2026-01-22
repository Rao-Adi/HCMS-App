import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, DistributionType } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DistributionTypeService {
  private _cabietStructureConfig = new ReplaySubject<DistributionType[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<DistributionType[]> {
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

  getDistributionTypeList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDistributionType/get-all-distribution-type-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDistributionTypeById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDistributionType/get-distribution-type-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDistributionType(
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

    const uri = `${environment.baseUrl}/DMSDistributionType/get-all-distribution-type`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.baseUrl}/DMSDistributionType/create-distribution-type`, payload);
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(`${environment.baseUrl}/DMSDistributionType/update-distribution-type`, payload);
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(`${environment.baseUrl}/DMSDistributionType/delete-distribution-type/${code}`);
  }
}
