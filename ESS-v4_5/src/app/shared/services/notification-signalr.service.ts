// import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import * as signalR from '@microsoft/signalr';
// import { Subject } from 'rxjs';
// import { NotificationService } from './notification.service';

// export interface AppNotification {
//   title: string;
//   message: string;
//   type?: 'success' | 'info' | 'warning' | 'error';
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class NotificationSignalrService {
//   private hubConnection: signalR.HubConnection | undefined;
//   private notificationSubject = new Subject<AppNotification>();

//   // Subscribe to this in your components if you want to update a notification dropdown/list
//   public notification$ = this.notificationSubject.asObservable();

//   constructor(
//     private _notificationService: NotificationService,
//     @Inject(PLATFORM_ID) private platformId: Object,
//     private ngZone: NgZone
//   ) {}

//   public startConnection(hubUrl: string, token: string = ''): void {
//     // 1. Production safety: Prevent running SignalR during Angular SSR (Server-Side Rendering)
//     if (!isPlatformBrowser(this.platformId)) {
//       console.log('[SignalR] Skipping connection attempt on the server (SSR).');
//       return;
//     }

//     // 2. Production safety: Prevent starting multiple concurrent connections
//     if (
//       this.hubConnection &&
//       this.hubConnection.state !== signalR.HubConnectionState.Disconnected
//     ) {
//       console.log(`[SignalR] Connection already exists. State: ${this.hubConnection.state}`);
//       return;
//     }

//     console.log(`[SignalR] Attempting to connect to Hub: ${hubUrl}`);

//     const options: signalR.IHttpConnectionOptions = {
//       withCredentials: true // Extremely important if backend auth uses cookies
//     };
//     if (token) {
//       options.accessTokenFactory = () => token;
//     }

//     try {
//       this.hubConnection = new signalR.HubConnectionBuilder()
//         .withUrl(hubUrl, options)
//         .withAutomaticReconnect()
//         .withServerTimeout(60000) // Increase timeout to 60 seconds
//         .withKeepAliveInterval(30000) // Increase keep-alive to 30 seconds
//         .configureLogging(signalR.LogLevel.Debug) // Set to Debug to see full negotiation details
//         .build();
//     } catch (error) {
//       console.error('[SignalR] Failed to build connection:', error);
//       return;
//     }

//     // Setup lifecycle event listeners
//     this.hubConnection.onreconnecting((error) => {
//       console.warn(`[SignalR] Connection lost. Reconnecting...`, error);
//     });

//     this.hubConnection.onreconnected((connectionId) => {
//       console.log(`[SignalR] Reconnected successfully. Connection ID: ${connectionId}`);
//     });

//     this.hubConnection.onclose((error) => {
//       console.error(`[SignalR] Connection closed.`, error);
//     });

//     // 3. Register event handlers BEFORE calling start()
//     this.addReceiveNotificationListener();

//     this.hubConnection
//       .start()
//       .then(() => {
//         console.log('[SignalR] Connection started successfully!');
//       })
//       .catch((err: any) => console.error('[SignalR] Error while starting connection: ', err));
//   }

//   private addReceiveNotificationListener(): void {
//     // 'ReceiveNotification' MUST exactly match the method name invoked by your .NET backend
//     this.hubConnection?.on('ReceiveNotification', (arg1: any, arg2?: string, arg3?: string) => {
//       // 4. Run inside Angular's Zone so the UI updates in real-time without needing a manual user interaction
//       this.ngZone.run(() => {
//         console.log('[SignalR] Notification received from backend: ', arg1, arg2, arg3);

//         let title = 'Notification';
//         let message = '';
//         let type = 'info';

//         // Handle both object payload and separate string arguments
//         if (arg1 && typeof arg1 === 'object') {
//           title = arg1.title || arg1.Title || 'Notification';
//           message = arg1.message || arg1.Message || '';
//           type = (arg1.type || arg1.Type || 'info').toLowerCase();
//         } else if (arg2 === undefined && arg3 === undefined) {
//           // Fallback if backend just sends a single string message
//           message = arg1 || '';
//         } else {
//           title = arg1 || 'Notification';
//           message = arg2 || '';
//           type = (arg3 || 'info').toLowerCase();
//         }

//         const mappedNotif: AppNotification = {
//           title,
//           message,
//           type: (type === 'success' || type === 'warning' || type === 'error') ? type : 'info',
//         };

//         this.notificationSubject.next(mappedNotif);

//         // Instantly show a toast message when the backend pushes a notification
//         this._notificationService.createNotification(
//           mappedNotif.type!,
//           mappedNotif.title,
//           mappedNotif.message,
//         );
//       });
//     });
//   }

//   public stopConnection(): void {
//     this.hubConnection?.stop().then(() => console.log('[SignalR] Connection stopped manually.'));
//   }

//   // --- TEMPORARY METHOD FOR TESTING: Remove after SSO integration ---
//   public simulateTestNotification(notification: AppNotification): void {
//     if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
//       console.log('[SignalR] Sending test notification to backend Hub to broadcast...');
//       this.hubConnection
//         .invoke(
//           'SendTestNotification',
//           notification.title,
//           notification.message,
//           notification.type || 'info',
//         )
//         .catch((err: any) => console.error('[SignalR] Error sending test notification: ', err));
//     } else {
//       console.log('[SignalR] Not connected. Simulating locally instead: ', notification);
//       const mappedNotif: AppNotification = {
//         title: notification.title || (notification as any).Title,
//         message: notification.message || (notification as any).Message,
//         type: (notification.type || (notification as any).Type || 'info').toLowerCase() as any,
//       };
//       this.notificationSubject.next(mappedNotif);
//       this._notificationService.createNotification(
//         mappedNotif.type!,
//         mappedNotif.title,
//         mappedNotif.message,
//       );
//     }
//   }
// }
import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service'; // Your existing UI notification service (e.g., ng-zorro)

/**
 * Defines the structure for a notification object used within the Angular app.
 */
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
  private loginId: string = '';

  /**
   * Observable for components to subscribe to for real-time notification updates.
   * Ideal for updating a notification dropdown or list.
   */
  public notification$ = this.notificationSubject.asObservable();

  constructor(
    private _notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {}

  /**
   * Starts the SignalR connection to the specified hub URL.
   * @param hubUrl The full URL of the SignalR hub.
   * @param token The JWT authentication token.
   */
  public startConnection(hubUrl: string, token: string = '', loginId: string = ''): void {
    const cleanLoginId = (loginId || '').trim();
    this.loginId = cleanLoginId && cleanLoginId !== 'null' && cleanLoginId !== 'undefined' ? cleanLoginId : '';

    // 1. Production safety: Prevent running SignalR during Angular SSR.
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SignalR] Skipping connection attempt on the server (SSR).');
      return;
    }

    // 2. Production safety: Prevent starting multiple concurrent connections.
    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      console.log(`[SignalR] Connection already exists. State: ${this.hubConnection.state}`);
      return;
    }

    // Append login query parameter for Option B fallback
    let finalHubUrl = hubUrl;
    if (this.loginId) {
      const separator = hubUrl.includes('?') ? '&' : '?';
      finalHubUrl = `${hubUrl}${separator}login=${encodeURIComponent(this.loginId)}`;
    }

    console.log(`[SignalR] Attempting to connect to Hub: ${finalHubUrl}`);

    const options: signalR.IHttpConnectionOptions = {
      // Use the token factory for secure, up-to-date tokens.
      accessTokenFactory: () => token,
    };

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(finalHubUrl, options)
        .withAutomaticReconnect([0, 2000, 10000, 30000]) // More robust reconnect strategy
        .configureLogging(signalR.LogLevel.Information) // Use Information for production, Debug for development
        .build();
    } catch (error) {
      console.error('[SignalR] Failed to build connection:', error);
      return;
    }

    // 3. Register event handlers BEFORE calling start().
    this.addLifecycleEventListeners();
    this.addReceiveNotificationListener();

    // 4. Start the connection.
    this.hubConnection
      .start()
      .then(() => {
        console.log('[SignalR] Connection started successfully!');
        // 5. CRITICAL: Register client for targeted notifications.
        if (this.loginId) {
          this.registerClient(this.loginId);
        } else {
          this.joinUserGroup();
        }
      })
      .catch((err: any) => console.error('[SignalR] Error while starting connection: ', err));
  }

  /**
   * Stops the SignalR connection.
   */
  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => console.log('[SignalR] Connection stopped manually.'));
    }
  }

  /**
   * Invokes the 'MarkAsRead' method on the backend hub for a single notification.
   * @param notificationId The ID of the notification to mark as read.
   */
  public markAsRead(notificationId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject('SignalR connection is not established.');
    }
    // Method name must exactly match the C# Hub method.
    return this.hubConnection.invoke('MarkAsRead', notificationId);
  }

  /**
   * Invokes the 'MarkAllAsRead' method on the backend hub.
   */
  public markAllAsRead(): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject('SignalR connection is not established.');
    }
    return this.hubConnection.invoke('MarkAllAsRead');
  }

  /**
   * Sets up listeners for hub connection lifecycle events.
   */
  private addLifecycleEventListeners(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting((error) => {
      console.warn(`[SignalR] Connection lost. Reconnecting...`, error);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log(`[SignalR] Reconnected successfully. Connection ID: ${connectionId}`);
      // After reconnecting, rejoin/re-register to ensure message delivery.
      if (this.loginId) {
        this.registerClient(this.loginId);
      } else {
        this.joinUserGroup();
      }
    });

    this.hubConnection.onclose((error) => {
      console.error(`[SignalR] Connection closed.`, error);
    });
  }

  /**
   * Sets up the listener for the 'ReceiveNotification' event from the backend.
   */
  private addReceiveNotificationListener(): void {
    if (!this.hubConnection) return;

    // 'ReceiveNotification' MUST exactly match the method name invoked by your .NET backend.
    this.hubConnection.on('ReceiveNotification', (payload: any) => {
      // Run inside Angular's Zone so the UI updates in real-time.
      this.ngZone.run(() => {
        console.log('[SignalR] Notification received from backend: ', payload);

        // Flexible payload handling (case-insensitive properties).
        const title = payload.title || payload.Title || 'Notification';
        const message = payload.message || payload.Message || 'You have a new notification.';
        const type = (payload.type || payload.Type || 'info').toLowerCase();

        const mappedNotif: AppNotification = {
          title,
          message,
          type: (type === 'success' || type === 'warning' || type === 'error') ? type : 'info',
        };

        // Push the notification to any subscribed components (e.g., a notification bell).
        this.notificationSubject.next(mappedNotif);

        // Instantly show a toast message.
        this._notificationService.createNotification(
          mappedNotif.type!,
          mappedNotif.title,
          mappedNotif.message
        );
      });
    });
  }

  /**
   * Invokes the 'JoinUserGroup' method on the hub to subscribe to user-specific notifications.
   */
  private joinUserGroup(): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection
        .invoke('JoinUserGroup')
        .then(() => console.log('[SignalR] Successfully joined user-specific group.'))
        .catch((err) => console.error('[SignalR] Error joining user group: ', err));
    }
  }

  /**
   * Invokes the 'RegisterClient' method on the hub to register with user-specific login identifier.
   */
  private registerClient(loginId: string): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection
        .invoke('RegisterClient', loginId)
        .then(() => console.log(`[SignalR] Successfully registered client with loginId: ${loginId}`))
        .catch((err) => console.error('[SignalR] Error registering client: ', err));
    }
  }
}
