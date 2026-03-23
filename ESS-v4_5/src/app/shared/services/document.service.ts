import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, Document } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private _cabietStructureConfig = new ReplaySubject<Document[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<Document[]> {
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

  getDocumentList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocument/get-all-document-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocument/get-document-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetApprovedRequestForDocumentCreation(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/get-approved-request-for-document-creation`,
      payload,
    );
  }

  GerFinalizedDocumentByRequestId(
    companyId: string,
    requestId: string,
  ): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocument/get-draft-by-request/${companyId}/${requestId}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  approveDocument(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/approve-document`,
      payload,
    );
  }

  submitDocument(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/submit-document`,
      payload,
    );
  }

  rejectDocument(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/reject-document`,
      payload,
    );
  }

  revertDocument(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/send-back-for-rework`,
      payload,
    );
  }

  //This method is for Pending,Approved and Revision of Existing Document as well.
  GetDocumentByStatus(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/get-document-by-status`,
      payload,
    );
  }


  GetAllDocument(
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

    const uri = `${environment.baseUrl}/DMSDocument/get-all-document`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/create-document`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/update-document`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocument/delete-document/${code}`,
    );
  }

    DownloadDocumentTemplate(id: any) {
    const uri = `${environment.baseUrl}/DMSDocument/download-submitted-document-template/${id}`;
    return this.http.get(uri, { 
      observe: 'response',
      responseType: 'blob' 
    });
  }
  
}
