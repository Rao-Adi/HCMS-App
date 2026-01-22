import { Component, ViewChild } from '@angular/core';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { NotificationService } from '@app/shared/notification/notification.service';
import { DepartmentCacheService } from '@app/shared/services/CacheServices/department-cache-service';
import { DivisionCacheService } from '@app/shared/services/CacheServices/division-cache-service';
import { DocumentTypeCacheService } from '@app/shared/services/CacheServices/document-type-cache-service';
import { SubDepartmentCacheService } from '@app/shared/services/CacheServices/sub-department-cache-service';
import { DocumentService } from '@app/shared/services/document.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-upload-documents',
  imports: [EditableAgGridWrapper],
  templateUrl: './upload-documents.html',
  styleUrl: './upload-documents.css',
})
export class UploadDocuments {
  gridConfig: GridConfig = {} as GridConfig;

  uploadedDocumentsData: any[] = [];

  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  documentTypes: any[] = [];

  divisionPageSize = 10;
  employeePageSize = 10;
  selectedPageSize = 1; // default value

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pinnedTopRowDataPlanning: UploadDocumentColumns[] = [
    {
      documentId: '',
      documentName: '',
      version: '',
      documentTypeId: null,
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      nextReviewDate: null,
      uploadDocument: null,
      isNewRow: true,
    },
  ];

  constructor(
    private _documentService: DocumentService,
    private _documentTypeService: DocumentTypeCacheService,
    private _divisionServices: DivisionCacheService,
    private _departmentCacheService: DepartmentCacheService,
    private _subDepartmentServices: SubDepartmentCacheService,
    private _notification: NotificationService
  ) {}

  ngOnInit() {
    this.GetAllUploadedDocuments({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
    this.getAllDocumentTypes();
    this.getAllDivisionList();
    this.getAllDepartmentList();
    this.getAllSubDepartmentList();
  }

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'documentId',
        headerName: 'Document Id',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        field: 'documentName',
        headerName: 'Document Name',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      {
        field: 'version',
        headerName: 'Version',
        type: 'text',
        minWidth: 150,
        pinned: 'left',
        required: true,
      },
      // DOCUMENT TYPES
      {
        field: 'documentTypeId',
        headerName: 'Document Type',
        type: 'dropdown',
        dropdownOptions: this.documentTypes,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },

      // ✅ DIVISION
      {
        field: 'divisionName',
        headerName: 'Division',
        type: 'dropdown',
        dropdownOptions: this.divisions,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },

      // ✅ DEPARTMENT
      {
        field: 'departmentName',
        headerName: 'Department',
        type: 'dropdown',
        dependsOn: 'divisionName',
        dataSourceKey: 'departments',
        filterKey: 'divisionId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },
      // ✅ SUB DEPARTMENT
      {
        field: 'subDepartmentName',
        headerName: 'Sub Department',
        type: 'dropdown',
        dependsOn: 'departmentName',
        dataSourceKey: 'subDepartments',
        filterKey: 'departmentId',
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },

      {
        field: 'nextReviewDate',
        headerName: 'Next Review Date',
        type: 'date',
        required: true,
      },

      {
        field: 'uploadDocument',
        headerName: 'Upload Document',
        type: 'file',
        required: true,
      },
    ];
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
      enableInlineAdd: true,
      enableInlineEdit: true,
      enableInlineDelete: true,
      rowHeight: 47,
      headerHeight: 40,
      domLayout: 'autoHeight',
      theme: 'ag-theme-alpine',
      suppressCellFocus: true,
    };
  }

  GetAllUploadedDocuments(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || 10;

    this._documentService
      .GetAllDocument(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize
      )
      .subscribe((res) => {
        const items = res?.Data?.Items;
        console.log(items);
        if (Array.isArray(items)) {
          this.uploadedDocumentsData = items.map((item: any) => ({
            Id: item.Id,
            documentTypeId: item.DocumentType,
            documentTypeName: item.DocumentTypeCode,
            version: item.status,
            divisionName: item.Division,
            divisionId: item.DivisionCode,
            documentId: item.DocumentNumber,
            documentName: item.DocumentName,
            DocumentCode: item.DocumentCode,
            departmentName: item.Department,
            departmentId: item.DepartmentCode,
            subDepartmentName: item.SubDepartment,
            subDepartmentId: item.SubDepartmentCode,
            EffectiveFrom: item.EffectiveFrom,
            EffectiveTo: item.EffectiveTo,
            DocumentURL: item.DocumentURL,
            nextReviewDate: item.NextReviewDate,
            CreatedAt: item.CreatedAt,
            CreatedBy: item.CreatedBy,
            LastModifiedAt: item.LastModifiedAt,
            LastModifiedBy: item.LastModifiedBy,
          }));
        } else {
          this.uploadedDocumentsData = [];
        }

        console.log('RowData length:', this.uploadedDocumentsData.length);
      });
  }

  onSelectionChanged(selectedRows: any[]): void {
    //console.log('Selected rows:', selectedRows);
    // Handle selection logic
  }

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  @ViewChild('gridWrapper') gridWrapper!: EditableAgGridWrapper;

