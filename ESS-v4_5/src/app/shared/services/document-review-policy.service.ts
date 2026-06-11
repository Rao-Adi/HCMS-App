import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, DocumentReviewPolicy } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class DocumentReviewPolicyService {
  private _cabietStructureConfig = new ReplaySubject<DocumentReviewPolicy[]>(1);

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  get cabietStructureConfig$(): Observable<DocumentReviewPolicy[]> {
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

  getDocumentReviewPolicyById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentReviewPolicy/get-document-review-policy-by-id/${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDocumentReviewPolicies(
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

    const uri = `${this.apiUrl}/DMSDocumentReviewPolicy/get-all-document-review-policies`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentReviewPolicy/create`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentReviewPolicy/update`,
      payload,
    );
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentReviewPolicy/delete/${id}`,
    );
  }
}
