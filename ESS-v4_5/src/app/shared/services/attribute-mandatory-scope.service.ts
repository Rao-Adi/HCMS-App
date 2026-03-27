import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, AttributeMandatoryScope } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class AttributeMandatoryScopeService {
  private _cabietStructureConfig = new ReplaySubject<AttributeMandatoryScope[]>(1);

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

  get cabietStructureConfig$(): Observable<AttributeMandatoryScope[]> {
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

  getAttributeMandatoryList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSAttributeMandatoryScope/get-all-attribute-mandatory-scopes-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getAttributeMandatoryScopesById(Id: any): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSAttributeMandatoryScope/get-attribute-mandatory-scopes-by-id/${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getAttributeMandatoryByDocumentTypeId(Id: any): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSAttributeMandatoryScope/get-mandatory-by-document-type-id/${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }



  GetAllAttributeMandatoryScopes(
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

    const uri = `${this.apiUrl}/DMSAttributeMandatoryScope/get-all-attribute-mandatory-scopes`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSAttributeMandatoryScope/create-attribute-mandatory-scopes`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSAttributeMandatoryScope/update-attribute-mandatory-scopes`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSAttributeMandatoryScope/delete-attribute-mandatory-scopes/${code}`,
    );
  }
}
