import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostBinding,
  HostListener,
  inject,
  Signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription, fromEvent, Observable } from 'rxjs';

import { MenuComponent, MenuItem } from '../menu/menu.component';
import { DataService } from '@app/core/services/data.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { AppConfigService } from '@app/core/services/app-config';
import { SpinnerService } from '@app/core/services/spinner.service';
import { MatDialog } from '@angular/material/dialog';
import { AboutPopupComponent } from '../about-popup/about-popup';

import {
  NotificationSignalrService,
  AppNotification,
} from '@app/shared/services/notification-signalr.service';
import { SpinnerComponent } from '@app/shared/spinner/spinner.component';
import { SkeletonComponent } from '@app/shared/skeleton/skeleton.component';
import { NotificationService } from '@app/shared/services/notification.service';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { DocumentService } from '@app/shared/services/document.service';

interface HeaderDetailsResponse {
  formName: string;
  FormId: string;
  IsFavorite: boolean;
  FormLocation: string;
  formdescription: string;
}

interface DisplayNotification extends AppNotification {
  id?: number;
  isRead: boolean;
  createdAt?: string;
  relatedEntityType?: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MenuComponent,
    SpinnerComponent,
    SkeletonComponent
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css'],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  readonly dialog = inject(MatDialog);
  @ViewChild(MenuComponent) menuComponent!: MenuComponent;

  // --- UI & State Properties ---
  formName: string = '';
  currentFormId: string = ''; 
  formdescription: string = '';
  showdesc: boolean = false;
  showfavourite: boolean = false;
  addedfavourite: boolean = false;
  favPath: string = '/assets/images/favourites.png';
  favPath2: string = '/assets/images/favourites-active.png';
  toolTipText: string = 'Add to Favorites';
  FavMenuText: string = 'Mark as Favorite';
  isDelete: boolean = false;
  showfavouriteicon: boolean = false;
  EmpID: string = '0';
  CompanyName: string = 'Your Company';
  EmpName: string = 'Employee Name';
  EmployeePic: string = '/assets/images/pro.png';
  strBreadCrumb: string = 'Home / Dashboard';
  
  @HostBinding('class.sidebar-open')
  isSidebarOpen: boolean = false;
  
  haveDashboardRights: boolean = true;
  onlineEvent$: Observable<Event> | undefined;
  offlineEvent$: Observable<Event> | undefined;
  subscriptions: Subscription[] = [];
  connectionStatusMessage: string = '';
  connectionStatus: string = 'online';
  showStatusMessage: boolean = false;
  isSidebarHovering = false;
  
  // --- Notification Properties ---
  notifications: DisplayNotification[] = [];
  unreadNotificationCount: number = 0;
  isNotificationOpen: boolean = false;
  isProfileOpen: boolean = false;
  LoginEmpId: string = '';
  isRead: boolean = false;
  activeNotificationTab: 'unread' | 'read' = 'unread';

  get filteredNotifications(): DisplayNotification[] {

    return this.notifications.filter((n) =>

      this.activeNotificationTab === 'unread' ? !n.isRead : n.isRead,

    );

  }

  // --- Menu Context Properties ---
  private _pendingFormId: string | null = null;
  private _menuItems: MenuItem[] = [];

  private spinnerService = inject(SpinnerService);
  public isLoading: Signal<boolean> = this.spinnerService.isLoading.asReadonly();

  private get apiUrl(): string {
    if (!this._config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl.');
      return '';
    }
    // Safely remove any trailing slashes to prevent malformed URLs downstream
    return this._config.baseUrl.replace(/\/$/, '');
  }

  

  constructor(
    private _utilityService: UtilitiesService,
    private _dataService: DataService,
    private router: Router,
    private _config: AppConfigService,
    private cdRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private notificationSignalrService: NotificationSignalrService,
    private notificationHttpService: NotificationService,
    private _documentRequestService: DocumentRequestService,
    private _documentService: DocumentService,
  ) {}

