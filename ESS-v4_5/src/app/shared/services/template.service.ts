import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { catchError, map, Observable, of, ReplaySubject, shareReplay, switchMap, take, tap } from 'rxjs';
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

  /**
   * TemplateType values as stored in Templates.TemplateType.
   *
   * Only Html matters to callers deciding how to present a document: a document type whose
   * template IS the HTML is shown in the rich text box, while both Word kinds are merged into
   * the .docx and downloaded.
   */
  static readonly TEMPLATE_TYPE_HTML = '3';

  private readonly _templateTypeByDocumentType = new Map<string, Observable<string>>();

  /**
   * The template type configured for a document type, as a string ('1', '2', '3'), or '' when the
   * document type has no template.
   *
   * Cached per document type for the session. A reviewer's grid holds many rows of the same few
   * document types, and this is asked on every title click -- deployment configuration that does
   * not change while someone reads a list. A failed lookup resolves to '' rather than erroring, so
   * a caller falls back to its normal behaviour instead of the click doing nothing.
   */
  getTemplateTypeByDocumentTypeCode(code?: string | null): Observable<string> {
    const key = (code || '').trim();
    if (!key) return of('');

    let cached = this._templateTypeByDocumentType.get(key);
    if (!cached) {
      cached = this.getTemplateByDocumentTypeCode(key).pipe(
        map((response: any) => {
          const data = response?.Data ?? response?.data;
          if (!data || Object.keys(data).length === 0) return '';
          return (data.TemplateType ?? data.templateType ?? '').toString();
        }),
        catchError(() => of('')),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this._templateTypeByDocumentType.set(key, cached);
    }
    return cached;
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
