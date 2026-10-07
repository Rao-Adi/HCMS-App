import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { catchError, forkJoin, of } from 'rxjs';
import { NotificationService } from '@app/shared/services/notification.service';

export interface NotificationsModalData {
  /** Called whenever the unread total changes here, so the bell badge and dropdown follow. */
  onChange: (unreadCount: number) => void;
  /** Opens the page a notification points at -- the same routine the bell dropdown uses. */
  navigate: (notification: ModalNotification) => void;
}

export interface ModalNotification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType?: string;
  redirectionUrl?: string;
}

type NotificationTab = 'all' | 'unread' | 'read';

// The modal behind "View all notifications": every notification, read and unread, in one place,
// with Mark all as read and a jump to the page each one is about. The bell dropdown only ever
// holds the tab it is showing; this holds both so the person can see their whole history.
@Component({
  selector: 'app-notifications-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-modal.html',
  styleUrl: './notifications-modal.css',
})
export class NotificationsModalComponent implements OnInit {
  readonly pageSize = 50;

  items: ModalNotification[] = [];
  activeTab: NotificationTab = 'all';
  visibleCount = this.pageSize;
  loading = true;
  loadFailed = false;
  markingAll = false;

  constructor(
    private notificationService: NotificationService,
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) private data: NotificationsModalData,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get unreadCount(): number {
    return this.items.filter((n) => !n.isRead).length;
  }

  get readCount(): number {
    return this.items.length - this.unreadCount;
  }

  get filtered(): ModalNotification[] {
    switch (this.activeTab) {
      case 'unread':
        return this.items.filter((n) => !n.isRead);
      case 'read':
        return this.items.filter((n) => n.isRead);
      default:
        return this.items;
    }
  }

  get visible(): ModalNotification[] {
    return this.filtered.slice(0, this.visibleCount);
  }

  setTab(tab: NotificationTab): void {
    this.activeTab = tab;
    this.visibleCount = this.pageSize;
  }

  showMore(): void {
    this.visibleCount += this.pageSize;
  }

  load(): void {
    this.loading = true;
    this.loadFailed = false;

    // The API answers 404 "Notifications not found" when a list is empty -- that is an empty
    // list here, not a failure. Only both calls failing is reported.
    let failures = 0;
    const safe = (isRead: boolean) =>
      this.notificationService.getMyNotifications(isRead).pipe(
        catchError((err) => {
          if (err?.status !== 404) failures++;
          return of(null);
        }),
      );

    forkJoin([safe(false), safe(true)]).subscribe(([unread, read]) => {
      const rows = [...this.toList(unread), ...this.toList(read)];
      // Newest first across both lists.
      rows.sort((a, b) => this.timeOf(b.createdAt) - this.timeOf(a.createdAt));
      this.items = rows;
      this.loadFailed = failures === 2;
      this.loading = false;
      this.data.onChange(this.unreadCount);
    });
  }

  private toList(res: any): ModalNotification[] {
    if (!res?.Success || !res.Data) return [];
    const rows = Array.isArray(res.Data) ? res.Data : [res.Data];
    return rows.map((n: any) => ({
      id: n.id ?? n.Id,
      title: n.title || n.Title || '',
      message: n.message || n.Message || '',
      isRead: n.IsRead !== undefined ? !!n.IsRead : !!n.isRead,
      createdAt: n.createdAt || n.CreatedAt || '',
      relatedEntityType: n.RelatedEntityType || n.relatedEntityType,
      redirectionUrl: n.RedirectionUrl || n.redirectionUrl,
    }));
  }

  markAllAsRead(): void {
    if (this.markingAll || this.unreadCount === 0) return;
    this.markingAll = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.items.forEach((n) => (n.isRead = true));
        this.markingAll = false;
        this.data.onChange(0);
      },
      error: () => {
        this.markingAll = false;
      },
    });
  }

  open(notification: ModalNotification): void {
    if (!notification.isRead) {
      notification.isRead = true;
      if (notification.id) this.notificationService.markAsRead(notification.id).subscribe();
      this.data.onChange(this.unreadCount);
    }
    this.modalRef.close();
    this.data.navigate(notification);
  }

  close(): void {
    this.modalRef.close();
  }

  // The API sends CreatedAt as UTC without an offset -- the same reading the bell dropdown uses.
  private parse(value?: string): Date | null {
    if (!value) return null;
    const iso = value.replace(' ', 'T');
    const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + 'Z');
    return isNaN(date.getTime()) ? null : date;
  }

  private timeOf(value?: string): number {
    return this.parse(value)?.getTime() ?? 0;
  }

  absoluteTime(value?: string): string {
    const date = this.parse(value);
    return date
      ? date.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
  }

  relativeTime(value?: string): string {
    const date = this.parse(value);
    if (!date) return '';
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  trackById(_: number, n: ModalNotification): number {
    return n.id;
  }
}
