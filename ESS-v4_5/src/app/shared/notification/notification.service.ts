import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationToastService {
  private lastBackendError: string | null = null;
  private errorTimeout: any = null;

  constructor(private notification: NzNotificationService) {}

  setLastBackendError(errorMessage: string | null): void {
    this.lastBackendError = errorMessage;

    // Auto-clear after 2 seconds to prevent leaking to unrelated notifications
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    if (errorMessage) {
      this.errorTimeout = setTimeout(() => {
        this.lastBackendError = null;
      }, 2000);
    }
  }

  createNotification(type: string, notificationTitle: string, description: string): void {
    let finalDescription = description;

    if (type === 'error' && this.lastBackendError) {
      // Avoid duplicating if the description already contains the backend error
      const normalizedDesc = (description || '').toLowerCase();
      const normalizedErr = this.lastBackendError.toLowerCase();

      if (!normalizedDesc.includes(normalizedErr)) {
        if (description) {
          finalDescription = `${description}\n\nDetails: ${this.lastBackendError}`;
        } else {
          finalDescription = this.lastBackendError;
        }
      }
      this.lastBackendError = null; // Clear after use
    }

    this.notification.create(type, notificationTitle, finalDescription);
  }
}