  ngOnInit(): void {
    this.GetLoginEmpId();
    this.loadInitialData();

    // Online/Offline Detection
    if (typeof window !== 'undefined') {
      this.onlineEvent$ = fromEvent(window, 'online');
      this.offlineEvent$ = fromEvent(window, 'offline');
      this.subscriptions.push(this.onlineEvent$.subscribe(() => this.updateConnectionStatus(true)));
      this.subscriptions.push(this.offlineEvent$.subscribe(() => this.updateConnectionStatus(false)));
      this.updateConnectionStatus(navigator.onLine);
    }

    // SignalR Setup
    let hubBaseUrl = this.apiUrl;
    if (hubBaseUrl.endsWith('/api')) {
      hubBaseUrl = hubBaseUrl.substring(0, hubBaseUrl.length - 4);
    }
    const hubUrl = `${hubBaseUrl}/notificationHub`;

    let token = '';
    if (typeof window !== 'undefined' && localStorage) {
      // Check multiple common keys in case the token is stored under a different name
      token = localStorage.getItem('token') || localStorage.getItem('Token') || localStorage.getItem('access_token') || '';
      
      // Prevent "Bearer Bearer eyJ..." errors:
      // SignalR's accessTokenFactory automatically prepends "Bearer " in the header.
      // If the stored token already contains "Bearer ", we must strip it.
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
    }

    console.log(`[SignalR Init] Connecting to: ${hubUrl} | Token Present: ${!!token}`);
    this.notificationSignalrService.startConnection(hubUrl, token);

    this.subscriptions.push(
      this.notificationSignalrService.notification$.subscribe((notification: AppNotification) => {
        this.notifications.unshift({ 
          ...notification, 
          isRead: false,
          relatedEntityType: (notification as any).RelatedEntityType || (notification as any).relatedEntityType 
        });
        this.unreadNotificationCount++;
        this.cdRef.detectChanges();
      }),
    );

    this.fetchExistingNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.notificationSignalrService.stopConnection();
  }

  GetLoginEmpId() {
    this.LoginEmpId = localStorage.getItem('HRISEmpId') || '';
  }

  GetRouterUrl(): string {
    if (this.router.url.includes('?')) return this.router.url.split('?')[0];
    return this.router.url;
  }

  private logFormAccess(formName: string, formId: string, url: string, source: string): void {
    const payload = {
      AppRelativeVirtualPath: url,
      AppCode: 'DMS-b',
      LoginCompanyId: 1,
      DevicePlatform: 'Web',
      EntDevice: navigator.userAgent,
      UserId: '',
      UserEmpId: 0,
      EntTerminal: '',
      EntTerminalIP: ''
    };

    console.log(`%c [ACCESS EVENT] Source: ${source} | Form: ${formName}`, 'color: #007bff; font-weight: bold;');
    
    this._dataService.post('Security/SaveApplicationAccessLog', payload).subscribe({
      next: () => {},
      error: (err) => console.error('Logging failed:', err)
    });
  }

  GetHeaderDetails(Url: string): void {
    if (Url === '/dashboard' || Url === '/') {
      this.formName = 'Dashboard';
      this.currentFormId = 'DASHBOARD_HOME';
      this.formdescription = '';
      this.showdesc = false;
      this.showfavourite = false;
      this.showfavouriteicon = false;
      this.strBreadCrumb = 'Home / Dashboard';
      this.cdRef.detectChanges();
      this.logFormAccess(this.formName, this.currentFormId, Url, 'Direct/Default');
      return;
    }

    const applicationCode = 'DMS-b';
    let FormId = this.activatedRoute.snapshot.queryParamMap.get('FormId') || '';

    this._dataService
      .get<HeaderDetailsResponse>(
        `Security/GetHeaderDetails?_URL=${Url}&FormId=${FormId}&applicationCode=${applicationCode}`,
      )
      .subscribe((res) => {
        this.formName = res.formName;
        this.strBreadCrumb = res.FormLocation;
        this.currentFormId = res.FormId;

        if (res.formdescription && res.formdescription.length > 0) {
          this.showdesc = true;
          this.formdescription = res.formdescription;
        } else {
          this.showdesc = false;
          this.formdescription = '';
        }

        this.addedfavourite = !!res.IsFavorite;
        this.cdRef.detectChanges();
      });
  }

