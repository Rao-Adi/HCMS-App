import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { ApiResponse, Notification } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';
import { NzNotificationService } from 'ng-zorro-antd/notification';
 
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _cabietStructureConfig = new ReplaySubject<Notification[]>(1);

  constructor(
    private notification: NzNotificationService,
    private http: HttpClient,
    private config: AppConfigService,
  ) {}

  get cabietStructureConfig$(): Observable<Notification[]> {
    return this._cabietStructureConfig.asObservable();
  }

  // We make apiUrl a getter. It's only called when needed.
  private get apiUrl(): string {
    if (!this.config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return ''; // Failsafe
    }
    return this.config.baseUrl.replace(/\/$/, '');
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

  getAllNotificationsList(): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSNotification/get-all-notification-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getNotificationById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${this.apiUrl}/DMSNotification/get-notification-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllNotifications(
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

    const uri = `${this.apiUrl}/DMSNotification/get-all-notification`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/DMSNotification/create-notification`,
      payload,
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/DMSNotification/update-notification`,
      payload,
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/DMSNotification/delete-notification/${code}`,
    );
  }

  sendTestNotification(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/DMSNotification/SendTestNotification`, payload, {
      headers: this.getHeaders(),
    });
  }

  createNotification(type: string, notificationTitle: string, description: string): void {
    this.notification.create(type, notificationTitle, description);
  }

  getMyNotifications(isRead:boolean): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/DMSNotification/get-notification-by-code/${isRead}`);
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/DMSNotification/mark-as-read/${notificationId}`,
      {},
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/DMSNotification/mark-all-as-read`,
      {},
    );
  }
}
