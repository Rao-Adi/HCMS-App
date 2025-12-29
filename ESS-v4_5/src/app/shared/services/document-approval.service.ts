import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@app/core/environments/environment';
import { GenericResponse } from '@app/core/models/response';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { DocumentApproval } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DocumentApprovalService {
  private _cabietStructureConfig = new ReplaySubject<DocumentApproval[]>(1);

  constructor(private http: HttpClient) {}

  get cabietStructureConfig$(): Observable<DocumentApproval[]> {
    return this._cabietStructureConfig.asObservable();
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

  getCabietStructureTabsList(): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocumentApproval/get-all-document-approval-list`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  getCabietTabsById(Id: string): Observable<GenericResponse<any>> {
    const uri = `${environment.baseUrl}/DMSDocumentApproval/get-document-approval-by-id/id=${Id}`;
    return this.http.get<GenericResponse<any>>(uri, { headers: this.getHeaders() });
  }

  GetAllCabietStructureTabs(
    searchText: string,
    sortBy: 'ASC' | 'DESC',
    sortColumn: string,
    isActive: boolean,
    pageNo: number,
    pageSize: number
  ): Observable<any> {
    const body = {
      searchText,
      sortBy,
      sortColumn,
      isActive,
      pageNo,
      pageSize,
    };

    const uri = `${environment.baseUrl}/DMSDocumentApproval/get-all-document-approval`;

    return this.http.post(uri, body, {
      headers: this.getHeaders(),
    });
  }

  create(shortcut: DocumentApproval): Observable<DocumentApproval> {
    return this.cabietStructureConfig$.pipe(
      take(1),
      switchMap((cabietStructureConfig) =>
        this.http
          .post<DocumentApproval>('/DMSDocumentApproval/create-document-approval', { shortcut })
          .pipe(
            map((newcabietStructureConfig) => {
              // Update the cabietStructureConfig with the new shortcut
              this._cabietStructureConfig.next([
                ...cabietStructureConfig,
                newcabietStructureConfig,
              ]);

              // Return the new shortcut from observable
              return newcabietStructureConfig;
            })
          )
      )
    );
  }

  update(shortcut: DocumentApproval): Observable<DocumentApproval> {
    const payload = {
      id: shortcut.id,
      documentVersionId: shortcut.documentVersionId,
      isActive: true,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json-patch+json',
      accept: '*/*',
    });

    return this.http
      .put<DocumentApproval>(
        `${environment.baseUrl}/DMSDocumentApproval/update-document-approval`,
        payload,
        {
          headers,
        }
      )
      .pipe(
        tap((updated) => {
          // 🔹 Update cached state AFTER API success
          this.cabietStructureConfig$.pipe(take(1)).subscribe((list) => {
            const index = list.findIndex((i) => i.id === updated.id);
            if (index !== -1) {
              const newList = [...list];
              newList[index] = updated;
              this._cabietStructureConfig.next(newList);
            }
          });
        })
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(`${environment.baseUrl}/DMSDocumentApproval/delete-document-approval`, {
        params: { id },
      })
      .pipe(
        tap(() => {
          this.cabietStructureConfig$.pipe(take(1)).subscribe((list) => {
            this._cabietStructureConfig.next(list.filter((item) => item.id !== id));
          });
        })
      );
  }
}