  onActivate() {
    this.updateNavigationCounts();
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
    const url = this.GetRouterUrl();
    const isDashboard = url.toLowerCase().includes('dashboard') || url === '/' || url === '';

    if (isDashboard) {
      this.GetHeaderDetails(url);
      return;
    }

    if (this._pendingFormId !== null) {
      this._pendingFormId = null;
      this.strBreadCrumb = this.generateBreadcrumb(url, this.formName);
      this.cdRef.detectChanges();
      this.logFormAccess(this.formName, this.currentFormId, url, 'Menu');
      return;
    }

    const match = this.findMenuItemByUrl(url);
    if (match) {
      this.formName = match.Text;
      this.currentFormId = (match as any).Value || '';
      this.strBreadCrumb = this.generateBreadcrumb(url, this.formName);
      this.cdRef.detectChanges();
      this.logFormAccess(this.formName, this.currentFormId, url, 'Direct URL');
    } else {
      this.GetHeaderDetails(url);
    }
  }

  onMenuLoaded(items: MenuItem[]): void {
    this._menuItems = items;
    this.updateNavigationCounts();
    const url = this.GetRouterUrl();
    if (url.toLowerCase().includes('dashboard') || url === '/') return;

    const match = this.findMenuItemByUrl(url);
    if (match) {
      this.formName = match.Text;
      this.currentFormId = (match as any).Value || '';
      this.strBreadCrumb = this.generateBreadcrumb(url, match.Text);
      this.cdRef.detectChanges();
      this.logFormAccess(this.formName, this.currentFormId, url, 'Direct URL (Data Loaded)');
    }
  }

  updateNavigationCounts(): void {
    if (!this._menuItems || this._menuItems.length === 0) return;

    // Fetch Count 1: My Approvals - Request for Document Creation
    this._documentRequestService.getMyDocumentRequestForApprovalCount().subscribe({
      next: (response) => {
        if (response && response.Data) {
          const count = response.Data.count ?? 0;
          this.applyCountToMenu('request-for-document-creation-update', count);
        }
      },
      error: (err) => console.error('Failed to get request approval count', err)
    });

    // Fetch Count 2: My Approvals - Documents
    this._documentService.GetMyDocumentCounts().subscribe({
      next: (response) => {
        if (response && response.Data && response.Data.MyInbox) {
          const count = response.Data.MyInbox.Pending ?? 0;
          this.applyCountToMenu('my-approvals-documents', count);
        }
      },
      error: (err) => console.error('Failed to get document counts', err)
    });

    // Fetch Count 3: My Approvals - Request
    this._documentRequestService.GetMyRequestCounts().subscribe({
      next: (response) => {
        if (response && response.Data && response.Data.MyInbox) { 
          const count = response.Data.MyInbox.Pending ?? 0;
          this.applyCountToMenu('my-approvals-request', count);
        }
      },
      error: (err) => console.error('Failed to get document counts', err)
    });
  }

  private applyCountToMenu(navigateUrl: string, count: number): void {
    const updateCount = (menuList: MenuItem[]) => {
      for (const item of menuList) {
        const matchesUrl = !!(item.NavigateUrl && item.NavigateUrl.toLowerCase().includes(navigateUrl.toLowerCase()));
        
        let matchesText = false;
        if (item.Text) {
          const textLower = item.Text.toLowerCase().trim();
          if (navigateUrl === 'request-for-document-creation-update') {
            matchesText = textLower.includes('request for document creation') || textLower.includes('my approvals - request for document creation');
          } else if (navigateUrl === 'my-approvals-documents') {
            matchesText = textLower === 'my approvals - documents' || textLower === 'documents' || textLower.includes('my approvals - documents');
          } else if (navigateUrl === 'my-approvals-request') {
            matchesText = textLower === 'my approvals - request' || textLower === 'request' || textLower.includes('my approvals - request');
          }
        }

        if (matchesUrl || matchesText) {
          item.count = count;
          console.log(`[MainLayout] Matched menu: text="${item.Text}" url="${item.NavigateUrl}" -> assigned count=${count}`);
        }

        if (item.child && item.child.length > 0) {
          updateCount(item.child);
        }
        if (item.subChild && item.subChild.length > 0) {
          updateCount(item.subChild);
        }
      }
    };
    updateCount(this._menuItems);

    if (this.menuComponent) {
      this.menuComponent.RootItems = [...this._menuItems];
    }
    this.cdRef.detectChanges();
  }

