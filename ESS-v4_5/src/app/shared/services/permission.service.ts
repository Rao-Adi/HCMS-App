import { Injectable, inject } from '@angular/core';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { forkJoin, Observable } from 'rxjs';

export interface FormPermissions {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private _utilities = inject(UtilitiesService);
  
  getPermissions(formId: string): Observable<FormPermissions> {
    // forkJoin waits for all API calls to complete and returns them as a single object
    return forkJoin({
      canAdd: this._utilities.CanInsert(formId),
      canEdit: this._utilities.CanEdit(formId),
      canDelete: this._utilities.CanDelete(formId),
    });
  }
}