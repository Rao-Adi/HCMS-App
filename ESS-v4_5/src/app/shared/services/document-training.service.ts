import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, DocumentTraining } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class DocumentTrainingService {
  private _cabietStructureConfig = new ReplaySubject<DocumentTraining[]>(1);

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  get cabietStructureConfig$(): Observable<DocumentTraining[]> {
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

  getAllDocumentTrainingsList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentTraining/get-all-document-training-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentTrainingById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentTraining/get-document-training-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetTrainingAssessmentDetails(
    documentId: string,
    trainingMode: string,
  ): Observable<ApiResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentTraining/get-training-assessment-details/${documentId}/${trainingMode}`;
    return this.http.get<ApiResponse<any>>(uri, { headers: this.getHeaders() });
  }

  AcknowledgeAndSendForAuthorization(documentId: string): Observable<ApiResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentTraining/acknowledge-and-send-for-authorization/${documentId}`;
    return this.http.post<ApiResponse<any>>(uri, { headers: this.getHeaders() });
  }
  GetAllDocumentTrainings(
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

    const uri = `${this.apiUrl}/DMSDocumentTraining/get-all-document-training`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentTraining/create-document-training`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentTraining/update-document-training`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentTraining/delete-document-training/${code}`,
    );
  }
}
