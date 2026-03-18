import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { fromEvent, Subscription } from 'rxjs';

import { DataService } from '@app/core/services/data.service';
import { isDevMode } from '@angular/core';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'Security.component.html',
  // Removed custom CSS file import
  styleUrls: []
})
export class SecurityComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private _userService = inject(DataService);

  errorMsg: string = '';
  connectionStatus: 'online' | 'offline' = navigator.onLine ? 'online' : 'offline';
  // Simplified offline message for developer view
  connectionStatusMessage = 'App is currently offline';

  selectedCulture = 'en-GB';
  ddlCompany: any[] = [];
  selectedCompany: any;

  _UserId: string = '';
  // Corrected the typo: 'Passowrd' -> 'Password'
  _Password: string = '';

  methodName = '';
  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(fromEvent(window, 'online').subscribe(() => (this.connectionStatus = 'online')));
    this.subs.add(fromEvent(window, 'offline').subscribe(() => (this.connectionStatus = 'offline')));

    this.FillCompanyDropDown();
    this.generateUniqueKey();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Get all companies
  FillCompanyDropDown(): void {
    this._userService.get<any[]>('Security/GetAllCompanies').subscribe({
      next: (companies: any[]) => (this.ddlCompany = companies || []),
      error: (err) => console.error('Error fetching companies:', err)
    });
  }

  // Generate unique key (if required)
  generateUniqueKey(): void {
    // --- THIS IS THE FIX ---
    // We tell .get() to expect a 'string'
    this._userService.get<string>('Security/GenerateUniqueKey?_UserId=a.rahim').subscribe({
      next: (key: string) => this.SetUniqueKey(key),
      error: (err) => console.log("Error generating key: ", err)
    });
  }

  // Store the unique key as a cookie
  SetUniqueKey(key: string): void {
    const date = new Date();
    date.setTime(date.getTime() + 1 * 24 * 60 * 60 * 1000); // expires in 1 day
    document.cookie = `${encodeURIComponent('login')}=${encodeURIComponent(key)}; expires=${date.toUTCString()}; path=/`;
  }

  // Retrieve the unique key from cookies
  getKey(name: string): string {
    const nameEQ = encodeURIComponent(name) + '=';
    const ca = document.cookie.split(';');
    for (let c of ca) {
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return '';
  }

  // Handle the login process
  GetERPLogin(): void {
    debugger;
    // Only allow login if all required fields are filled
    if (!this.selectedCompany || !this._UserId || !this._Password) {
      this.errorMsg = 'Please select a company, enter User ID, and Password.';
      return;
    }

    const compId = this.selectedCompany?.Id ?? '';
    const compCode = this.selectedCompany?.Code ?? '';
    const key = this.getKey('login');

    // Construct the query string for the GET request
    this.methodName =
      `?_CompanyId=${encodeURIComponent(compId)}` +
      `&_CompanyName=${encodeURIComponent(this.selectedCompany?.Name || '')}` +
      `&_UserId=${encodeURIComponent(this._UserId || '')}` +
      // Corrected the variable name
      `&_Password=${encodeURIComponent(this._Password || '')}` +
      `&_CaptchaValue=` +
      `&_Key=${encodeURIComponent(key)}` +
      `&_culture=${encodeURIComponent(this.selectedCulture)}` +
      `&WebERP=Yes&_KeepMeSigin=false`;

    // Send the request to the backend
    this._userService.get('Security/GetERPLogin' + this.methodName).subscribe({
      next: (loginDetails: any) => {
        if (loginDetails === 'ERPMain.aspx') {
          // Redirect to login if the backend returns "ERPMain.aspx"
          const k = this.getKey('login');
          this.router.navigate(['login', k]);
          return;
        }
        // Otherwise, fallback to the dashboard or redirect to the intended page
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        console.error('Login failed', err);
        if (isDevMode()) {
          // Stay on the same page in dev mode and show inline error
          this.errorMsg = 'Login failed (debug). Check console for details.';
          return;
        }
        // Navigate to error page for non-debug builds
        this.router.navigate(['/applicationlevelerror'], { queryParams: { type: 'login-failed' } });
      }
    });
  }
}
