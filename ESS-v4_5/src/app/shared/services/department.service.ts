import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { Department } from '../interfaces/department';

// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private _departments: ReplaySubject<Department[]> = new ReplaySubject<Department[]>(1);

  constructor(private http: HttpClient) {}

  get departments$(): Observable<Department[]> {
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

  getDepartmentList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/get-all-department-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDepartments(
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

    const uri = `${environment.baseUrl}/get-all-departments`;

    return this.http.post(uri, null, {
      params,
      headers: this.getHeaders(),
    });
  }

  create(shortcut: Department): Observable<Department> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http.post<Department>('create-department', { shortcut }).pipe(
          map((newDepartment) => {
            // Update the departments with the new shortcut
            this._departments.next([...departments, newDepartment]);

            // Return the new shortcut from observable
            return newDepartment;
          })
        )
      )
    );
  }

  update(code: string, shortcut: Department): Observable<Department> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http
          .patch<Department>('update-department', {
            code,
            shortcut,
          })
          .pipe(
            map((updatedDepartment: Department) => {
              // Find the index of the updated shortcut
              const index = departments.findIndex((item) => item.code === code);

              // Update the shortcut
              departments[index] = updatedDepartment;

              // Update the departments
              this._departments.next(departments);

              // Return the updated shortcut
              return updatedDepartment;
            })
          )
      )
    );
  }

  delete(code: string): Observable<boolean> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http.delete<boolean>('delete-department', { params: { code } }).pipe(
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
