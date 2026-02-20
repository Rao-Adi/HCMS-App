import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, DocumentRequest } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DocumentRequestService {
  private _cabietStructureConfig = new ReplaySubject<DocumentRequest[]>(1);

  constructor(private http: HttpClient) {}

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
    const uri = `${environment.baseUrl}/DMSDocumentRequest/get-all-document-request-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentRequestById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocumentRequest/get-document-request-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentRequestDetailsById(
    companyId: any,
    requestId: any,
  ): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocumentRequest/get-request-details?companyId=${companyId}&requestId=${requestId}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getMyPendingDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentRequest/get-my-pending-request`,
      payload,
    );
  }

  getMyDraftDocumentRequest(companyId: number, userId: any): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocumentRequest/get-my-draft-request?companyId=${companyId}&userId=${userId}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetMyRequestsPendingApproval(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentRequest/get-my-request-pending-approval`,
      payload,
    );
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

    const uri = `${environment.baseUrl}/DMSDocumentRequest/get-all-document-request`;
    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  draftDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentRequest/draft-document-request`,
      payload,
    );
  }

  submitDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentRequest/submit-document-request`,
      payload,
    );
  }

  takeWorkflowActionOnDocumentRequest(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentRequest/take-workflow-action`,
      payload,
    );
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentRequest/create-document-request`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentRequest/update-document-request`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentRequest/delete-document-request/${code}`,
    );
  }
}
