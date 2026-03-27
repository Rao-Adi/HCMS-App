import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, WorkflowStep } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

@Injectable({
  providedIn: 'root',
})
export class WorkflowStepService {
  private _cabietStructureConfig = new ReplaySubject<WorkflowStep[]>(1);

  constructor(private http: HttpClient,
    private _config: AppConfigService
  ) {}

  get cabietStructureConfig$(): Observable<WorkflowStep[]> {
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

  getWorkflowStepList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSWorkflowStep/get-all-workflow-step-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getWorkflowStepByDocumentTypeCode(payload:any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSWorkflowStep/get-workflow-step-by-document-code`,
      payload
    );
  }


  getPendingApprovals(companyId: number, userId:number): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSWorkflowStep/get-pending-approvals/${companyId}/${userId}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllWorkflowSteps(
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

    const uri = `${this.apiUrl}/DMSWorkflowStep/get-all-workflow-step`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSWorkflowStep/create-workflow-step`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSWorkflowStep/update-workflow-step`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSWorkflowStep/delete-workflow-step/${code}`
    );
  }
}
