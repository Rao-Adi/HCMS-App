import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { catchError, map, Observable, ReplaySubject, switchMap, take, tap, throwError } from 'rxjs';
import { ApiResponse, DocumentAttribute } from '../interfaces/interfaces';
import { NotificationService } from '../notification/notification.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentAttributeService {
  private _cabietStructureConfig = new ReplaySubject<DocumentAttribute[]>(1);

  constructor(private http: HttpClient, private _notification: NotificationService) {}

  get cabietStructureConfig$(): Observable<DocumentAttribute[]> {
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

  getDocumentAttributeList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocumentAttribute/get-all-document-attributes-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDocumentAttributeById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocumentAttribute/get-document-attributes-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDocumentAttribute(
    searchText: string,
    sortBy: 'ASC' | 'DESC',
    sortColumn: string,
    isActive: boolean,
    pageNumber: number,
    pageSize: number
  ): Observable<any> {
    const body = {
      searchText,
      sortBy,
      sortColumn,
      isActive,
      pageNumber,
      pageSize,
    };

    const uri = `${environment.baseUrl}/DMSDocumentAttribute/get-all-document-attributes`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  // create(payload: any) {
  //   return this.http.post(
  //     `${environment.baseUrl}/DMSDocumentAttribute/create-document-attributes`,
  //     payload
  //   );
  // }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentAttribute/create-document-attributes`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentAttribute/update-document-attributes`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDocumentAttribute/delete-document-attributes/${code}`
    );
  }
}
