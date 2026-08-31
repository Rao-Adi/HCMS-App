import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, DocumentTrainingAuthorization } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class DocumentTrainingAuthorizationService {
  private _cabietStructureConfig = new ReplaySubject<DocumentTrainingAuthorization[]>(1);

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  get cabietStructureConfig$(): Observable<DocumentTrainingAuthorization[]> {
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
 
  getDocumentTrainingAuthorizationById(Id: string): Observable<GenericResponse<any>> {
    // Same route-mismatch as delete() below -- [HttpGet("get-by-id")] has no {id} placeholder,
    // so it needs to come through the query string, not a path segment.
    const uri = `${this.apiUrl}/DMSDocumentTrainingAuthorization/get-by-id?id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }
 
 
  GetAllDocumentTrainingAuthorizations(
    searchText: string,
    sortBy: 'ASC' | 'DESC',
    sortColumn: string,
    isActive: boolean,
    pageNumber: number,
    pageSize: number,
    filters?: any,
  ): Observable<any> {
    const body = {
      searchText,
      sortBy,
      sortColumn,
      isActive,
      pageNumber,
      pageSize,
      ...filters,
    };

    const uri = `${this.apiUrl}/DMSDocumentTrainingAuthorization/get-all-document-training-authorizations`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentTrainingAuthorization/create`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentTrainingAuthorization/update`,
      payload,
    );
  }

  delete(code: string) {
    // The backend route is [HttpDelete("Delete")] with no {id} placeholder, so `id` is bound
    // from the query string, not a path segment -- .../delete/${code} doesn't match that route
    // template at all (extra path segment), which is what produced the 404.
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentTrainingAuthorization/delete?id=${code}`,
    );
  }
}
