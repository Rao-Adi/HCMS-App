import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../interfaces/interfaces';
import { AppConfigService } from '@app/core/services/app-config';

export interface RoleCabinetMappingPayload {
  roleId: number;
  divisionCode: string;
  departmentCode?: string | null;
  subDepartmentCode?: string | null;
  businessDomainCode?: string | null;
}

/** Role <-> DMS Cabinet mapping (Setups configurations > Users > Role Cabinet Mapping). */
@Injectable({
  providedIn: 'root',
})
export class RoleCabinetMappingService {
  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  private get apiUrl(): string {
    if (!this._config.baseUrl) {
      console.error('CRITICAL: AppConfigService has no apiUrl. Config might not be loaded.');
      return '';
    }
    return `${this._config.baseUrl}/DMSRoleCabinetMapping`;
  }

  getAll(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/get-all-role-cabinet-mappings`);
  }

  create(payload: RoleCabinetMappingPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/create-role-cabinet-mapping`, payload);
  }

  update(payload: RoleCabinetMappingPayload & { id: number }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/update-role-cabinet-mapping`, payload);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/delete-role-cabinet-mapping/${id}`);
  }
}
