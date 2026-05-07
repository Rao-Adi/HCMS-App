import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
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
    private ngZone: NgZone
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

    const options: signalR.IHttpConnectionOptions = {
      withCredentials: true // Extremely important if backend auth uses cookies
    };
    if (token) {
      options.accessTokenFactory = () => token;
    }

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, options)
        .withAutomaticReconnect()
        .withServerTimeout(60000) // Increase timeout to 60 seconds
        .withKeepAliveInterval(30000) // Increase keep-alive to 30 seconds
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

    // 3. Register event handlers BEFORE calling start()
    this.addReceiveNotificationListener();

    this.hubConnection
      .start()
      .then(() => {
        console.log('[SignalR] Connection started successfully!');
      })
      .catch((err: any) => console.error('[SignalR] Error while starting connection: ', err));
  }

  private addReceiveNotificationListener(): void {
    // 'ReceiveNotification' MUST exactly match the method name invoked by your .NET backend
    this.hubConnection?.on('ReceiveNotification', (arg1: any, arg2?: string, arg3?: string) => {
      // 4. Run inside Angular's Zone so the UI updates in real-time without needing a manual user interaction
      this.ngZone.run(() => {
        console.log('[SignalR] Notification received from backend: ', arg1, arg2, arg3);

        let title = 'Notification';
        let message = '';
        let type = 'info';

        // Handle both object payload and separate string arguments
        if (arg1 && typeof arg1 === 'object') {
          title = arg1.title || arg1.Title || 'Notification';
          message = arg1.message || arg1.Message || '';
          type = (arg1.type || arg1.Type || 'info').toLowerCase();
        } else if (arg2 === undefined && arg3 === undefined) {
          // Fallback if backend just sends a single string message
          message = arg1 || '';
        } else {
          title = arg1 || 'Notification';
          message = arg2 || '';
          type = (arg3 || 'info').toLowerCase();
        }

        const mappedNotif: AppNotification = {
          title,
          message,
          type: (type === 'success' || type === 'warning' || type === 'error') ? type : 'info',
        };

        this.notificationSubject.next(mappedNotif);

        // Instantly show a toast message when the backend pushes a notification
        this._notificationService.createNotification(
          mappedNotif.type!,
          mappedNotif.title,
          mappedNotif.message,
        );
      });
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
        title: notification.title || (notification as any).Title,
        message: notification.message || (notification as any).Message,
        type: (notification.type || (notification as any).Type || 'info').toLowerCase() as any,
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
