import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, TrainingPolicy } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class TrainingPolicyService {
  private _cabietStructureConfig = new ReplaySubject<TrainingPolicy[]>(1);

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  get cabietStructureConfig$(): Observable<TrainingPolicy[]> {
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

  GetTrainingPolicyList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSTrainingPolicies/get-all-training-policy-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetTrainingPolicyById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSTrainingPolicies/get-training-policy-by-id/${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetTrainingPolicyByDocumentType(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSTrainingPolicies/get-training-policy-by-document-type/${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllTrainingPolicies(
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

    const uri = `${this.apiUrl}/DMSTrainingPolicies/get-all-training-policy`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSTrainingPolicies/create-training-policy`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSTrainingPolicies/update-training-policy`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSTrainingPolicies/delete-training-policy/${code}`,
    );
  }
}
