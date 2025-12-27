import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';

@Component({
  selector: 'app-misc-policies',
  imports: [CommonModule, AgGridWrapper],
  templateUrl: './misc-policies.html',
  styleUrl: './misc-policies.css',
})
export class MiscPolicies {
  selectedTab: string = 'TrainingPoliciy';
  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';

  UploadColumnDefs = [
    { field: 'documentType', headerName: 'Document Types', flex: 1 },
    {
      field: 'traningRequired',
      headerName: 'TraningRequired',
      flex: 1,
      cellEditor: 'agCheckboxCellEditor',
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
}