  private findMenuItemByUrl(url: string): MenuItem | null {
    for (const root of this._menuItems) {
      if (this.urlMatches(root.NavigateUrl, url)) return root;
      for (const child of root.child || []) {
        if (this.urlMatches(child.NavigateUrl, url)) return child;
        for (const sub of child.subChild || []) {
          if (this.urlMatches(sub.NavigateUrl, url)) return sub;
        }
      }
    }
    return null;
  }

  private urlMatches(menuUrl: string | undefined, currentUrl: string): boolean {
    if (!menuUrl) return false;
    const cleanMenu = menuUrl.toLowerCase().replace(/^\/|\/$/g, '');
    const cleanCurrent = currentUrl.toLowerCase().replace(/^\/|\/$/g, '');
    return cleanMenu === cleanCurrent;
  }

  updateConnectionStatus(isOnline: boolean): void {
    if (isOnline) {
      this.connectionStatusMessage = 'Back online';
      this.connectionStatus = 'online';
      setTimeout(() => {
        this.showStatusMessage = false;
        this.cdRef.detectChanges();
      }, 1000);
    } else {
      this.connectionStatusMessage = 'Connection lost!';
      this.connectionStatus = 'offline';
      this.showStatusMessage = true;
    }
    this.cdRef.detectChanges();
  }

