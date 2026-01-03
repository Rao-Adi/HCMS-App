import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { Designation, SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class DesignationService {
  private _designations: ReplaySubject<Designation[]> = new ReplaySubject<Designation[]>(1);

  constructor(private http: HttpClient) {}

  get designations$(): Observable<Designation[]> {
    return this._designations.asObservable();
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

  getDesignationList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDesignation/get-all-designation-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllDesignations(
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

    const uri = `${environment.baseUrl}/DMSDesignation/get-all-designations`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(shortcut: Designation): Observable<Designation> {
    return this.designations$.pipe(
      take(1),
      switchMap((designations) =>
        this.http.post<Designation>('/DMSDesignation/create-designation', { shortcut }).pipe(
          map((newDesignation) => {
            // Update the designations with the new shortcut
            this._designations.next([...designations, newDesignation]);

            // Return the new shortcut from observable
            return newDesignation;
          })
        )
      )
    );
  }

  update(code: string, shortcut: Designation): Observable<Designation> {
    return this.designations$.pipe(
      take(1),
      switchMap((designations) =>
        this.http
          .patch<Designation>('/DMSDesignation/update-designation', {
            code,
            shortcut,
          })
          .pipe(
            map((updatedDesignation: Designation) => {
              // Find the index of the updated shortcut
              const index = designations.findIndex((item) => item.Code === code);

              // Update the shortcut
              designations[index] = updatedDesignation;

              // Update the designations
              this._designations.next(designations);

              // Return the updated shortcut
              return updatedDesignation;
            })
          )
      )
    );
  }

  delete(code: string): Observable<boolean> {
    return this.designations$.pipe(
      take(1),
      switchMap((designations) =>
        this.http.delete<boolean>('/DMSDesignation/delete-designation', { params: { code } }).pipe(
          map((isDeleted: boolean) => {
            // Find the index of the deleted shortcut
            const index = designations.findIndex((item) => item.Code === code);

            // Delete the shortcut
            designations.splice(index, 1);

            // Update the designations
            this._designations.next(designations);

            // Return the deleted status
            return isDeleted;
          })
        )
      )
    );
  }
}