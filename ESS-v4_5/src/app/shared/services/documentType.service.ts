import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { SelectList } from '../interfaces/interfaces';
//import { isArray } from 'lodash';
import { map, Observable, ReplaySubject, switchMap, take } from 'rxjs';
import { DocumentType } from '../interfaces/interfaces';

// import { Customer } from './customer';

@Injectable({ providedIn: 'root' })
export class DocumentTypeService {
  private _departments: ReplaySubject<DocumentType[]> = new ReplaySubject<DocumentType[]>(1);

  constructor(private http: HttpClient) {}

  get departments$(): Observable<DocumentType[]> {
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

  getDocumentTypeList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocumentType/get-all-document-type-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }


  getDocumentTypeCount(): Observable<GenericResponse<Number>> {
    const uri = `${environment.baseUrl}/DMSDocumentType/get-doucment-type-count`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }


  //   getDocumentTypesByDivisionCode(departmentCode: string): Observable<GenericResponse<any>> {
  //     const uri = `${environment.baseUrl}/get-documentType-by-department-code?departmentCode=${departmentCode}`;
  //     return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  //   }

  GetAllDocumentTypes(
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

    const uri = `${environment.baseUrl}/DMSDocumentType/get-all-document-types`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

    create(payload: { Code: string; Name: string; IsActive: boolean; IsDeleted: boolean }) {
      return this.http.post(`${environment.baseUrl}/DMSDocumentType/create-document-type`, payload);
    }
  
    update(payload: any) {
      return this.http.put(`${environment.baseUrl}/DMSDocumentType/update-document-type`, payload);
    }
  
    delete(code: string) {
      return this.http.delete(`${environment.baseUrl}/DMSDocumentType/delete-document-type/${code}`);
    }
 
}
