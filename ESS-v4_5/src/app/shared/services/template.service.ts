import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, Template, TemplateCreateDto } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  private _cabietStructureConfig = new ReplaySubject<Template[]>(1);

  constructor(private http: HttpClient,
    private _config: AppConfigService
  ) {}

  get cabietStructureConfig$(): Observable<Template[]> {
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

  getAllTemplateList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSTemplate/get-all-templates-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getTemplateByDocumentTypeCode(code?: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSTemplate/get-template-by-document-type/${code}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getTemplateById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSTemplate/get-template-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  DownloadTemplateByDocumentTypeCode(code: string) {
  return this.http.get(
    `${this.apiUrl}/DMSTemplate/download-template/${code}`,
    {
      observe: 'response',
      responseType: 'blob' // ✅ CRITICAL FIX
    }
  );
}

  GetAllTemplates(
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

    const uri = `${this.apiUrl}/DMSTemplate/get-all-template`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSTemplate/create-template`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSTemplate/update-template`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSTemplate/delete-template/${code}`,
    );
  }
}
