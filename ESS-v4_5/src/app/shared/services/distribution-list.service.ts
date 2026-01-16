import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, DistributionList } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DistributionListService {
  private _cabietStructureConfig = new ReplaySubject<DistributionList[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<DistributionList[]> {
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

  getCabietStructureTabsList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDistributionList/get-all-distribution-list-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getCabietTabsById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDistributionList/get-distribution-list-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllCabietStructureTabs(
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

    const uri = `${environment.baseUrl}/DMSDistributionList/get-all-distribution-list`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDistributionList/create-distribution-list`,
      payload
    );
  }

  update(payload: any) {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDistributionList/update-distribution-list`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDistributionList/delete-distribution-list/${code}`
    );
  } 
}
