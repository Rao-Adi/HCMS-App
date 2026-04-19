import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service';

export interface AppNotification {
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationSignalrService {
  private hubConnection: signalR.HubConnection | undefined;
  private notificationSubject = new Subject<AppNotification>();

  // Subscribe to this in your components if you want to update a notification dropdown/list
  public notification$ = this.notificationSubject.asObservable();

  constructor(
    private _notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  public startConnection(hubUrl: string, token: string = ''): void {
    // 1. Production safety: Prevent running SignalR during Angular SSR (Server-Side Rendering)
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SignalR] Skipping connection attempt on the server (SSR).');
      return;
    }

    // 2. Production safety: Prevent starting multiple concurrent connections
    if (
      this.hubConnection &&
      this.hubConnection.state !== signalR.HubConnectionState.Disconnected
    ) {
      console.log(`[SignalR] Connection already exists. State: ${this.hubConnection.state}`);
      return;
    }

    console.log(`[SignalR] Attempting to connect to Hub: ${hubUrl}`);

    const options: signalR.IHttpConnectionOptions = {};
    if (token) {
      options.accessTokenFactory = () => token;
    }

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, options)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Debug) // Set to Debug to see full negotiation details
        .build();
    } catch (error) {
      console.error('[SignalR] Failed to build connection:', error);
      return;
    }

    // Setup lifecycle event listeners
    this.hubConnection.onreconnecting((error) => {
      console.warn(`[SignalR] Connection lost. Reconnecting...`, error);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log(`[SignalR] Reconnected successfully. Connection ID: ${connectionId}`);
    });

    this.hubConnection.onclose((error) => {
      console.error(`[SignalR] Connection closed.`, error);
    });

    this.hubConnection
      .start()
      .then(() => {
        console.log('[SignalR] Connection started successfully!');
        this.addReceiveNotificationListener();
      })
      .catch((err: any) => console.error('[SignalR] Error while starting connection: ', err));
  }

  private addReceiveNotificationListener(): void {
    // 'ReceiveNotification' MUST exactly match the method name invoked by your .NET backend
    this.hubConnection?.on('ReceiveNotification', (notification: any) => {
      console.log('[SignalR] Notification received from backend: ', notification);

      const mappedNotif: AppNotification = {
        title: notification.title || notification.Title,
        message: notification.message || notification.Message,
        type: (notification.type || notification.Type || 'info').toLowerCase(),
      };

      this.notificationSubject.next(mappedNotif);

      // Instantly show a toast message when the backend pushes a notification
      this._notificationService.createNotification(
        mappedNotif.type!,
        mappedNotif.title,
        mappedNotif.message,
      );
    });
  }

  public stopConnection(): void {
    this.hubConnection?.stop().then(() => console.log('[SignalR] Connection stopped manually.'));
  }

  // --- TEMPORARY METHOD FOR TESTING: Remove after SSO integration ---
  public simulateTestNotification(notification: AppNotification): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('[SignalR] Sending test notification to backend Hub to broadcast...');
      this.hubConnection
        .invoke(
          'SendTestNotification',
          notification.title,
          notification.message,
          notification.type || 'info',
        )
        .catch((err: any) => console.error('[SignalR] Error sending test notification: ', err));
    } else {
      console.log('[SignalR] Not connected. Simulating locally instead: ', notification);
      const mappedNotif: AppNotification = {
        title: notification.title || notification.title,
        message: notification.message || notification.message,
        type: (notification.type || notification.type || 'info').toLowerCase() as any,
      };
      this.notificationSubject.next(mappedNotif);
      this._notificationService.createNotification(
        mappedNotif.type!,
        mappedNotif.title,
        mappedNotif.message,
      );
    }
  }
}
