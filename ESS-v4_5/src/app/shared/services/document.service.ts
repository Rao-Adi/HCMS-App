import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, Document } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private _cabietStructureConfig = new ReplaySubject<Document[]>(1);

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  get cabietStructureConfig$(): Observable<Document[]> {
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

  getDocumentList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocument/get-all-document-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getMyDocumentCounts(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocument/get-my-document-counts`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocument/get-document-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetApprovedRequestForDocumentCreation(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/get-approved-request-for-document-creation`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  GerFinalizedDocumentByRequestId(requestId: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocument/get-draft-by-request/${requestId}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  approveDocument(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/approve-document`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  submitDocument(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/DMSDocument/submit-document`, payload, {
      headers: this.getHeaders(),
    });
  }

  rejectDocument(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/DMSDocument/reject-document`, payload, {
      headers: this.getHeaders(),
    });
  }

  revertDocument(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/send-back-for-rework`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  GetPendingAuthorizations(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/get-pending-authorizations`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  GetDocumentsPendingTrainingAcknowledgmentAsync(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/get-documents-pending-training`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  GetAllDocumentPendingApprovals(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/get-documents-pending-approval`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  GetApprovedEffectiveDocuments(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/get-approved-effective-documents`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  GetMyDocumentCounts(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSDocument/get-my-document-counts`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  AuthorizeDocumentPostTraining(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/authorize-document-post-training`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  //This method is for Pending,Approved and Revision of Existing Document as well.
  GetDocumentByStatus(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSDocument/get-document-by-status`,
      payload,
      { headers: this.getHeaders() },
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

    const uri = `${this.apiUrl}/DMSDocument/get-all-document`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/DMSDocument/create-document`, payload);
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/DMSDocument/update-document`, payload);
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/DMSDocument/delete-document/${code}`);
  }

  DownloadDocumentTemplate(id: any) {
    const uri = `${this.apiUrl}/DMSDocument/download-submitted-document-template/${id}`;
    return this.http.get(uri, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  /**
   * Uploads the CSV file for bulk metadata import.
   * Connects to: BulkImportDocumentMetadataAsync(IFormFile csvFile)
   *
   * @param csvFile The CSV File object selected from an <input type="file">
   * @returns An observable of string array containing import logs/results
   */
  bulkImportDocumentMetadata(csvFile: File): Observable<string[]> {
    const formData = new FormData();

    // The key 'csvFile' MUST match the parameter name defined in your C# Controller.
    // e.g. public async Task<IActionResult> ImportMetadata(IFormFile csvFile)
    formData.append('csvFile', csvFile, csvFile.name);

    return this.http.post<string[]>(`${this.apiUrl}/DMSDocument/bulk-import-metadata`, formData);
  }

  /**
   * Uploads multiple physical files to attach to previously imported metadata.
   * Connects to: BulkUploadDocumentFilesAsync(List<IFormFile> files)
   *
   * @param files An array of File objects selected from an <input type="file" multiple>
   * @returns An observable of string array containing upload logs/results
   */
  bulkUploadDocumentFiles(files: File[]): Observable<string[]> {
    const formData = new FormData();

    // The key 'files' MUST match the parameter name defined in your C# Controller.
    // e.g. public async Task<IActionResult> UploadBulkFiles(List<IFormFile> files)
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return this.http.post<string[]>(`${this.apiUrl}/DMSDocument/bulk-upload-files`, formData);
  }

  DownloadBulkMetadataTemplate(): Observable<any> {
    const uri = `${this.apiUrl}/DMSDocument/download-bulk-upload-template`;
    return this.http.get(uri, {
      observe: 'response',
      responseType: 'blob',
    });
  }
}
