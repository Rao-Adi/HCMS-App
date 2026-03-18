import { Injectable, inject } from '@angular/core'; // <-- Import inject
import { Observable, Observer, of } from 'rxjs'; // <-- Import 'of'
import { catchError } from 'rxjs/operators'; // <-- Import 'catchError'
import { Router } from '@angular/router';
import { DataService } from './data.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // <-- 1. Import HttpClient
import { AppConfigService } from './app-config'; // <-- 2. Import AppConfigService

@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {

  // --- 3. Inject new services using inject() ---
  // This avoids breaking your existing constructor
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private apiUrl = this.config.baseUrl || '';

  // --- In-Memory State for SPA navigation ---
  private empId: string | null = null;
  private companyName: string | null = null;
  private userId: string | null = null;
  private empName: string | null = null;
  // (add any other properties you need from localStorage)

  // Your existing constructor is untouched
  constructor(public _UserService: DataService, private router: Router) {
    // 4. Load state from storage when service is first created
    this.refreshUserState();
  }

  public LoadingBar: boolean = false;

  // -------------- State Management Methods -----------------//

  /**
   * Re-loads the service's internal state from localStorage.
   * This is called by login.component.ts to ensure a true SPA navigation.
   */
  public refreshUserState(): void {
    console.log("UtilitiesService refreshing state from localStorage...");
    this.empId = localStorage.getItem('HRISEmpId');
    this.companyName = localStorage.getItem('HRISCompanyName');
    this.userId = localStorage.getItem('HRISUserid');
    this.empName = localStorage.getItem('HRISEmpName');
    // (load all other properties)
  }

  setActiveMenu(): void {
    console.warn('setActiveMenu needs rewrite - jQuery removed.');
  }

  // --- 5. Getters now read from fast, in-memory state ---
  GetCompanyId(): string | null { return this.empId; }
  GetDefaultCompanyId(): string | null { return this.empId; }
  GetAppCurrentUICulture(): string | null { return localStorage.getItem('HRISLoginCulture'); } // This one seems fine as-is
  GetApplicationId(): string | null { return localStorage.getItem('HRISApplicationId'); }
  GetUserid(): string | null { return this.userId; }
  GetCompanyName(): string | null { return this.companyName; }
  GetCompanyLogo(): string | null { return localStorage.getItem('HRISCompanyLogo'); }
  GetEmpid(): string | null { return this.empId; }
  GetEmpName(): string | null { return this.empName; }
  GetBaseCompanyId(): string | null { return localStorage.getItem('HRISBaseCompanyId'); }
  GetLoginPGID(): string | null { return localStorage.getItem('HRISPGid'); }
  GetUserEmpId(): string | null { return this.empId; }
  getTerminalId(): string { return "::1"; }
  getTerminalIP(): string { return "::1"; }
  GetUserEmpName(): string | null { return this.empName; }

  // -------------- Subscribe Methods (API calls via DataService - UNCHANGED) -----------------//
  // (These all correctly use your DataService, so they are unchanged)

  GetCompanyIDAPI(): Observable<any> { return this._UserService.get('Utilities/GetCompanyId'); }
  GetCompanyLogoAPI(CompanyId: string): Observable<any> { return this._UserService.get(`Utilities/GetCompanyLogo/${CompanyId}`); }
  GetUserEmpCode(EmpId: string): Observable<any> { return this._UserService.get(`Utilities/GetEmpCodeParameters/${EmpId}`); }
  GetGeneralsetupsCompanywise(CompanyId: string, smsId: string, _All_Item_Required: boolean, _NA_Item_Required: boolean): Observable<any> { return this._UserService.get(`GetGeneralsetupsCompanywiseParameters/${CompanyId}/${smsId}/${_All_Item_Required}/${_NA_Item_Required}`); }
  GetPayrollGroupsCompanywise(_FormId: string, companyid: string, _All_Item_Required: boolean): Observable<any> { return this._UserService.get(`GetPayrollGroupsCompanywiseParameters/${_FormId}/${companyid}/${_All_Item_Required}`); }
  GetTeamCompanywise(companyid: string, _All_Item_Required: boolean): Observable<any> { return this._UserService.get(`GetTeamCompanywiseParameters/${companyid}/${_All_Item_Required}`); }
  GetReportToCompanywise(companyid: string): Observable<any> { return this._UserService.get(`GetReportToCompanywiseParameters/${companyid}`); }
  GetProfileShiftCompanywise(companyid: string): Observable<any> { return this._UserService.get(`GetProfileShiftCompanywiseParameters/${companyid}`); }
  GetEmployeeStatus(_All_Item_Required: boolean): Observable<any> { return this._UserService.get(`GetEmployeeStatusParameters/${_All_Item_Required}`); }
  GetPGIdsWRTFormWiseUserWise(FormId: string, CompanyIds: string): Observable<any> { return this._UserService.get(`GetPGIdsWRTFormWiseUserWiseParameters/${FormId}/${CompanyIds}`); }
  GetEmployeeCompanyId(EmpId: string): Observable<any> { return this._UserService.get(`GetEmployeeCompanyIdParameters/${EmpId}`); }
  GetSysDate(): Observable<any> { return this._UserService.get('GetSysDate'); }
  GetMappedCountries(CompanyId: string): Observable<any> { return this._UserService.get(`GetMappedCountriesParameters/${CompanyId}`); }
  GetMappedCities(CompanyId: string, CountryId: string): Observable<any> { return this._UserService.get(`GetMappedCitiesParameters/${CompanyId}/${CountryId}`); }
  GetDepartmentCompanywise(divids: string, companyid: string, _All_Item_Required: boolean, _NA_Item_Required: boolean): Observable<any> { return this._UserService.get(`GetDepartmentCompanywiseParameters/${divids}/${companyid}/${_All_Item_Required}/${_NA_Item_Required}`); }
  GetSubDepartmentCompanywise(departmentId: string, divids: string, companyid: string, _All_Item_Required: boolean, _NA_Item_Required: boolean): Observable<any> { return this._UserService.get(`GetSubDepartmentCompanywiseParameters/${departmentId}/${divids}/${companyid}/${_All_Item_Required}/${_NA_Item_Required}`); }
  GetEmployeeTypeCompanywise(empcategoryids: string, companyid: string, _All_Item_Required: boolean, _NA_Item_Required: boolean): Observable<any> { return this._UserService.get(`GetEmployeeTypeCompanywiseParameters/${empcategoryids}/${companyid}/${_All_Item_Required}/${_NA_Item_Required}`); }
  IsPayrollMonthEditable(MMYY: string): Observable<any> { return this._UserService.get(`IsPayrollMonthEditableParameters/${MMYY}`); }

  SetRedirectURL(): void {
    const currentUrl = this.router.url;
    console.log('Attempting to set Redirect URL to:', currentUrl);
    localStorage.setItem('HRISRedirectURL', currentUrl);
  }

  // --- Permission Checks (Wrapper around DataService calls) ---
  // (Unchanged, this logic is good)
  private checkPermission(apiMethod: string, FormId: string, applicationCode: string = 'ESSv4.5'): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      this._UserService.get(`Utilities/${apiMethod}/${FormId}/${applicationCode}`).subscribe({
        next: (response: any) => {
          let resultValue: string | boolean = 'false';
          if (response && response.Result !== undefined) {
            resultValue = response.Result;
          } else {
            console.warn(`Unexpected response structure for ${apiMethod} on FormId ${FormId}:`, response);
          }

          if (resultValue === 'SessionTimeOut') {
            this.SetRedirectURL();
            //this.router.navigate(['sessiontimeout']);
            observer.error('SessionTimeOut');
          } else {
            const canAccess = (resultValue === true || String(resultValue).toLowerCase() === "true");
            observer.next(canAccess);
            observer.complete();
          }
        },
        error: (err) => {
          console.error(`Error checking permission ${apiMethod} for FormId ${FormId}:`, err);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  CanViewReport(FormId: string): Observable<boolean> { return this.checkPermission('CanViewReportParameters', FormId); }
  CanView(FormId: string): Observable<boolean> { return this.checkPermission('CanViewParameters', FormId); }
  CanProcessed(FormId: string): Observable<boolean> { return this.checkPermission('CanProcessedParameters', FormId); }
  CanEdit(FormId: string): Observable<boolean> { return this.checkPermission('CanEditParameters', FormId); }
  CanDelete(FormId: string): Observable<boolean> { return this.checkPermission('CanDeleteParameters', FormId); }
  CanInsert(FormId: string): Observable<boolean> { return this.checkPermission('CanInsertParameters', FormId); }

  // --- Other API Calls (Unchanged) ---
  isPayrollGroupFinalized(Datefrom: string): Observable<any> { return this._UserService.get(`isPayrollGroupFinalizedParameters/${Datefrom}`); }
  CheckDate(dateVal: string): Observable<any> { return this._UserService.get(`CheckDateParameters/${dateVal}`); }
  CheckTime(Time: string): Observable<any> { return this._UserService.get(`CheckDateParameters/${Time}`); }
  GetBaseCurrency(): Observable<any> { return this._UserService.get('GetBaseCurrency'); }
  GetFiscalYear(): Observable<any> { return this._UserService.get('GetFiscalYear'); }
  IsEmployeeActive(EmpId: string): Observable<any> { return this._UserService.get(`IsEmployeeActiveParameters/${EmpId}`); }
  GetEmployeeName(EmpId: string): Observable<any> { return this._UserService.get(`GetEmployeeNameParameters/${EmpId}`); }
  GetCurrentPayrollMonth(CompanyId: string): Observable<any> { return this._UserService.get(`GetCurrentPayrollMonthParameters/${CompanyId}`); }
  GetFinalizedWorkFlowTrack(ParentRecordId: string, WorkflowCode: string): Observable<any> { return this._UserService.get(`GetFinalizedWorkFlowTrackParameters/${ParentRecordId}/${WorkflowCode}`); }
  IsValidEmailParameters(Email: string): Observable<any> { return this._UserService.get(`IsValidEmailParameters/${Email}`); }
  GetUserLevelsDataParameters(EmpId: string, Active: string): Observable<any> { return this._UserService.get(`Utilities/GetUserLevelsDataParameters/${EmpId}/${Active}`); }
  GetSubOrdinates(EmpId: string, Level: string): Observable<any> { return this._UserService.get(`Utilities/GetSubordinates/${EmpId}/${Level}`); }
  GetHiringChecklist(): Observable<any> { return this._UserService.get('Utilities/GetHiringChecklist'); }
  GetAppraisalPeriods(): Observable<any> { return this._UserService.get('Utilities/GetAppraisalPeriods'); }
  GetSelectedEmployeePeriods(EmpId: string): Observable<any> { return this._UserService.get(`Utilities/GetSelectedEmployeePeriods/${EmpId}`); }

  // --- 6. THIS IS THE OPTIMIZED/FIXED METHOD ---
  GetEmployeeImage(empId: string | null): Observable<Blob | null> {
    if (!empId) {
      return of(null); // Return null immediately if no empId
    }

    // Use the exact path from your original file
    const url = `${this.apiUrl}/Utilities/GetEmployeeImage/${empId}`;

    // This call uses the injected 'http' (HttpClient) directly
    // because it needs a special responseType: 'blob'
    return this.http.get(url, {
      withCredentials: true,
      responseType: 'blob'
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Failed to load image for empId ${empId}:`, error.message);
        return of(null); // Return null so component can show a default
      })
    );
  }

  // --- Other Methods (Unchanged) ---
  isLeaveRequestForSubordinate(): Observable<any> { return this._UserService.get('LeaveRequest/isLeaveRequestForSubordinates'); }
  GetSubordinates(EmpId: string, Level: string): Observable<any> { return this._UserService.get(`LeaveRequest/GetSubordinates/${EmpId}/${Level}`); }
  GetLoginDetails(): Observable<any> { return this._UserService.get('Utilities/GetUserLoginDetails/'); }
  GetAuditTrailFeilds(): Observable<any> { return this._UserService.get('GetAuditTrailFeildsParameters/'); }
  GetEmployeePic(EmpId: string, CompanyId: string): Observable<any> { return this._UserService.get(`Utilities/GetEmployeePicParameters/${EmpId}/${CompanyId}`); }  
  GetAboutApplication(): Observable<any> { return this._UserService.get('GetAboutApplicationParameters/'); }
  GetAboutFormName(): Observable<any> { return this._UserService.get('GetAboutFormDescription'); }
  isMultiCompanyEnabled(): Observable<any> { return this._UserService.get('isMultiCompanyEnabled/'); }
  IsInternationalDeploymentEnabled(): Observable<any> { return this._UserService.get('IsInternationalDeploymentEnabled/'); }
  GetBreadCrumb(FormName: string): Observable<any> { return this._UserService.get(`GetBreadCrumb/${FormName}`); }
  IsInternationalDeployment(): Observable<any> { return this._UserService.get('Utilities/IsInternationalDeployment'); }
  GetEmployeeCurrencyId(EmpId: string, CompanyId: string): Observable<any> { return this._UserService.get(`Utilities/GetEmployeeCurrencyId/${EmpId}/${CompanyId}`); }
  GetCurrencyCode(currencyId: number, culture: string, CompanyId: string): Observable<any> { return this._UserService.get(`Utilities/GetCurrencyCode/${currencyId}/${culture}/${CompanyId}`); }

  // --- Label Helpers ---
  AppendAsteriskBeforeLabel(Text: string): string { return '*' + Text; }
  AppendColonAfterLabel(Text: string): string { return Text + ':'; }

}
