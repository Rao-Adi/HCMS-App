import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { NotificationService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentTypeService } from '@app/shared/services/documentType.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { TrainingPolicyService } from '@app/shared/services/training-policy-service';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  selector: 'app-misc-policies',
  imports: [
    CommonModule,
    NzIconModule,
    NzSwitchModule,
    AgGridWrapper,
    NzModalModule,
    EditableAgGridWrapper,
  ],
  templateUrl: './misc-policies.html',
  styleUrl: './misc-policies.css',
})
export class MiscPolicies {
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'miscpolicies';

  gridConfig: GridConfig = {} as GridConfig;
  selectedTab: string = 'TrainingPoliciy';
  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';
  value!: boolean;
  pageSize = 10;
  trainingPolicesData: any[] = [];
  documentAttributeData: any[] = [];
  documentTypesList: any[] = [];

  // Store page sizes for each grid separately
  divisionPageSize = 10;
  employeePageSize = 10;
  // add more as needed...
  selectedPageSize = 10; // default value

  totalDocumentReview = 0;
  totalTrainingPolicies = 0;
  public noRowsOverlay: string = '';
  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: false,
    cellDataType: false,
    editable: true,
  };

  documentReviewColumnDef = [
    { field: 'documentType', headerName: 'Document Types', flex: 1 },
    { field: 'reviewAfter', headerName: 'Review After (in years)', flex: 1 },
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

  pinnedTopRowDataPlanning: DocumentAttributeColumns[] = [
    {
      documentTypeCode: '',
      traningRequired: false,
      minimumscoreforpassing: 0,
    },
  ];

  constructor(
    private _trainingPolicyService: TrainingPolicyService,
    private _documentTypes: DocumentTypeService,
    private _notification: NotificationService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
    });

    this.getDocumentTypeList();
  }

  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: 10,
      pageSizeOptions: [10, 20, 50, 100],
      enableSorting: true,
      enableFiltering: true,
      enableSelection: true,
      enableInlineAdd: this.canAdd,
      enableInlineEdit: this.canEdit,
      enableInlineDelete: this.canDelete,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };

    this.GetAllTrainingPolicy({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'documentTypeCode',
        headerName: 'Document Type',
        type: 'dropdown',
        dropdownOptions: this.documentTypesList,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },
      {
        field: 'traningRequired',
        headerName: 'traningRequired',
        type: 'switch',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'minimumscoreforpassing',
        headerName: 'minimumscoreforpassing',
        type: 'number',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
    ];
  }

  private generateId(): number {
    return Date.now();
  }

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  GetAllDocumentReview(query: any) {}

  GetAllTrainingPolicy(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._trainingPolicyService
      .GetAllTrainingPolicies(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        if (res?.Success && res.Data?.Items) {
          this.trainingPolicesData = res.Data.Items.map((item: any) => ({
            Id: item.id || item.Id,
            documentTypeCode: item.documentTypeCode || item.DocumentTypeCode,
            traningRequired: item.trainingRequired || item.TrainingRequired,
            minimumscoreforpassing: item.minimumScore || item.MinimumScore,
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          }));
          //console.log('Mapped documentTypeData:', this.documentTypeData);
        } else {
          this.trainingPolicesData = [];
        }
        //this.cdr.detectChanges(); // force update
      });
  }

  getDocumentTypeList = () => {
    this._documentTypes.getDocumentTypeList().subscribe((res) => {
      if (res?.Data) {
        this.documentTypesList = res.Data.map((d: any) => ({
          id: d.Code,
          text: d.Value,
        }));
      } else {
        this.documentTypesList = [];
      }

      // ✅ build grid AFTER dropdown data is ready
      this.buildGrid();
    });
  };

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  onRowAdded(event: { rowData: any }): void {
    const { rowData } = event;
    debugger;
    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      documentTypeCode: rowData.documentType || rowData.documentType,
      trainingRequired: rowData.traningRequired || rowData.traningRequired,
      minimumScore: rowData.minimumscoreforpassing || rowData.minimumscoreforpassing,
    };

    this._trainingPolicyService.create(payLoad).subscribe(() => {
      this._notification.createNotification(
        'sucess',
        'Distribution List',
        'Distribution list added successfully!',
      );
    });
    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      documentType: rowData.documentType,
      traningRequired: rowData.traningRequired,
      minimumscoreforpassing: rowData.minimumscoreforpassing,
    };

    this.documentAttributeData = [rowWithId, ...this.documentAttributeData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    console.log('Row updated:', event);
    debugger;
    // Update display names
    // event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
    // event.rowData.departmentName = this.getDisplayName(
    //   this.departments,
    //   event.rowData.departmentId,
    // );
    // event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

    this.documentAttributeData[event.index] = { ...event.rowData };
    this.documentAttributeData = [...this.documentAttributeData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    console.log('Row deleted at index:', rowIndex);
    this.documentAttributeData.splice(rowIndex, 1);
    this.documentAttributeData = [...this.documentAttributeData];
  }

  onCellValueChanged(event: any): void {
    //console.log('Cell value changed:', event);

    console.log('PARENT received:', event);
    if (!event?.data) return;
  }

  onSelectionChanged(selectedRows: any[]): void {
    console.log('Selected rows:', selectedRows);
  }

  handleGridAction(event: { action: string; rowData: any }) {
    if (event.action === 'VIEW_CABINET') {
    }
  }

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

class DocumentAttributeColumns {
  documentTypeCode: string = '';
  traningRequired: boolean = false;
  minimumscoreforpassing: number = 0;
}
