import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
@Component({
  selector: 'app-personalized-email-alerts',
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    NzSelectModule,
    AgGridWrapper,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    NzCheckboxModule
  ],
  templateUrl: './personalized-email-alerts.html',
  styleUrl: './personalized-email-alerts.css',
})
export class PersonalizedEmailAlerts {
  selectedTab: string = 'Filtering Criteria';

  pageSize = 10;
  rowData: any[] = [];
  totalRows = 0;
  checked = true;

  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';

  constructor() {}

  ngOnInit() {}

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };
  public noRowsOverlay: string = '';

  documentTypes: SelectList[] = [
    { CODE: '1', NAME: 'Policy' },
    { CODE: '2', NAME: 'SOP' },
    { CODE: '3', NAME: 'Manual' },
  ];
  divisions: SelectList[] = [
    { CODE: '1', NAME: 'Marketing Division' },
    { CODE: '2', NAME: 'Software Division' },
  ];
  companies: SelectList[] = [
    { CODE: '1', NAME: 'ATCO' },
    { CODE: '2', NAME: 'Softronic' },
  ];
  departments: SelectList[] = [
    { CODE: '1', NAME: 'Marketing' },
    { CODE: '2', NAME: 'IT' },
    { CODE: '3', NAME: 'Finance' },
    { CODE: '4', NAME: 'HR' },
  ];
  subDepartments: SelectList[] = [
    { CODE: '1', NAME: 'Digital Marketing' },
    { CODE: '2', NAME: 'Software Marketing' },
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
}