  onRowAdded(event: { rowData: any; file?: File }): void {
     
    const { rowData, file } = event;

    if (!file) {
      this._notification.createNotification(
        'error',
        'Document',
        'Please select a file before saving.'
      );
      return;
    }

    const formData = new FormData();

    formData.append('DocumentNumber', rowData.documentId);
    formData.append('DocumentName', rowData.documentName);
    formData.append('DocumentTypeCode', rowData.documentTypeId);
    formData.append('DivisionCode', rowData.divisionName);
    formData.append('DepartmentCode', rowData.departmentName);
    formData.append('SubDepartmentCode', rowData.subDepartmentName);
    formData.append('NextReviewDate', new Date(rowData.nextReviewDate).toISOString());

    // ✅ REAL FILE — GUARANTEED
    if (!(file instanceof File)) {
      console.error('Not a File:', file);
      return;
    }

    formData.append('DocumentFile', file, file.name);

    this._documentService.create(formData).subscribe(() => {
      this._notification.createNotification(
        'success',
        'Document',
        'Document created successfully!'
      );
    });

    const rowWithId = {
      ...rowData,
      id: this.generateId(),
      documentId: rowData.documentId,
      documentName: rowData.documentName,
      version: rowData.version,
      nextReviewDate: rowData.nextReviewDate,
      uploadDocument: 'Uploaded', // ❌ DO NOT store file
      // Map dropdown IDs to display names
      documentTypeId: this.getDisplayName(this.documentTypes, rowData.documentTypeId),
      divisionName: this.getDisplayName(this.divisions, rowData.divisionName),
      departmentName: this.getDisplayName(this.departments, rowData.departmentName),
      subDepartmentName: this.getDisplayName(this.subDepartments, rowData.subDepartmentName),
    };

    this.uploadedDocumentsData = [rowWithId, ...this.uploadedDocumentsData];
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    console.log('Row updated:', event);
    debugger;
    // Update display names
    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.divisionId);
    event.rowData.departmentName = this.getDisplayName(
      this.departments,
      event.rowData.departmentId
    );
    // event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

    this.uploadedDocumentsData[event.index] = { ...event.rowData };
    this.uploadedDocumentsData = [...this.uploadedDocumentsData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    console.log('Row deleted at index:', rowIndex);
    this.uploadedDocumentsData.splice(rowIndex, 1);
    this.uploadedDocumentsData = [...this.uploadedDocumentsData];
  }

  onCellValueChanged(event: { field: string; value: any; rowData: any; rowIndex: number }): void {
    //console.log('Cell value changed:', JSON.stringify(event));

    // Handle calculations if needed
    if (event.field === 'currentSalary' || event.field === 'incrementPercentage') {
      const currentSalary = event.rowData.currentSalary || 0;
      const incrementPercentage = event.rowData.incrementPercentage || 0;
      event.rowData.revisedSalary = currentSalary * (1 + incrementPercentage / 100);

      // Update the row
      this.uploadedDocumentsData[event.rowIndex] = { ...event.rowData };
    }

    if (event.field === 'file-preview') {
      // Handle file preview
      this.previewFile(event.value);
    } else {
      // Handle regular value changes
      //console.log('Cell value changed:', event);
    }
  }

  private generateId(): number {
    return Date.now();
  }

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  previewFile(fileInfo: any): void {
    // Implement file preview logic
    if (fileInfo?.url) {
      // Open in modal or new tab
      window.open(fileInfo.url, '_blank');
    }
  }

  getAllDivisionList = () => {
    this._divisionServices.getDivisions().subscribe((res) => {
      if (res) {
        this.divisions = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
        }));
      } else {
        this.divisions = [];
      }
      // ✅ build grid ONLY after divisions are ready
      this.buildGrid();
    });
  };

  getAllDepartmentList = () => {
    this._departmentCacheService.getDepartments().subscribe((res) => {
      if (res) {
        this.departments = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
          divisionId: d.DivisionCode || d.divisionCode,
          Division: d.Division || d.division,
        }));
      } else {
        this.departments = [];
      }
    });
  };

  getAllSubDepartmentList = () => {
    this._subDepartmentServices.getSubDepartments().subscribe((res) => {
      if (res) {
        this.subDepartments = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
          departmentId: d.DepartmentCode || d.departmentCode,
          department: d.Department || d.department,
        }));
      } else {
        this.subDepartments = [];
      }
    });
  };

  getAllDocumentTypes = () => {
    this._documentTypeService.getDocumentTypes().subscribe((res) => {
      if (res) {
        this.documentTypes = (res ?? []).map((d: any) => ({
          id: d.Code,
          text: d.Name,
        }));
      } else {
        this.documentTypes = [];
      }
      // ✅ build grid ONLY after divisions are ready
      this.buildGrid();
    });
  };
}

class UploadDocumentColumns {
  documentId: string = '';
  documentName: string = '';
  version: string = '';
  documentTypeId: string | null = null;
  //documentType: string = '';

  divisionId: string | null = null;
  //division: string | null = null;
  departmentId: string | null = null;
  //department: string | null = null;
  subDepartmentId: string | null = null;
  //subDepartment: string | null = null;
  nextReviewDate: string | null = null;
  uploadDocument: any = null;
  isNewRow: boolean = false;
}
