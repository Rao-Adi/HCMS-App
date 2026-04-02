import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostBinding, HostListener, inject, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. IMPORT ActivatedRoute, REMOVE NavigationEnd and filter
import { RouterOutlet, Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription, fromEvent, Observable } from 'rxjs';
// import { filter } from 'rxjs/operators'; // <-- REMOVED

import { MenuComponent } from '../menu/menu.component';
import { DataService } from '@app/core/services/data.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { AppConfigService } from '@app/core/services/app-config';
import { SpinnerService } from '@app/core/services/spinner.service';
import { NotificationService as NotificationHttpService } from '@app/shared/services/notification.service';
import { NotificationSignalrService, AppNotification } from '@app/shared/services/notification-signalr.service';
import { SpinnerComponent } from '@app/shared/spinner/spinner.component';
 
// 2. DEFINE THE API RESPONSE
// This interface fixes all the 'unknown' type errors
interface HeaderDetailsResponse {
  formName: string;
  FormId: string;
  IsFavorite: boolean; // Correctly typed
  FormLocation: string;
  formdescription: string;
}

interface DisplayNotification extends AppNotification {
  isRead: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MenuComponent],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {

  // --- All your original properties ---
  formName: string = '';
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
  notifications: DisplayNotification[] = [];
  unreadNotificationCount: number = 0;
  private spinnerService = inject(SpinnerService);
  public isLoading: Signal<boolean> = this.spinnerService.isLoading.asReadonly();
  isNotificationOpen: boolean = false;
  // --- END of properties ---

     // We make apiUrl a getter. It's only called when needed.
  private get apiUrl(): string {
    if (!this._config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return ''; // Failsafe
    }
    return this._config.baseUrl;
  }


  constructor(
    private _utilityService: UtilitiesService,
    private _dataService: DataService,
    private router: Router,
    private _config: AppConfigService,
    private cdRef: ChangeDetectorRef,
    // 3. INJECT ActivatedRoute
    private activatedRoute: ActivatedRoute,
    private notificationSignalrService: NotificationSignalrService,
    private notificationHttpService: NotificationHttpService
  ) { }

  ngOnInit(): void {
    this.loadInitialData(); //

    // Online/Offline Detection
    if (typeof window !== 'undefined') {
      this.onlineEvent$ = fromEvent(window, 'online');
      this.offlineEvent$ = fromEvent(window, 'offline');
      this.subscriptions.push(this.onlineEvent$.subscribe(() => this.updateConnectionStatus(true)));
      this.subscriptions.push(this.offlineEvent$.subscribe(() => this.updateConnectionStatus(false)));
      this.updateConnectionStatus(navigator.onLine);
    }

    // Start SignalR Connection using the backend URL
    let hubBaseUrl = this.apiUrl;
    if (hubBaseUrl.endsWith('/api')) {
      hubBaseUrl = hubBaseUrl.substring(0, hubBaseUrl.length - 4);
    }
    const hubUrl = `${hubBaseUrl}/notificationHub`;
    
    // Retrieve your JWT token from localStorage (or your Auth Service)
    let token = '';
    if (typeof window !== 'undefined' && localStorage) {
      token = localStorage.getItem('token') || ''; // IMPORTANT: Adjust 'token' if your storage key is different
    }
    this.notificationSignalrService.startConnection(hubUrl, token);

    this.subscriptions.push(
      this.notificationSignalrService.notification$.subscribe((notification: AppNotification) => {
        this.notifications.unshift({ ...notification, isRead: false });
        this.unreadNotificationCount++;
        this.cdRef.detectChanges();
      })
    );

    // --- 4. REMOVED the router.events subscription ---
    // The this.subscriptions.push(this.router.events.pipe(...))
    // block and the this.updateHeaderInfo() call are now gone.
  }

  ngOnDestroy(): void { //
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.notificationSignalrService.stopConnection();
  }

  // --- 5. ADDED GetRouterUrl (from home.component.ts) ---
  // This fixes the "must return a value" error
  GetRouterUrl(): string {
    let url = '';
    if (this.router.url.includes('?'))
      url = this.router.url.split('?')[0];
    else
      url = this.router.url;
    return url;
  }

  // --- 6. ADDED GetHeaderDetails (ported from home.component.ts & fixed) ---
  GetHeaderDetails(Url: string): void {
    if (Url === '/dashboard' || Url === '/') {
      this.formName = 'Dashboard';
      this.formdescription = '';
      this.showdesc = false;
      this.showfavourite = false;
      this.showfavouriteicon = false;
      this.strBreadCrumb = 'Home / Dashboard';
      this.cdRef.detectChanges();
      return;
    }

    const applicationCode = 'DMS-b'; //
    let FormId = this.activatedRoute.snapshot.queryParamMap.get('FormId') || '';

    this._dataService.get<HeaderDetailsResponse>(`Security/GetHeaderDetails?_URL=${Url}&FormId=${FormId}&applicationCode=${applicationCode}`)
      .subscribe(res => {
        this.formName = res.formName;
        this.strBreadCrumb = res.FormLocation; //

        if (res.formdescription && res.formdescription.length > 0) {
          this.showdesc = true;
          this.formdescription = res.formdescription;
        } else {
          this.showdesc = false;
          this.formdescription = '';
        }

        // FIX: Coerce to boolean
        this.addedfavourite = !!res.IsFavorite;

        //this.updateFavButtonState();

        // FIX: Coerce expression to boolean
        //const isFavEligible = !!(res.FormId && res.FormId !== 'Favourites' && res.FormId !== 'dashboard');

        //this.showfavourite = isFavEligible;
        //this.showfavouriteicon = isFavEligible;

        this.cdRef.detectChanges();
      });
  }

  // --- 7. MODIFIED onActivate (from main-layout.ts) ---
  onActivate() {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    // This is the new trigger
    this.GetHeaderDetails(this.GetRouterUrl());
  }

  // --- 8. DELETED old updateHeaderInfo function ---
  // The function updateHeaderInfo() is now gone.

  // --- ALL OTHER FUNCTIONS from your file remain unchanged ---

  updateConnectionStatus(isOnline: boolean): void { //
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
      console.log('Offline...');
    }
    this.cdRef.detectChanges();
  }

  loadInitialData(): void { //
    this.EmpID = this._utilityService.GetEmpid() || '0';
    this.EmpName = this._utilityService.GetEmpName() || 'Employee Name';
    this.CompanyName = this._utilityService.GetCompanyName() || 'Your Company';
    this.EmployeePic = '/assets/images/pro.png';
    this.strBreadCrumb = this.generateBreadcrumb(this.router.url);
    // this.haveDashboardRights = await this.authService.hasDashboardRights();

    this._utilityService.GetEmployeeImage(this.EmpID).subscribe({
      // 'next' is the new name for the "success" callback
      next: (blob) => {
        if (!blob) {
          // ✅ If blob is null, fallback to default image
          this.EmployeePic = './assets/images/pro.png';
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          this.EmployeePic = reader.result as string;
        };
        reader.readAsDataURL(blob);
      },

      // 'error' is the name for the "failure" callback
      error: (error) => {
        // Optional: handle actual errors (e.g., server down)
        console.error('Failed to load image from API:', error);
        this.EmployeePic = './assets/images/pro.png';
      }

      // You could also add a 'complete' block if needed:
      // complete: () => { console.log('Image load complete.'); }
    });
  }

  toggleSidebar(): void { //
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void { //
    if (this.isSidebarOpen) {
      this.isSidebarOpen = false;
    }
  }

  // This is still needed for menu *clicks*
  getForms(formData: { formName: string, formdescription: string, formId: string }): void { //
    this.formName = formData.formName || 'Dashboard';
    this.formdescription = formData.formdescription;
    this.showdesc = !!formData.formdescription;
    this.updateFavouriteStatus(formData.formId);
    this.strBreadCrumb = this.generateBreadcrumb(this.router.url, formData.formName);
    if (typeof window !== 'undefined' && window.innerWidth <= 992) {
      this.closeSidebar();
    }
  }

  generateBreadcrumb(url: string, currentFormName?: string): string { //
    const segments = url.split('/').filter(s => s && s.toLowerCase() !== 'dashboard');
    let breadcrumb = 'Home';
    if (segments.length > 0) {
      const pathParts = segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' '));
      if (currentFormName && pathParts.length > 0 && currentFormName.toLowerCase() !== 'dashboard') {
        pathParts[pathParts.length - 1] = currentFormName;
      }
      breadcrumb += ' / ' + pathParts.join(' / ');
    } else if (currentFormName && currentFormName.toLowerCase() !== 'dashboard') {
      breadcrumb += ' / ' + currentFormName;
    } else {
      breadcrumb += ' / Dashboard';
    }
    return breadcrumb;
  }

  updateFavouriteStatus(formId: string): void { //
    const isFavEligible = formId && formId !== 'Favourites' && formId !== 'dashboard';
    if (isFavEligible) {
      this.addedfavourite = false;
      this.updateFavButtonState();
    }
  }

  addDeleteFavourite(): void { //
    console.log('Add/Delete Favourite clicked');
    this.addedfavourite = !this.addedfavourite;
    this.updateFavButtonState();
  }

  updateFavButtonState(): void { //
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

  openDashboard(): void { this.router.navigate(['/dashboard']); } //
  openReportDialog(): void { alert('Report Problem functionality not implemented yet.'); } //
  onEnter(searchText: string): void { alert(`Search for "${searchText}" not implemented yet.`); } //

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
  }

  @HostListener('document:click')
  closeNotifications(): void {
    if (this.isNotificationOpen) {
      this.isNotificationOpen = false;
      this.cdRef.detectChanges();
    }
  }

  logout(): void {
    // 1. Clear all local storage items (HRIS..., token, etc.)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }

    // 2. Clear the login cookie created by the Security component
    if (typeof document !== 'undefined') {
      document.cookie = encodeURIComponent('login') + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    // 3. Navigate back to the root/login screen
    this.router.navigate(['/security']);
  }

  // --- TEMPORARY METHOD FOR TESTING: Remove after SSO integration ---
  triggerTestNotification(): void {
    const payload = {
      title: "Test",
      message: "Test",
      type: "Request"
    };

    this.notificationHttpService.sendTestNotification(payload).subscribe({
      next: () => console.log('Test notification triggered successfully via API.'),
      error: (err) => console.error('Failed to trigger test notification via API', err)
    });
  }

  markAsRead(notification: DisplayNotification): void {
    if (!notification.isRead) {
      notification.isRead = true;
      this.unreadNotificationCount--;
      this.cdRef.detectChanges();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.unreadNotificationCount = 0;
    this.cdRef.detectChanges();
  }

  getNotificationBadgeClass(type?: string): string {
    switch (type) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning text-dark';
      case 'error': return 'bg-danger';
      case 'info':
      default: return 'bg-info text-dark';
    }
  }
}
