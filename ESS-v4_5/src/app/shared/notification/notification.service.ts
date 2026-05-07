import { Component, Injectable } from '@angular/core';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationToastService {
    
  constructor(private notification: NzNotificationService) {}

  createNotification(type: string, notificationTitle: string, description: string): void {
    this.notification.create(type, notificationTitle, description);
  }
}
