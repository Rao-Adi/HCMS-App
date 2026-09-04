import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { ApiResponse, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { EmployeeDraftObservation } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class EmployeeDraftObservationService {
  private _departments: ReplaySubject<EmployeeDraftObservation[]> = new ReplaySubject<
    EmployeeDraftObservation[]
  >(1);

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  get departments$(): Observable<EmployeeDraftObservation[]> {
    return this._departments.asObservable();
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

  // Scoped by (employee, entityType, entityId) -- entityType is 'Document' or 'Request', matching
  // the same values already carried around as modalData.entityType. A draft saved while
  // reviewing one document/request must not resurface when the same employee opens a different
  // one, which is what happened when this was only scoped by employee.
  getDraftObservation(entityType: string, entityId: number): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSEmployeeDraftObservation/get-draft-observation/${entityType}/${entityId}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSEmployeeDraftObservation/save-observation`,
      payload,
    );
  }
}
