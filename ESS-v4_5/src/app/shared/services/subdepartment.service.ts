import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { SubDepartment } from '../interfaces/interfaces';

// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class SubDepartmentService {
  private _departments: ReplaySubject<SubDepartment[]> = new ReplaySubject<SubDepartment[]>(1);

  constructor(private http: HttpClient) {}

  get departments$(): Observable<SubDepartment[]> {
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

  getSubDepartmentList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/get-all-subdepartment-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getSubDepartmentsByDivisionCode(departmentCode: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/get-subdepartment-by-department-code?departmentCode=${departmentCode}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllSubDepartments(
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

    const uri = `${environment.baseUrl}/get-all-subdepartment`;

    return this.http.post(uri, null, {
      params,
      headers: this.getHeaders(),
    });
  }

  create(shortcut: SubDepartment): Observable<SubDepartment> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http.post<SubDepartment>('create-subdepartment', { shortcut }).pipe(
          map((newSubDepartment) => {
            // Update the departments with the new shortcut
            this._departments.next([...departments, newSubDepartment]);

            // Return the new shortcut from observable
            return newSubDepartment;
          })
        )
      )
    );
  }

  update(code: string, shortcut: SubDepartment): Observable<SubDepartment> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http
          .patch<SubDepartment>('update-subdepartment', {
            code,
            shortcut,
          })
          .pipe(
            map((updatedSubDepartment: SubDepartment) => {
              // Find the index of the updated shortcut
              const index = departments.findIndex((item) => item.code === code);

              // Update the shortcut
              departments[index] = updatedSubDepartment;

              // Update the departments
              this._departments.next(departments);

              // Return the updated shortcut
              return updatedSubDepartment;
            })
          )
      )
    );
  }

  delete(code: string): Observable<boolean> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http.delete<boolean>('delete-subdepartment', { params: { code } }).pipe(
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
