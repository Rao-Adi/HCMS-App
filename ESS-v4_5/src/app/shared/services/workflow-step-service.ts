import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, WorkflowStep } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class WorkflowStepService {
  private _cabietStructureConfig = new ReplaySubject<WorkflowStep[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<WorkflowStep[]> {
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

  getWorkflowStepList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSWorkflowStep/get-all-workflow-step-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getWorkflowStepByDocumentTypeCode(payload:any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSWorkflowStep/get-workflow-step-by-document-code`,
      payload
    );
  }


  getPendingApprovals(companyId: number, userId:number): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSWorkflowStep/get-pending-approvals/${companyId}/${userId}`;
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

    const uri = `${environment.baseUrl}/DMSWorkflowStep/get-all-workflow-step`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSWorkflowStep/create-workflow-step`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.baseUrl}/DMSWorkflowStep/update-workflow-step`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSWorkflowStep/delete-workflow-step/${code}`
    );
  }
}
