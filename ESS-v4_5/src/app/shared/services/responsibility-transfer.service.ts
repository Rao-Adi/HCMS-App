import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, ResponsibilityTransfer } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

export interface GetMyResponsibilityTransfersDto {
  searchText?: string;
  sortBy?: string; // 'ASC' | 'DESC'
  sortColumn?: string;
  isActive: boolean;
  pageNumber: number;
  pageSize: number;
  status: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  userId?: string | null;
}

export interface ResponsibilityTransferItem {
  id: number;
  createdBy: string;
  employeefromname: string;
  employeetoname: string;
  reasonForTransfer: string;
  effectiveDateFrom: string;
  effectiveDateTo?: string;
  remarks: string;
  actionDate?: string;
  status: number;
}

@Injectable({
  providedIn: 'root',
})
export class ResponsibilityTransferService {
  private _cabietStructureConfig = new ReplaySubject<ResponsibilityTransfer[]>(1);

  constructor(private http: HttpClient,
    private _config: AppConfigService
  ) {}

  get cabietStructureConfig$(): Observable<ResponsibilityTransfer[]> {
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

  getAllResponsibilityTransfersList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSResponsibilityTransfer/get-all-responsibility-transfer-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getResponsibilityTransferById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSResponsibilityTransfer/get-responsibility-transfer-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetMyResponsibilityTransfersApprovals(
    payload: GetMyResponsibilityTransfersDto
  ): Observable<GenericResponse<any>> { 
    const uri = `${this.apiUrl}/DMSTransferWorkflowPolicy/get-my-responsibility-transfers-approvals`;

    return this.http.post<GenericResponse<any>>(uri, payload, {
      headers: this.getHeaders(),
    });
  }

  GetMySubmittedResponsibilityTransfers(
    payload: GetMyResponsibilityTransfersDto
  ): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSTransferWorkflowPolicy/get-my-submitted-responsibility-transfers`;

    return this.http.post<GenericResponse<any>>(uri, payload, {
      headers: this.getHeaders(),
    });
  }

  takeAction(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSResponsibilityTransfer/take-action`,
      payload
    );
  }



  GetAllResponsibilityTransfers(payload: any): Observable<any> { 
    const body = {
      searchText: payload.searchText,
      sortBy: payload.sortBy,
      sortColumn: payload.sortColumn,
      isActive: payload.isActive,
      pageNumber: payload.pageNumber,
      pageSize: payload.pageSize,
    };

    const uri = `${this.apiUrl}/DMSResponsibilityTransfer/get-all-responsibility-transfer`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSResponsibilityTransfer/create-responsibility-transfer`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSResponsibilityTransfer/update-responsibility-transfer`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSResponsibilityTransfer/delete-responsibility-transfer/${code}`
    );
  }
}
