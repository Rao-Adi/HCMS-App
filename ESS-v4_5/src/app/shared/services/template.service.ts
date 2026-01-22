import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, Template, TemplateCreateDto } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  private _cabietStructureConfig = new ReplaySubject<Template[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<Template[]> {
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
    const uri = `${environment.baseUrl}/DMSTemplate/get-all-templates-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getCabietTabsById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSTemplate/get-template-by-id/id=${Id}`;
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

    const uri = `${environment.baseUrl}/DMSTemplate/get-all-template`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSTemplate/create-template`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.baseUrl}/DMSTemplate/update-template`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSTemplate/delete-template/${code}`
    );
  }
}
