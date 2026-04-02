import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { catchError, map, Observable, ReplaySubject, switchMap, take, tap, throwError } from 'rxjs';
import { ApiResponse, DocumentAttribute } from '../interfaces/interfaces'; 
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class DocumentAttributeService {
  private _cabietStructureConfig = new ReplaySubject<DocumentAttribute[]>(1);

  constructor(
    private http: HttpClient, 
    private _config: AppConfigService
  ) {}

  get cabietStructureConfig$(): Observable<DocumentAttribute[]> {
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

  getDocumentAttributeList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentAttribute/get-all-document-attributes-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentAttributeById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentAttribute/get-document-attributes-by-id/${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentAttributeByDocumentType(code: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentAttribute/get-document-attributes-by-code/${code}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentAttributeByDocumentId( 
    documentId: number,
  ): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentAttribute/get-document-attributes-by-documentId?documentId=${documentId}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDocumentAttribute(
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

    const uri = `${this.apiUrl}/DMSDocumentAttribute/get-all-document-attributes`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }
 

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentAttribute/create-document-attributes`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentAttribute/update-document-attributes`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentAttribute/delete-document-attributes/${code}`,
    );
  }
}
