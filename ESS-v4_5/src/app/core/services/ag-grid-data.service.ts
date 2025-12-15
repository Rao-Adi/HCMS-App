import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AgGridRequest } from '../models/ag-grid-request.model';

@Injectable({ providedIn: 'root' })
export class AgGridDataService {
  constructor(private http: HttpClient) {}

  loadData(url: string, payload: AgGridRequest): Observable<any> {
    return this.http.post<any>(url, payload);
  }
}
