import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { NotificationService } from '@app/shared/notification/notification.service';

export interface AppNotification {
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationSignalrService {
  private hubConnection: signalR.HubConnection | undefined;
  private notificationSubject = new Subject<AppNotification>();
  
  // Subscribe to this in your components if you want to update a notification dropdown/list
  public notification$ = this.notificationSubject.asObservable();

  constructor(private _notification: NotificationService) {}

  public startConnection(hubUrl: string): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl) // e.g., 'https://api.yourdomain.com/notificationHub'
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Connection started successfully.');
        this.addReceiveNotificationListener();
      })
      .catch((err:any) => console.error('Error while starting SignalR connection: ', err));
  }

  private addReceiveNotificationListener(): void {
    // 'ReceiveNotification' MUST exactly match the method name invoked by your .NET backend
    this.hubConnection?.on('ReceiveNotification', (notification: AppNotification) => {
      this.notificationSubject.next(notification);
      
      // Instantly show a toast message when the backend pushes a notification
      const type = notification.type || 'info';
      this._notification.createNotification(type, notification.title, notification.message);
    });
  }

  public stopConnection(): void {
    this.hubConnection?.stop().then(() => console.log('SignalR Connection stopped.'));
  }
}