import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule for interpolation
import { Router } from '@angular/router'; // Import Router
import { AppConfigService } from '@app/core/services/app-config'; // Import AppConfigService using path alias

@Component({
  selector: 'app-session-timeout', // Standard selector
  standalone: true,
  imports: [CommonModule], // Add CommonModule for {{ timeOut }}
  templateUrl: './session-timeout.html',
  styleUrls: ['./session-timeout.css']
})
export class SessionTimeoutComponent implements OnInit, OnDestroy {

  timeOut: number = 5;
  private intervalRef: any = null; // Store interval reference to clear it

  constructor(
    private router: Router,
    private configService: AppConfigService // Inject AppConfigService
  ) { }

  ngOnInit(): void {
    this.timeOutRedirect();
  }

  ngOnDestroy(): void {
    // Ensure the interval is cleared if the component is destroyed unexpectedly
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
  }

  timeOutRedirect(): void {
    this.intervalRef = setInterval(() => {
      if (this.timeOut <= 0) { // Check for <= 0 for safety
        clearInterval(this.intervalRef);
        this.intervalRef = null; // Clear reference

        // Determine the correct redirect URL from config
        // Assuming SecurityUrl is for local dev and SessionTimeoutURL for deployed environments
        let redirectUrl = '';
        try {
          // Check if running locally (basic check, might need refinement)
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

          if (isLocal) {
            redirectUrl = this.configService.loginUrl; // Use environment access if available
          } else {
            redirectUrl = this.configService.SessionTimeoutURL; // Use environment access if available
          }

          // Fallback if environment access isn't set up in AppConfigService yet
          // redirectUrl = isLocal ? this.configService.loginUrl : this.configService.someOtherUrl; 

          console.log(`Session timed out. Redirecting to: ${redirectUrl}`);

          if (redirectUrl) {
            // Perform external redirect - Angular Router isn't needed here
            window.location.href = redirectUrl;
          } else {
            console.error('Redirect URL not found in config for session timeout.');
            // Optionally navigate to a fallback Angular route
            // this.router.navigate(['/login']); 
          }

        } catch (e) {
          console.error('Error reading redirect URL from config:', e);
          // Fallback redirect if config fails
          // window.location.href = '/'; 
        }

        return; // Exit interval callback
      }
      this.timeOut--;
    }, 1000);
  }
}
