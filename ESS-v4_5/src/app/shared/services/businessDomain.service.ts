import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { BusinessDomain } from '../interfaces/businessdomain';

// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class BusinessDomainService {
  private _departments: ReplaySubject<BusinessDomain[]> = new ReplaySubject<BusinessDomain[]>(1);

  constructor(private http: HttpClient) {}

  get departments$(): Observable<BusinessDomain[]> {
    return this._departments.asObservable();
  }

  private getHeaders(): HttpHeaders {
    // Customize headers as needed (e.g., authorization token, content type)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Access-Control-Allow-Origin': '*'
      // Add any other headers you may need
    });
    return headers;
  }

  getBusinessDomainList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/get-all-business-domain-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getBusinessDomainsByDivisionCode(dCode: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/get-departments-by-division-code?dCode=${dCode}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllBusinessDomains(
    searchText: string,
    sortBy: 'ASC' | 'DESC',
    sortColumn: string,
    isActive: boolean,
    pageNo: number,
    pageSize: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('SearchText', searchText)
      .set('SortBy', sortBy)
      .set('SortColumn', sortColumn)
      .set('IsActive', isActive.toString())
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());

    const uri = `${environment.baseUrl}/get-all-business-domain`;

    return this.http.post(uri, null, {
      params,
      headers: this.getHeaders(),
    });
  }

  create(shortcut: BusinessDomain): Observable<BusinessDomain> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http.post<BusinessDomain>('create-business-domain', { shortcut }).pipe(
          map((newBusinessDomain) => {
            // Update the departments with the new shortcut
            this._departments.next([...departments, newBusinessDomain]);

            // Return the new shortcut from observable
            return newBusinessDomain;
          })
        )
      )
    );
  }

  update(code: string, shortcut: BusinessDomain): Observable<BusinessDomain> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http
          .patch<BusinessDomain>('update-business-domain', {
            code,
            shortcut,
          })
          .pipe(
            map((updatedBusinessDomain: BusinessDomain) => {
              // Find the index of the updated shortcut
              const index = departments.findIndex((item) => item.code === code);

              // Update the shortcut
              departments[index] = updatedBusinessDomain;

              // Update the departments
              this._departments.next(departments);

              // Return the updated shortcut
              return updatedBusinessDomain;
            })
          )
      )
    );
  }

  delete(code: string): Observable<boolean> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http.delete<boolean>('delete-business-domain', { params: { code } }).pipe(
          map((isDeleted: boolean) => {
            // Find the index of the deleted shortcut
            const index = departments.findIndex((item) => item.code === code);

            // Delete the shortcut
            departments.splice(index, 1);

            // Update the departments
            this._departments.next(departments);

            // Return the deleted status
            return isDeleted;
          })
        )
      )
    );
  }
}
