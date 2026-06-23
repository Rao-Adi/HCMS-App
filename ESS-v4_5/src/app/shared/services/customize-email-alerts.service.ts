import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { ApiResponse, ControlType, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { AppConfigService } from '@app/core/services/app-config';
// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class CustomizeEmailAlertService {
  private _divisions: ReplaySubject<ControlType[]> = new ReplaySubject<ControlType[]>(1);

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

  get divisions$(): Observable<ControlType[]> {
    return this._divisions.asObservable();
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

  getCustomizeEmailAlertList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSCustomizeEmailAlerts/get-all-email-alerts-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getCustomizeEmailAlertById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSCustomizeEmailAlerts/get-email-alert-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllCustomizeEmailAlerts(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSCustomizeEmailAlerts/get-all-email-alerts`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSCustomizeEmailAlerts/create-email-alert`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSCustomizeEmailAlerts/update-email-alert`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSCustomizeEmailAlerts/delete-email-alert/${code}`,
    );
  }
}
