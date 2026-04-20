import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule for standalone

import { DataService } from '@app/core/services/data.service';
import { UtilitiesService } from '@app/core/services/utilities.service';

@Component({
  standalone: true, // Converted to standalone component
  imports: [CommonModule], // Added CommonModule for standalone directives
  templateUrl: './login.html'
})
export class login implements OnInit {
  redirecturl: any;
  LoginDetails: any;

  SetUniqueKey(key: string) { // Added 'string' type
    var date = new Date();
    var days = 1;
    var expires;


    if (days) {
      var date = new Date();
      var _time = 1 * 24 * 60 * 60 * 1000;
      date.setTime(date.getTime() + (_time));
      expires = "; expires=" + date;
    } else {
      expires = "";
    }
    window.document.cookie = encodeURIComponent('login') + "=" + encodeURIComponent(key) + expires + "; path=/";
    var myKey = this.getKey('login');
    console.log("My Key: ", myKey);
  }

  getKey(name: string) { // Added 'string' type
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ')
        c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0)
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  constructor(
    private _userService: DataService, // Injected DataService
    private route: Router,
    Actroute: ActivatedRoute,
    private _UtilitiesService: UtilitiesService // Injected UtilitiesService
  ) {

    Actroute.params.subscribe((params: Params) => {
      let userId = params['variable'];
      this.SetUniqueKey(userId);
    });

  }


  navigate() {

  }

  public ngOnInit() {
    this.Login();
  }


  Login(): void {
    
    this._userService.get<string>('Security/GetLogin/DMS-b').subscribe((users: string) => {
      console.log(users.substring(0, 5));

      if (users == "ErrorPageUnSuccessfulMapping") {
        this.route.navigate(['applicationlevelerror'], { queryParams: { type: 'ErrorPageUnSuccessfulMapping' } });
      }
      else {
        this.GetLoginDetails().then(res => this.SaveLoginCredentials());
      }
    })
  }

  GetLoginDetails() {
    return new Promise<any>((resolve, reject) => {
      this._UtilitiesService.GetLoginDetails().subscribe(
        (data: any[]) => { // Added 'any[]' type
          this.LoginDetails = data;
          resolve(data);
        });
    })
  }

  SaveLoginCredentials() {
    // 1. Save all credentials to localStorage
    debugger;
    this.LoginDetails.forEach((x: any) => {
      localStorage.setItem('HRISCompanyId', x.CompanyId);
      localStorage.setItem('HRISLoginCulture', x.Culture);
      localStorage.setItem('HRISApplicationId', 'HRIS');
      localStorage.setItem('HRISUserid', x.UserId);
      localStorage.setItem('HRISCompanyName', x.CompanyName);
      localStorage.setItem('HRISCompanyLogo', x.Logo);
      localStorage.setItem('HRISEmpId', x.EmpId);
      localStorage.setItem('HRISEmpName', x.EmpName);
      localStorage.setItem('HRISBaseCompanyId', x.BaseCompanyId);
      localStorage.setItem('HRISPGid', x.PGIDS);
    })

    this._UtilitiesService.refreshUserState();

    // 3. Now, navigate with SPA routing.
    if (localStorage.getItem('HRISRedirectURL') != null) {
      this.redirecturl = localStorage.getItem('HRISRedirectURL');
      localStorage.removeItem('HRISRedirectURL');

      this.route.navigate([this.redirecturl]);
    }
    else {      
      this.route.navigate(['/dashboard']);
    }
  }

}

