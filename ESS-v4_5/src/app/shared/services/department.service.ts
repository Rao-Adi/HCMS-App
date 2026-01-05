import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { Department } from '../interfaces/interfaces';

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
    const uri = `${environment.baseUrl}/DMSDepartment/get-all-department-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDepartmentsByDivisionCode(dCode: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDepartment/get-departments-by-division-code/${dCode}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getDepartmentCount(): Observable<GenericResponse<Number>> {
    const uri = `${environment.baseUrl}/DMSDepartment/get-department-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDepartments(
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

    const uri = `${environment.baseUrl}/DMSDepartment/get-all-departments`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(shortcut: Department): Observable<Department> {
    return this.departments$.pipe(
      take(1),
      switchMap((departments) =>
        this.http.post<Department>('/DMSDepartment/create-department', { shortcut }).pipe(
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
          .patch<Department>('/DMSDepartment/update-department', {
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
        this.http.delete<boolean>('/DMSDepartment/delete-department', { params: { code } }).pipe(
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
