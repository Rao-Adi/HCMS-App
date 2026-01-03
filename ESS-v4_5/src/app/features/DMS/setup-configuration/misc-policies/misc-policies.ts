import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  selector: 'app-misc-policies',
  imports: [CommonModule, NzIconModule, NzSwitchModule, AgGridWrapper, NzModalModule],
  templateUrl: './misc-policies.html',
  styleUrl: './misc-policies.css',
})
export class MiscPolicies {
  selectedTab: string = 'TrainingPoliciy';
  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';
  value!: boolean;
  UploadColumnDefs = [
    { field: 'documentType', headerName: 'Document Types', flex: 1 },
    {
      field: 'traningRequired',
      headerName: 'TraningRequired',
      flex: 1,
      cellEditor: 'agCheckboxCellEditor',
      cellRenderer: (params: any) => {
        return `
          <nz-switch [(ngModel)]="switchValue1"></nz-switch>
      `;
      },
    },
    {
      field: 'minimumscoreforpassing',
      headerName: '	Minimum score for passing',
      flex: 1,
      cellDataType: 'number',
      cellEditorParams: {
        min: 0,
        max: 300,
      },
    },
  ];

  documentReviewColumnDef = [
    { field: 'documentType', headerName: 'Document Types', flex: 1 },
    { field: 'reviewAfter', headerName: 'Review After (in years)', flex: 1 },
  ];
  pageSize = 10;
  rowData: any[] = [
    {
      documentType: 'SOP',
      traningRequired: false,
      minimumscoreforpassing: 0,
    },
    {
      documentType: 'Playbooks',
      traningRequired: false,
      minimumscoreforpassing: 0,
    },
    {
      documentType: 'Policies',
      traningRequired: false,
      minimumscoreforpassing: 0,
    },
  ];
  documentReviewRowData: any[] = [
    {
      documentType: 'SOP',
      reviewAfter: 0,
    },
    {
      documentType: 'Playbooks',
      reviewAfter: 0,
    },
    {
      documentType: 'Policies',
      reviewAfter: 0,
    },
  ];

  totalDocumentReview = 0;
  totalTrainingPolicies = 0;
  public noRowsOverlay: string = '';
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: false,
    cellDataType: false,
    editable: true,
  };

  constructor() {}

  ngOnInit() {
    //this.loadData(this.pageSize);
  }
  GetAllDocumentReview(query: any) {}

  GetAllTrainingPolicy(query: any) {}

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 1; // default value

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    switch (gridId) {
      case 'TrainingPoliciyGrid':
        this.divisionPageSize = pageSize;
        this.GetAllDocumentReview({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;

      case 'DocumentReview':
        this.employeePageSize = pageSize;
        this.GetAllDocumentReview({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;
      default:
        break;
    }
  }
}
