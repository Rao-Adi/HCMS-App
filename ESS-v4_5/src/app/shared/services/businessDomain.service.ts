import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
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
    const uri = `${environment.baseUrl}/DMSBusinessDomain/get-all-business-domain-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getBusinessDomainsByDivisionCode(dCode: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSBusinessDomain/get-departments-by-division-code?dCode=${dCode}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getBusinessDomainCount(): Observable<GenericResponse<Number>> {
    const uri = `${environment.baseUrl}/DMSBusinessDomain/get-business-domain-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllBusinessDomains(
    searchText: string,
    sortBy: 'ASC' | 'DESC',
    sortColumn: string,
    isActive: boolean,
    pageNumber: number,
    pageSize: number
  ): Observable<any> {
    const body = {
      searchText,
      sortBy,
      sortColumn,
      isActive,
      pageNumber,
      pageSize,
    };

    const uri = `${environment.baseUrl}/DMSBusinessDomain/get-all-business-domain`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(shortcut: BusinessDomain): Observable<BusinessDomain> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http
          .post<BusinessDomain>('/DMSBusinessDomain/create-business-domain', { shortcut })
          .pipe(
            map((newcabietStructureConfig) => {
              // Update the departments with the new shortcut
              this._departments.next([...departments, newcabietStructureConfig]);

              // Return the new shortcut from observable
              return newcabietStructureConfig;
            })
          )
      )
    );
  }

  update(shortcut: BusinessDomain): Observable<BusinessDomain> {
    const payload = {
      code: shortcut.code,
      name: shortcut.Name,
      isActive: true,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json-patch+json',
      accept: '*/*',
    });

    return this.http
      .put<BusinessDomain>(
        `${environment.baseUrl}/DMSBusinessDomain/update-business-domain`,
        payload,
        {
          headers,
        }
      )
      .pipe(
        tap((updated) => {
          // 🔹 Update cached state AFTER API success
          this.departments$.pipe(take(1)).subscribe((list) => {
            const index = list.findIndex((i) => i.code === updated.code);
            if (index !== -1) {
              const newList = [...list];
              newList[index] = updated;
              this._departments.next(newList);
            }
          });
        })
      );
  }

  delete(code: string): Observable<boolean> {
    return this.http
      .delete<boolean>(`${environment.baseUrl}/DMSBusinessDomain/delete-business-domain`, {
        params: { code },
      })
      .pipe(
        tap(() => {
          this.departments$.pipe(take(1)).subscribe((list) => {
            this._departments.next(list.filter((item) => item.code !== code));
          });
        })
      );
  }
}
