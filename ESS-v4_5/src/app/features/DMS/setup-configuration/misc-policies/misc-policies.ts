import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentReviewPolicyService } from '@app/shared/services/document-review-policy.service';
import { DocumentTrainingAuthorizationService } from '@app/shared/services/document-training-authorization.service';
import { DocumentTypeService } from '@app/shared/services/documentType.service';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
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
  formId = 'trainingpolicy';

  gridConfig: GridConfig = {} as GridConfig;
  authGridConfig: GridConfig = {} as GridConfig;
  documentReviewGridConfig: GridConfig = {} as GridConfig;
  selectedTab: string = 'TrainingPoliciy';
  value!: boolean;
  pageSize = 10;
  trainingPolicesData: any[] = [];
  documentTypesList: any[] = [];
  documentReviewRowData: any[] = [];
  authorizationPolicyData: any[] = [];

  // add more as needed...
  selectedPageSize = 10; // default value

  totalDocumentReview = 0;
  totalTrainingPolicies = 0;

  pinnedTopRowDataAuthorization: any[] = [
    {
      documentTypeCode: '',
      authorizationRequired: false,
      authorizingAuthority: '',
    },
  ];

  AuthorizationPolicyList: any[] = [];

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: false,
    cellDataType: false,
    editable: true,
  };

  pinnedTopRowDataDocumentReview: any[] = [
    {
      documentType: '',
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
    private _notificationToastService: NotificationToastService,
    private _permissionService: PermissionService,
    private _documentTrainingAuthorizationService: DocumentTrainingAuthorizationService,
    private _peoplePartnerService: PeoplePartnersService,
    private _documentReviewPolicyService: DocumentReviewPolicyService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.getDocumentTypeList();
    });
  }

  onTabChange(tab: string) {
    this.selectedTab = tab;
    if (tab === 'TrainingPoliciy') {
      this.buildTrainingPolicyGrid();
    } else if (tab === 'DocumentReview') {
      this.buildDocumentReviewGrid();
    } else {
      this.buildAuthorizationPolicyGrid();
    }
  }

  private buildTrainingPolicyGrid(): void {
    this.gridConfig = {
      columns: this.getTrainingPolicyColumns(),
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

  private getTrainingPolicyColumns(): GridColumn[] {
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
        headerName: 'Training Period',
        type: 'switch',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'minimumscoreforpassing',
        headerName: 'Minimum Score for Passing',
        type: 'number',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
    ];
  }

  private buildDocumentReviewGrid(): void {
    this.documentReviewGridConfig = {
      columns: this.getDocumentReviewColumns(),
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

    this.GetAllDocumentReviewPolicies({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  private getDocumentReviewColumns(): GridColumn[] {
    return [
      {
        field: 'documentType',
        headerName: 'Document Type',
        type: 'dropdown',
        dropdownOptions: this.documentTypesList,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
      },
      {
        field: 'reviewAfter',
        headerName: 'Review After (in years)',
        type: 'number',
        required: false,
      },
    ];
  }

  private buildAuthorizationPolicyGrid(): void {
    this.authGridConfig = {
      columns: this.getAuthorizationPolicyColumns(),
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

    this.getAllUsersList();

    this.GetDocumentTrainingAuthorization({
      pageNumber: 1,
      pageSize: this.pageSize,
      sortModel: [],
      filterModel: {},
    });
  }

  private getAuthorizationPolicyColumns(): GridColumn[] {
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
        field: 'authorizationRequired',
        headerName: 'Authorization Required',
        type: 'switch',
        required: false,
      },
      {
        field: 'authorizingAuthority',
        headerName: 'Authorizing Authority',
        type: 'dropdown',
        dropdownOptions: this.AuthorizationPolicyList,
        dropdownValueField: 'value',
        dropdownDisplayField: 'label',
        required: true,
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

  GetAllDocumentReviewPolicies(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._documentReviewPolicyService
      .GetAllDocumentReviewPolicies(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        const items = res?.Data?.Items || res?.Items;
        if (items) {
          this.documentReviewRowData = items.map((item: any) => ({
            Id: item.id || item.Id,
            documentType: item.documentTypeCode || item.DocumentTypeCode, 
            reviewAfter: item.reviewPeriodYears || item.ReviewPeriodYears,
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          }));
        } else {
          this.documentReviewRowData = [];
        }
      });
  }

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
        const items = res?.Data?.Items || res?.Items;
        if (items) {
          this.trainingPolicesData = items.map((item: any) => ({
            Id: item.id || item.Id,
            documentTypeCode: item.documentTypeCode || item.DocumentTypeCode,
            traningRequired: item.trainingRequired || item.TrainingRequired,
            minimumscoreforpassing: item.minimumScore || item.MinimumScore,
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          }));
        } else {
          this.trainingPolicesData = [];
        }
      });
  }

  GetDocumentTrainingAuthorization(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._documentTrainingAuthorizationService
      .GetAllDocumentTrainingAuthorizations(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        const items = res?.Data?.Items || res?.Items;
        if (items) {
          this.authorizationPolicyData = items.map((item: any) => ({
            Id: item.id || item.Id,
            documentTypeCode: item.documentTypeCode || item.DocumentTypeCode,
            authorizationRequired: item.authorizationRequired || item.AuthorizationRequired,
            authorizingAuthority: item.authorizingUser || item.AuthorizingUser,
            IsActive: item.isActive || item.IsActive,
            IsDeleted: item.isDeleted || item.IsDeleted,
            CreatedBy: item.createdBy || item.CreatedBy || '',
            CreatedAt: new CustomDateFormatPipe().transform(item.createdAt || item.CreatedAt || ''),
          }));
        } else {
          this.authorizationPolicyData = [];
        }
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
      this.buildTrainingPolicyGrid();
      this.buildDocumentReviewGrid();
      this.buildAuthorizationPolicyGrid();
      // if (this.selectedTab === 'DocumentReview') {
      //   this.documentReviewGridConfig = {
      //     ...this.documentReviewGridConfig,
      //     columns: this.getDocumentReviewColumns(),
      //   };
      // }
    });
  };

  getAllUsersList = () => {
    this._peoplePartnerService.GetEmployeeList().subscribe((res) => {
      if (res?.Data) {
        this.AuthorizationPolicyList = (res.Data ?? []).map((d: any) => ({
          value: d.Code || d.code,
          label: d.Value + ' (' + d.Code + ')' || d.value,
        }));
      } else {
        this.AuthorizationPolicyList = [];
      }

      // ✅ Update grid columns after dropdown data is ready
      if (this.selectedTab !== 'TrainingPoliciy' && this.selectedTab !== 'DocumentReview') {
        this.authGridConfig = {
          ...this.authGridConfig,
          columns: this.getAuthorizationPolicyColumns(),
        };
      }
    });
  };

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  onTrainingPoliciyRowAdded(event: { rowData: any }): void {
    const { rowData } = event;
    // Add logic to generate IDs, validate, etc.
    const payLoad = {
      documentTypeCode: rowData.documentTypeCode || rowData.DocumentTypeCode,
      trainingRequired: rowData.traningRequired || rowData.traningRequired,
      minimumScore: rowData.minimumscoreforpassing || rowData.minimumscoreforpassing,
    };

    this._trainingPolicyService.create(payLoad).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Training Policy',
        'Training policy added successfully!',
      );
    });
    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      documentType: rowData.documentType,
      traningRequired: rowData.traningRequired,
      minimumscoreforpassing: rowData.minimumscoreforpassing,
    };

    this.trainingPolicesData = [rowWithId, ...this.trainingPolicesData];
  }

  onAuthPolicyRowAdded(event: { rowData: any }): void {
    const { rowData } = event;
    if (!rowData.authorizingAuthority) {
      this._notificationToastService.createNotification(
        'error',
        'Authorization Policy',
        'Authorizing Authority is required!',
      );
      return;
    }
    const payLoad = {
      documentTypeCode: rowData.documentTypeCode,
      authorizationRequired: rowData.authorizationRequired,
      authorizingUserId: rowData.authorizingAuthority,
    };

    this._documentTrainingAuthorizationService.create(payLoad).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Authorization Policy',
        'Authorization policy added successfully!',
      );
    });

    const rowWithId = { ...rowData, id: this.generateId() };
    this.authorizationPolicyData = [rowWithId, ...this.authorizationPolicyData];
  }

  onAuthPolicyRowUpdated(event: { rowData: any; index: number }): void {
    const { rowData } = event;
    if (!rowData.authorizingAuthority) {
      this._notificationToastService.createNotification(
        'error',
        'Authorization Policy',
        'Authorizing Authority is required!',
      );
      return;
    }
    const payLoad = {
      id: rowData.Id,
      documentTypeCode: rowData.documentTypeCode,
      authorizationRequired: rowData.authorizationRequired,
      authorizingUserId: rowData.authorizingAuthority,
    };

    this._documentTrainingAuthorizationService.update(payLoad).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Authorization Policy',
        'Authorization policy updated successfully!',
      );
    });

    this.authorizationPolicyData[event.index] = { ...event.rowData };
    this.authorizationPolicyData = [...this.authorizationPolicyData];
  }

  onAuthPolicyRowDeleted(rowIndex: number): void {
    const row = this.authorizationPolicyData[rowIndex];
    if (row && row.Id) {
      this._documentTrainingAuthorizationService.delete(row.Id).subscribe(() => {
        this._notificationToastService.createNotification(
          'success',
          'Authorization Policy',
          'Authorization policy deleted successfully!',
        );
      });
    }
    this.authorizationPolicyData.splice(rowIndex, 1);
    this.authorizationPolicyData = [...this.authorizationPolicyData];
  }

  onDocReviewRowAdded(event: { rowData: any }): void {
    const { rowData } = event;
    const payLoad = {
      documentTypeCode: rowData.documentType,
      reviewPeriodYears: rowData.reviewAfter,
    };

    this._documentReviewPolicyService.create(payLoad).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Document Review',
        'Document review policy added successfully!',
      );
    });

    const rowWithId = { ...rowData, id: this.generateId() };
    this.documentReviewRowData = [rowWithId, ...this.documentReviewRowData];
  }

  onDocReviewRowUpdated(event: { rowData: any; index: number }): void {
    const { rowData } = event;
    const payLoad = {
      id: rowData.Id,
      documentTypeCode: rowData.documentType,
      reviewPeriodYears: rowData.reviewAfter,
    };

    this._documentReviewPolicyService.update(payLoad).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Document Review',
        'Document review policy updated successfully!',
      );
    });

    this.documentReviewRowData[event.index] = { ...event.rowData };
    this.documentReviewRowData = [...this.documentReviewRowData];
  }

  onDocReviewRowDeleted(rowIndex: number): void {
    const row = this.documentReviewRowData[rowIndex];
    if (row && row.Id) {
      this._documentReviewPolicyService.delete(row.Id).subscribe(() => {
        this._notificationToastService.createNotification(
          'success',
          'Document Review',
          'Document review policy deleted successfully!',
        );
      });
    }
    this.documentReviewRowData.splice(rowIndex, 1);
    this.documentReviewRowData = [...this.documentReviewRowData];
  }

  onTrainingPoliciyRowUpdated(event: { rowData: any; index: number }): void {
    console.log('Row updated:', event);
    const { rowData } = event;
    const payLoad = {
      id: rowData.Id,
      documentTypeCode: rowData.documentTypeCode || rowData.DocumentTypeCode,
      trainingRequired: rowData.traningRequired || rowData.traningRequired,
      minimumScore: rowData.minimumscoreforpassing || rowData.minimumscoreforpassing,
    };

    this._trainingPolicyService.update(payLoad).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Training Policy',
        'Training policy updated successfully!',
      );
    });

    this.trainingPolicesData[event.index] = { ...event.rowData };
    this.trainingPolicesData = [...this.trainingPolicesData]; // Trigger change detection
  }

  onTrainingPoliciyRowDeleted(rowIndex: number): void {
    console.log('Row deleted at index:', rowIndex);
    const row = this.trainingPolicesData[rowIndex];
    if (row && row.Id) {
      this._trainingPolicyService.delete(row.Id).subscribe(() => {
        this._notificationToastService.createNotification(
          'success',
          'Training Policy',
          'Training policy deleted successfully!',
        );
      });
    }
    this.trainingPolicesData.splice(rowIndex, 1);
    this.trainingPolicesData = [...this.trainingPolicesData];
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
        this.selectedPageSize = pageSize;
        this.GetAllTrainingPolicy({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;

      case 'DocumentReviewPoliciyGrid':
        this.selectedPageSize = pageSize;
        this.GetAllDocumentReviewPolicies({
          pageNumber: 1,
          pageSize: this.selectedPageSize,
          sortModel: [], // or your current sort/filter model
          filterModel: {},
        });
        break;

      case 'AuthorizationPolicyGrid':
        this.selectedPageSize = pageSize;
        this.GetDocumentTrainingAuthorization({
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
