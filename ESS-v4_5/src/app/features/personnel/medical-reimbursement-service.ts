import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, throwError, catchError } from 'rxjs';
import { map, finalize, tap, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { DataService } from '@app/core/services/data.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
interface NetAmoutDto {
  amount: number;
  text: string;
}
interface CurrencyData {
  currencyId: number;
  currencyCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalReimbursementService {
  
  private http = inject(HttpClient);
  private _userService = inject(DataService);
  private _UtilitiesService = inject(UtilitiesService);
  // --- State Subjects (State Management) ---
  public conversionRate: number | null = null;
  private readonly _currencyCode = new BehaviorSubject<string>('');
  private readonly _isLoading = new BehaviorSubject<boolean>(false);
  private readonly _entitlements = new BehaviorSubject<any[]>([]);
  private readonly _transactions = new BehaviorSubject<any[]>([]);
  private readonly _netAmount = new BehaviorSubject<NetAmoutDto | null>(null);
  // --- Public Observables (For Component Consumption) ---
  public readonly currencyCode$ = this._currencyCode.asObservable();
  public readonly isLoading$ = this._isLoading.asObservable();
  public readonly entitlements$ = this._entitlements.asObservable();
  public readonly transactions$ = this._transactions.asObservable();
  public readonly netAmount$ = this._netAmount.asObservable();


  public refreshPageData(empId: string, companyId: string, fiscalYearId: number, dpdId: number, claimStatus: string, culture: string): Observable<void> {
    if (!fiscalYearId) {
      return new Observable<void>(observer => observer.complete());
    }

    this._isLoading.next(true);

    // 1. API calls as observables 
    const masterInfoUrl = `MedicalReimbursement/GetMasterMedicalInformation/${empId}/${dpdId}/${fiscalYearId}`;
    const transactionsUrl = `MedicalReimbursement/GetEmployeeMedical/${empId}/${claimStatus}/${companyId}/${fiscalYearId}`;
    const netAmountUrl = `MedicalReimbursement/GetEmployeeNetAmount/${empId}/${companyId}/${fiscalYearId}/${claimStatus}`;

    const apiCalls = {
      currency: this._UtilitiesService.GetEmployeeCurrencyId(empId, companyId),
      entitlements: this._userService.get(masterInfoUrl),
      transactions: this._userService.get(transactionsUrl),
      netAmount: this._userService.get(netAmountUrl)
    };
    return forkJoin(apiCalls as Record<keyof ApiResponses, Observable<any>>).pipe(
      tap((data: ApiResponses) => {
        this._entitlements.next(data.entitlements.masterMedicalInformation || []);
        this._transactions.next(data.transactions.EmpMedicalInfoData || []);

        if (data.netAmount.employeeNetAmount && data.netAmount.employeeNetAmount.length > 0) {
          const item = data.netAmount.employeeNetAmount[0];
          this._netAmount.next({ amount: item.Amount, text: item.AmountText });
        } else {
          this._netAmount.next(null);
        }
      }),
      switchMap((data: ApiResponses) => {
        const currencyId = (data.currency && data.currency.currencyId) ? Number(data.currency.currencyId) : 0;

        return this._UtilitiesService.GetCurrencyCode(currencyId, culture, companyId).pipe(
          tap((currencyCodeData: any) => {
            this._currencyCode.next((currencyCodeData && currencyCodeData.currencyCode) ? String(currencyCodeData.currencyCode) : '');
          }),
          map(() => data)
        );
      }),
      catchError(error => {
        console.error('Error refreshing medical data:', error);
        this._entitlements.next([]);
        this._transactions.next([]);
        this._netAmount.next(null);
        return throwError(() => error);
      }),
      finalize(() => {
        this._isLoading.next(false);
      }),
      map(() => undefined) // Return type Observable<void> ke liye
    ) as Observable<void>;
  }


  public getRecordForEdit(EmpId: string, RecordId: number): Observable<any> {
    const url = `MedicalReimbursement/GetEmployeeMedicalData/${EmpId}/${RecordId}`;
    return this._userService.get(url).pipe(
      map((response: any) => response.EmpMedical),
      catchError(error => {
        console.error('Error fetching record for edit:', error);
        return throwError(() => error); // Null ki bajaye error ko throw karein
      })
    );
  }
}
interface CurrencyResponse {
  currencyId?: string;
  // ...
}

interface EntitlementsResponse {
  masterMedicalInformation?: any[];
  // ...
}

interface TransactionsResponse {
  EmpMedicalInfoData?: any[];
  // ...
}

interface NetAmountResponse {
  employeeNetAmount?: { Amount: number, AmountText: string }[];
  // ...
}

// ⭐ Interface for ForkJoin ⭐
interface ApiResponses {
  currency: CurrencyResponse;
  entitlements: EntitlementsResponse;
  transactions: TransactionsResponse;
  netAmount: NetAmountResponse;
}

