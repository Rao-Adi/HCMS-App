import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, Subject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, DocumentRequest } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class DocumentRequestService {
  private _cabietStructureConfig = new ReplaySubject<DocumentRequest[]>(1);
  public refreshCounts$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  // We make apiUrl a getter. It's only called when needed.
  private get apiUrl(): string {
    if (!this._config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return ''; // Failsafe
    }
    return this._config.baseUrl;
  }

  get cabietStructureConfig$(): Observable<DocumentRequest[]> {
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

  getAllDocumentRequestsList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-all-document-request-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetMyRequestCounts(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-my-request-counts`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDraftDocumentCount(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-draft-documents-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getMyDocumentRequestForApprovalCount(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-my-document-requests-for-approval-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetRequestCreatedByUserListAsync(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-request-created-by-user-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentRequestById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-document-request-by-id/${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetWorkflowObservationDetails(
    requestId: any,
    entityType: string,
    decision?: string
  ): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-document-observation-details?requestId=${requestId}&entityType=${entityType}&decision=${decision}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getWorkflowDeatils(requestId: any, entityType: string, decision?: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-workflow-details?requestId=${requestId}&entityType=${entityType}&decision=${decision}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getMyPendingDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/get-my-pending-document-request`,
      payload,
    );
  }

  exportMyPendingDocumentRequest(payload: any): Observable<Blob> {
    return this.http.post(
      `${this.apiUrl}/DMSDocumentRequest/export-my-pending-document-request`,
      payload,
      { responseType: 'blob' },
    );
  }

  getMyDraftDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-my-draft-request`;
    return this.http.post<ApiResponse<any>>(uri, payload, { headers: this.getHeaders() });
  }

  GetMyRequestsPendingApproval(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/get-my-document-requests-for-approval`,
      payload,
    );
  }

  GetEffectiveDocumentDetailsForRevisionByIdAsync(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-effective-documents-details-by-id`;
    return this.http.get<GenericResponse<any>>(uri, {
      headers: this.getHeaders(),
      params: new HttpParams().set('documentId', Id),
    });
  }
 

  UpdateDraftDocumentRequest(payload: any) {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/update-draft-document-request`,
      payload,
    );
  }

  DownloadDraftDocument(id: any) {
    const uri = `${this.apiUrl}/DMSDocumentRequest/download-draft-document/${id}`;
    return this.http.get(uri, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  GetAllDocumentRequests(
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

    const uri = `${this.apiUrl}/DMSDocumentRequest/get-all-document-request`;
    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  CreateDraftDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/create-draft-document-request`,
      payload,
    );
  }

  SubmitDraftDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/submit-draft-document-request`,
      payload,
    );
  }

  CreateAndSubmitDraftDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/create-and-submit-document-request`,
      payload,
    );
  }

  takeWorkflowActionOnDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/take-workflow-action`,
      payload,
    );
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/create-document-request`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/delete-document-request/${code}`,
    );
  }

  SubmitRivisionDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/submit-revision-document-request`,
      payload,
    );
  }

  CreateAndSubmitRevisionDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocumentRequest/create-and-submit-revision-document-request`,
      payload,
    );
  }

  GetDocumentRevisionHistory(documentId: number | string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocumentRequest/get-document-revision-history`;
    return this.http.get<GenericResponse<any>>(uri, {
      headers: this.getHeaders(),
      params: new HttpParams().set('documentId', documentId),
    });
  }
}
