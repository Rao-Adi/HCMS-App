import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { ApiResponse, Division, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class DivisionService {
  private _divisions: ReplaySubject<Division[]> = new ReplaySubject<Division[]>(1);

  constructor(private http: HttpClient) {}

  get divisions$(): Observable<Division[]> {
    return this._divisions.asObservable();
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

  getDivisionList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDivision/get-all-division-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDivisionCount(): Observable<GenericResponse<Number>> {
    const uri = `${environment.baseUrl}/DMSDivision/get-division-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDivisions(
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

    const uri = `${environment.baseUrl}/DMSDivision/get-all-divisions`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDivision/create-division`,
      payload
    );
  }

  update(payload: any) {
    return this.http.put<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDivision/update-division`,
      payload
    );
  }

  delete(code: string) {
    return this.http.delete<ApiResponse<any>>(
      `${environment.baseUrl}/DMSDivision/delete-division/${code}`
    );
  }

  // create(shortcut: Division): Observable<Division> {
  //   return this.divisions$.pipe(
  //     take(1),
  //     switchMap((divisions) =>
  //       this.http.post<Division>('/DMSDivision/create-division', { shortcut }).pipe(
  //         map((newDivision) => {
  //           // Update the divisions with the new shortcut
  //           this._divisions.next([...divisions, newDivision]);

  //           // Return the new shortcut from observable
  //           return newDivision;
  //         })
  //       )
  //     )
  //   );
  // }

  // update(shortcut: Division): Observable<Division> {
  //   return this.divisions$.pipe(
  //     take(1),
  //     switchMap((divisions) =>
  //       this.http
  //         .patch<Division>('/DMSDivision/update-division', {
  //           shortcut,
  //         })
  //         .pipe(
  //           map((updatedDivision: Division) => {
  //             // Find the index of the updated shortcut
  //             const index = divisions.findIndex((item) => item.Code === updatedDivision.Code);

  //             // Update the shortcut
  //             divisions[index] = updatedDivision;

  //             // Update the divisions
  //             this._divisions.next(divisions);

  //             // Return the updated shortcut
  //             return updatedDivision;
  //           })
  //         )
  //     )
  //   );
  // }

  // delete(code: string): Observable<boolean> {
  //   return this.divisions$.pipe(
  //     take(1),
  //     switchMap((divisions) =>
  //       this.http.delete<boolean>('/DMSDivision/delete-division', { params: { code } }).pipe(
  //         map((isDeleted: boolean) => {
  //           // Find the index of the deleted shortcut
  //           const index = divisions.findIndex((item) => item.Code === code);

  //           // Delete the shortcut
  //           divisions.splice(index, 1);

  //           // Update the divisions
  //           this._divisions.next(divisions);

  //           // Return the deleted status
  //           return isDeleted;
  //         })
  //       )
  //     )
  //   );
  // }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // OrderHold(orderList: SelectList): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/Organization/OrderHold`;
  //   return this.http.post<GenericResponse<any>>(uri, orderList, { headers: this.getHeaders() });
  // }

  // OrderProcess(orderList: SelectList) {
  //   const uri = `${environment.baseUrl}/Organization/OrderProcess`;
  //   return this.http.post<GenericResponse<any>>(uri, orderList, { headers: this.getHeaders() });
  // }

  // OrderReject(orderList) {
  //   const uri = `${environment.baseUrl}/Organization/OrderReject`;
  //   return this.http.post<GenericResponse<any>>(uri, orderList, { headers: this.getHeaders() });
  // }

  // GetRejectionReasons(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/Common/GetReasons`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // getOrganizationData(
  //   pageIndex: number,
  //   pageSize: number,
  //   sortField: Array<{ key: string; value: string }>,
  //   filters: Array<{ key: string; value: string }>,
  //   rejected = 'false'
  // ): Observable<any> {

  //   const payload = {
  //     "sortArray": sortField,
  //     "filterArray": filters.map((filter) => {
  //       return {
  //         ...filter,
  //         value: isArray(filter.value) ? filter.value[0] : filter.value
  //       }
  //     }),
  //     "pageIndex": pageIndex,
  //     "pageSize": pageSize,

  //   }

  //   payload.filterArray.push({ "key": "rejected", "value": rejected.toString() })
  //   const uri = `${environment.baseUrl}/Organization/GetOrderMasterData`;
  //   return this.http.post(uri, payload, { headers: this.getHeaders() });
  // }

  // getExportData(
  //   pageIndex: number,
  //   pageSize: number,
  //   sortField: Array<{ key: string; value: string }>,
  //   filters: Array<{ key: string; value: string }>,
  //   rejected = 'false'
  // ): Observable<any> {

  //   const payload = {
  //     "sortArray": sortField,
  //     "filterArray": filters.map((filter) => {
  //       return {
  //         ...filter,
  //         value: isArray(filter.value) ? filter.value[0] : filter.value
  //       }
  //     }),
  //     "pageIndex": pageIndex,
  //     "pageSize": pageSize,

  //   }

  //   payload.filterArray.push({ "key": "rejected", "value": rejected.toString() })
  //   const uri = `${environment.baseUrl}/Organization/DownloadAdminOrderMasterData`;
  //   return this.http.post(uri, payload, { headers: this.getHeaders() , responseType: 'arraybuffer'});
  // }

  // getAdminData(
  //   pageIndex: number,
  //   pageSize: number,
  //   sortField: Array<{ key: string; value: string }>,
  //   filters: Array<{ key: string; value: string }>,
  //   rejected = 'false'
  // ): Observable<any> {

  //   const payload = {
  //     "sortArray": sortField,
  //     "filterArray": filters.map((filter) => {
  //       return {
  //         ...filter,
  //         value: isArray(filter.value) ? filter.value[0] : filter.value
  //       }
  //     }),
  //     "pageIndex": pageIndex,
  //     "pageSize": pageSize,

  //   }

  //   payload.filterArray.push({ "key": "rejected", "value": rejected.toString() })
  //   const uri = `${environment.baseUrl}/Organization/GetAdminOrderMasterData`;
  //   return this.http.post(uri, payload, { headers: this.getHeaders() });
  // }

  // getOrgProcessOrderHistory(
  //   pageIndex: number,
  //   pageSize: number,
  //   sortField: Array<{ key: string; value: string }>,
  //   filters: Array<{ key: string; value: string }>,
  //   rejected = 'false'
  // ): Observable<any> {

  //   const payload = {
  //     "sortArray": sortField,
  //     "filterArray": filters.map((filter) => {
  //       return {
  //         ...filter,
  //         value: isArray(filter.value) ? filter.value[0] : filter.value
  //       }
  //     }),
  //     "pageIndex": pageIndex,
  //     "pageSize": pageSize,

  //   }

  //   payload.filterArray.push({ "key": "rejected", "value": rejected.toString() })
  //   const uri = `${environment.baseUrl}/Organization/GetOrderHistory`;
  //   return this.http.post(uri, payload, { headers: this.getHeaders() });
  // }

  // getOrderProccessingData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetOrderProcessingData`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // GetTotalRegistrationsData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetTotalRegistrations`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // GetTotalMaritalStatusRegistrationsData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetTotalMaritalStatusRegistrations`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // GetDeliveryLocationData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetDeliveryLocationData`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // GetOrganizationDonationData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetOrganizationDonation`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // GetOrganizationDeliveryData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetOrganizationDeliveryData`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // GetDailyOrderStatusData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetDailyOrderStatus`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // GetDonationBifurcationData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetDonationBifurcation`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }

  // GetDistributionBifurcationData(): Observable<GenericResponse<any>> {
  //   const uri = `${environment.baseUrl}/DashboardReport/GetDistributionBifurcation`;
  //   return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  // }
}
