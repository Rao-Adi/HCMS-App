import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { Observable } from 'rxjs';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class UncontrolledDocumentService {
  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  private get apiUrl(): string {
    if (!this._config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return '';
    }
    return this._config.baseUrl;
  }

  create(payload: FormData): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSUncontrolledDocument/create-uncontrolled-document`;
    return this.http.post<GenericResponse<any>>(uri, payload);
  }

  review(payload: FormData): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSUncontrolledDocument/review-uncontrolled-document`;
    return this.http.post<GenericResponse<any>>(uri, payload);
  }

  getAll(payload: any): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSUncontrolledDocument/get-all-uncontrolled-documents`;
    return this.http.post<GenericResponse<any>>(uri, payload);
  }

  getById(id: number): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSUncontrolledDocument/get-uncontrolled-document-by-id/${id}`;
    return this.http.get<GenericResponse<any>>(uri);
  }

  getHistory(id: number): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSUncontrolledDocument/get-uncontrolled-document-history/${id}`;
    return this.http.get<GenericResponse<any>>(uri);
  }

  delete(id: number): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSUncontrolledDocument/delete-uncontrolled-document/${id}`;
    return this.http.delete<GenericResponse<any>>(uri);
  }
}