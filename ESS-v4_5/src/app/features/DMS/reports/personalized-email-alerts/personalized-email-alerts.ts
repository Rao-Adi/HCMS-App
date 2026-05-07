import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CabinetSelection, SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { PermissionService } from '@app/shared/services/permission.service';

@Component({
  selector: 'app-personalized-email-alerts',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    NzCheckboxModule,
    CabinetStructureList,
    DocumentTypeList,
  ],
  templateUrl: './personalized-email-alerts.html',
  styleUrl: './personalized-email-alerts.css',
})
export class PersonalizedEmailAlerts {
  selectedTab: string = 'Filtering Criteria';

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'emailalertpolicy';

  pageSize = 10;
  rowData: any[] = [];
  totalRows = 0;
  checked = true;

  selectedDivisions?: string = '';
  selectedDepartment?: string = '';
  selectedSubDepartment?: string = '';
  selectedBusinessDomain?: string = '';
  selectedDocumentType?: string = '';

  constructor(private _permissionService: PermissionService) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });
  }

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  emailFrequencies: SelectList[] = [
    { CODE: '1', NAME: 'Marketing Division' },
    { CODE: '2', NAME: 'Software Division' },
  ];
  companies: SelectList[] = [
    { CODE: '1', NAME: 'ATCO' },
    { CODE: '2', NAME: 'Softronic' },
  ];
  emailtobesend: SelectList[] = [
    { CODE: '1', NAME: 'Marketing' },
    { CODE: '2', NAME: 'IT' },
    { CODE: '3', NAME: 'Finance' },
    { CODE: '4', NAME: 'HR' },
  ];
  emailnumberdays: SelectList[] = [
    { CODE: '1', NAME: '1' },
    { CODE: '2', NAME: '2' },
  ];

  atributeTypes: SelectList[] = [
    { CODE: '1', NAME: 'Submit date' },
    { CODE: '2', NAME: 'Document Descriptoin' },
    { CODE: '3', NAME: 'Contract Type' },
  ];

  selectedAuthorityType: number | null = null;

  onAuthorityTypeChange(value: number | null): void {
    this.selectedAuthorityType = value;
  }

  onDivisionChange(value: string): void {
    this.selectedDivisions = value;
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
  }
  onDepartmentsChange(value: string): void {
    this.selectedDepartment = value;
    this.selectedSubDepartment = '';
  }

  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;
  }

  onHierarchyChange(values: CabinetSelection[]) {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? null;
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
  }
}
