import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. IMPORT CommonModule
import { ActivatedRoute, Router } from '@angular/router';


// 1. Import the service
import { AppConfigService } from '@app/core/services/app-config';

@Component({
  selector: 'app-application-level-error', // <-- This is the new selector
  standalone: true, // <-- 2. SET to standalone
  imports: [
    CommonModule // <-- 3. ADD CommonModule here (for *ngIf)
  ],
  templateUrl: './application-level-error.html',
  styleUrls: ['./application-level-error.css']
})
export class ApplicationLevelErrorComponent implements OnInit {
  // --- All code below is copied from your old component ---

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _config: AppConfigService // <-- 4. This service is a dependency
  ) { }

  timeOut: number = 5;
  timeOutRedirect() {
    let intervalRef = setInterval(() => {       
      if (this.timeOut == 0) {
        clearInterval(intervalRef);
        //window.open('https://peoplepartners.azurewebsites.net/ERPScreen','_self');
         
        //console.log(this._config.loginUrl);
        //window.open(this._config.environment.SecurityUrl, '_self');
        //window.location.href = this._config.environment.SecurityUrl;
        return;
      }
      this.timeOut--;
    }, 1000);
  }
  isDeniedType: boolean = false;
  AccessDenied: boolean = false;
  UnSuccessfulMapping: boolean = false;

  sub: any;
  ngOnInit() {
    //this.sub = this.route
    //    .queryParams
    //    .subscribe(params => {
    //        if (params && params['type'] == 'denied') {
    //            this.isDeniedType = true;
    //        }
    //    });    
    this.sub = this.route
      .queryParams
      .subscribe(params => {
        //if (params && params['type'] == 'denied') {
        //    this.isDeniedType = true;
        //    this.AccessDenied = true;
        //    this.UnSuccessfulMapping = false;
        //} else if (params && params['type'] == 'ErrorPageUnSuccessfulMapping') {
        //    this.isDeniedType = true;
        //    this.AccessDenied = false;
        //    this.UnSuccessfulMapping = true;

        //}
      });
    this.timeOutRedirect();
  }
}