  loadInitialData(): void {
    this.EmpID = this._utilityService.GetEmpid() || '0';
    this.EmpName = this._utilityService.GetEmpName() || 'Employee Name';
    this.CompanyName = this._utilityService.GetCompanyName() || 'Your Company';
    this.EmployeePic = '/assets/images/pro.png';

    this._utilityService.GetEmployeeImage(this.EmpID).subscribe({
      next: (blob) => {
        if (!blob) {
          this.EmployeePic = './assets/images/pro.png';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => { this.EmployeePic = reader.result as string; };
        reader.readAsDataURL(blob);
      },
      error: (error) => {
        console.error('Failed to load image from API:', error);
        this.EmployeePic = './assets/images/pro.png';
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    if (this.isSidebarOpen) this.isSidebarOpen = false;
  }

  getForms(formData: { formName: string; formdescription: string; formId: string }): void {
    this.formName = formData.formName || 'Dashboard';
    this.currentFormId = formData.formId;
    this.formdescription = formData.formdescription;
    this.showdesc = !!formData.formdescription;
    this.updateFavouriteStatus(formData.formId);
    this.strBreadCrumb = this.generateBreadcrumb(this.router.url, formData.formName);
    this._pendingFormId = formData.formId;
    
    if (typeof window !== 'undefined' && window.innerWidth <= 992) {
      this.closeSidebar();
    }
  }

  generateBreadcrumb(url: string, currentFormName?: string): string {
    const segments = url.split('/').filter((s) => s && s.toLowerCase() !== 'dashboard');
    let breadcrumb = 'Home';
    if (segments.length > 0) {
      const pathParts = segments.map(
        (s) => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' '),
      );
      if (currentFormName && pathParts.length > 0 && currentFormName.toLowerCase() !== 'dashboard') {
        pathParts[pathParts.length - 1] = currentFormName;
      }
      breadcrumb += ' / ' + pathParts.join(' / ');
    } else {
      breadcrumb += ' / Dashboard';
    }
    return breadcrumb;
  }

  updateFavouriteStatus(formId: string): void {
    const isFavEligible = formId && formId !== 'Favourites' && formId !== 'dashboard';
    if (isFavEligible) {
      this.addedfavourite = false;
      this.updateFavButtonState();
    }
  }

  addDeleteFavourite(): void {
    this.addedfavourite = !this.addedfavourite;
    this.updateFavButtonState();
  }

  updateFavButtonState(): void {
    if (this.addedfavourite) {
      this.favPath = '/assets/images/favourites-active.png';
      this.toolTipText = 'Remove from Favorites';
      this.FavMenuText = 'Mark as UnFavorite';
      this.favPath2 = '/assets/images/favourites.png';
      this.isDelete = true;
    } else {
      this.favPath = '/assets/images/favourites.png';
      this.toolTipText = 'Add to Favorites';
      this.FavMenuText = 'Mark as Favorite';
      this.favPath2 = '/assets/images/favourites-active.png';
      this.isDelete = false;
    }
  }

  openDashboard(): void { this.router.navigate(['/dashboard']); }
  openReportDialog(): void { alert('Report Problem functionality not implemented yet.'); }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
    if (this.isNotificationOpen) this.isProfileOpen = false;
  }

  toggleProfile(event: Event): void {
    event.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
    if (this.isProfileOpen) this.isNotificationOpen = false;
  }

  @HostListener('document:click')
  closeNotifications(): void {
    if (this.isNotificationOpen || this.isProfileOpen) {
      this.isNotificationOpen = false;
      this.isProfileOpen = false;
      this.cdRef.detectChanges();
    }
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
    if (typeof document !== 'undefined') {
      document.cookie = encodeURIComponent('login') + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    this.router.navigate(['/security']);
  }

  switchNotificationTab(tab: 'unread' | 'read'): void {
    this.activeNotificationTab = tab;
    this.isRead = tab === 'read';
    this.fetchExistingNotifications();
  }

  fetchExistingNotifications(): void {
    this.notificationHttpService.getMyNotifications(this.isRead).subscribe({
      next: (res: any) => {
        if (res?.Success && res.Data) {
          const dataArray = Array.isArray(res.Data) ? res.Data : [res.Data];
          this.notifications = dataArray.map((n: any) => ({
            id: n.id || n.Id,
            title: n.title || n.Title,
            message: n.message || n.Message,
            type: n.type || n.Type || (n.NotificationType != null ? n.NotificationType.toString() : 'info'),
            isRead: n.IsRead !== undefined ? n.IsRead : n.isRead !== undefined ? n.isRead : false,
            createdAt: n.createdAt || n.CreatedAt,
            relatedEntityType: n.RelatedEntityType || n.relatedEntityType,
          }));
          if (!this.isRead) {
            this.unreadNotificationCount = this.notifications.filter((n) => !n.isRead).length;
          }
        } else {
          this.notifications = [];
          if (!this.isRead) this.unreadNotificationCount = 0;
        }
        this.cdRef.detectChanges();
      },
      error: (err: any) => console.error('Failed to fetch notifications', err?.error?.Message || err?.Message),
    });
  }

  markAsRead(notification: DisplayNotification): void {
    if (!notification.isRead) {
      notification.isRead = true;
      this.unreadNotificationCount--;
      this.cdRef.detectChanges();
      if (notification.id) this.notificationHttpService.markAsRead(notification.id).subscribe();
    }
    
    if (notification.relatedEntityType === 'Request') {
      this.router.navigate(['/documents/my-approvals-request']);
    } else {
      this.router.navigate(['/documents/my-approvals-documents']);
    }
    this.isNotificationOpen = false;
  }

  markAllAsRead(): void {
    this.notifications.filter((n) => !n.isRead).forEach((n) => (n.isRead = true));
    this.unreadNotificationCount = 0;
    this.cdRef.detectChanges();
    this.notificationHttpService.markAllAsRead().subscribe();
  }

  getNotificationIcon(type?: string): string {
    switch (type?.toLowerCase()) {
      case 'success': return 'bi-check-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'error': return 'bi-x-circle-fill';
      default: return 'bi-bell-fill';
    }
  }

  getNotificationColor(type?: string): string {
    switch (type?.toLowerCase()) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-danger';
      default: return 'text-primary';
    }
  }

  openAbout() {
    this.dialog.open(AboutPopupComponent, {
      width: '480px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      autoFocus: false
    });
  }
}