import { Component, ViewChild } from '@angular/core'; 
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper'; 
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { DocumentTypeCacheService } from '@app/shared/services/CacheServices/document-type-cache-service';
import { DocumentService } from '@app/shared/services/document.service';
import { PermissionService } from '@app/shared/services/permission.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-upload-documents',
  imports: [EditableAgGridWrapper],
  templateUrl: './upload-documents.html',
  styleUrl: './upload-documents.css',
})
export class UploadDocuments {
  gridConfig: GridConfig = {} as GridConfig;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'uploadolddocument';

  uploadedDocumentsData: any[] = [];

  divisions: any[] = [];
  departments: any[] = [];
  subDepartments: any[] = [];
  businessDomains: any[] = [];
  documentTypes: any[] = [];

  selectedPageSize = 10; // default value

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  pinnedTopRowDataPlanning: UploadDocumentColumns[] = [
    {
      documentNumber: '',
      documentName: '',
      version: '',
      documentType: null,
      divisionId: null,
      departmentId: null,
      subDepartmentId: null,
      businessDomainId: null,
      nextReviewDate: null,
      uploadDocument: null,
      isNewRow: true,
    },
  ];

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  constructor(
    private _documentService: DocumentService,
    private _documentTypeService: DocumentTypeCacheService,
    private _notificationToastService: NotificationToastService,
    private readonly hierarchyService: CabinetHierarchyService,
    private cabinetGridService: CabinetGridService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.getAllDocumentTypes();
      // this.hierarchyService.loadDropdownHierarchy().subscribe((levels) => {
      //   this.cabinetHierarchy = levels;
      //   this.levelTitles = this.hierarchyService.getLevelTitles();

      //   this.loadCabinetDropdownData(levels);
      // });

      this.hierarchyService.loadDropdownHierarchy().subscribe((levels) => {
        this.cabinetHierarchy = levels;

        this.cabinetGridService.loadDropdownData(levels).subscribe(() => this.buildGrid());
      });

      // this.GetAllUploadedDocuments({
      //   pageNumber: 1,
      //   pageSize: this.selectedPageSize,
      //   sortModel: [], // or your current sort/filter model
      //   filterModel: {},
      // });
    });
  }

  private getFixedColumns(): GridColumn[] {
    return [
      {
        field: 'documentNumber',
        headerName: 'Document Number',
        type: 'text',
        minWidth: 200,
        pinned: 'left',
        required: true,
      },
      {
        field: 'documentName',
        headerName: 'Document Name',
        type: 'text',
        minWidth: 250,
        pinned: 'left',
        required: true,
      },
      {
        field: 'version',
        headerName: 'Version',
        type: 'number',
        minWidth: 100,
        pinned: 'left',
        required: true,
      },
      {
        field: 'documentType',
        headerName: 'Document Type',
        type: 'dropdown',
        dropdownOptions: this.documentTypes,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        minWidth: 180,
        required: true,
      },
    ];
  }

  private getRemainingColumns(): GridColumn[] {
    return [
      {
        field: 'nextReviewDate',
        headerName: 'Next Review Date',
        type: 'date',
        required: true,
        minWidth: 180,
      },
      {
        field: 'uploadDocument',
        headerName: 'Upload Document',
        type: 'file',
        required: true,
        minWidth: 180,
      },
    ];
  }

  private buildGrid(): void {
    this.gridConfig = {
      columns: this.getColumns(),
      enablePagination: true,
      pageSize: this.selectedPageSize,
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
  }

  private getColumns(): GridColumn[] {
    return [
      ...this.getFixedColumns(),
      ...this.cabinetGridService.buildCabinetColumns(this.cabinetHierarchy),
      ...this.getRemainingColumns(),
    ];
  }

  GetAllUploadedDocuments(query: any) {
    const sort = query.sortModel?.[0];
    const pageNumber = Number(query?.pageNumber) || 1;
    const pageSize = Number(query?.pageSize) || this.selectedPageSize;

    this._documentService
      .GetAllDocument(
        query?.filterModel?.Name?.filter || '',
        sort?.sort?.toUpperCase() || 'ASC',
        sort?.colId || 'Name',
        true,
        pageNumber,
        pageSize,
      )
      .subscribe((res) => {
        const items = res?.Data?.Items;
        //console.log(items);
        if (Array.isArray(items)) {
          this.uploadedDocumentsData = items.map((item: any) => ({
            Id: item.Id,
            documentType: item.DocumentTypeCode,
            documentTypeName: item.DocumentTypeCode,
            version: item.Version,
            divisionName: item.Division,
            level1Id: item.DivisionCode,
            documentNumber: item.DocumentNumber,
            documentName: item.Title,
            DocumentCode: item.DocumentCode,
            level2Id: item.Department,
            departmentId: item.DepartmentCode,
            level3Id: item.SubDepartment,
            subDepartmentId: item.SubDepartmentCode,
            level4Id: item.BusinessDomain,
            businessDomainId: item.BusinessDomainCode,
            EffectiveFrom: new CustomDateFormatPipe().transform(item.EffectiveFrom || ''),
            EffectiveTo: new CustomDateFormatPipe().transform(item.EffectiveTo || ''),
            DocumentURL: item.DocumentURL,
            nextReviewDate: item.NextReviewDate,
            CreatedAt: new CustomDateFormatPipe().transform(item.CreatedAt || ''),
            CreatedBy: item.CreatedBy,
            LastModifiedAt: new CustomDateFormatPipe().transform(item.LastModifiedAt || ''),
            LastModifiedBy: item.LastModifiedBy,
          }));
        } else {
          this.uploadedDocumentsData = [];
        }

        //console.log('RowData length:', this.uploadedDocumentsData.length);
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
    // debugger;
    if (!file) {
      this._notificationToastService.createNotification(
        'error',
        'Document',
        'Please select a file before saving.',
      );
      return;
    }

    const formData = new FormData();

    const safeAppend = (key: string, val: any) => {
      if (val === undefined || val === null || val === 'undefined' || val === 'null') {
        formData.append(key, '');
      } else {
        formData.append(key, String(val));
      }
    };

    safeAppend('DocumentNumber', rowData.documentNumber);
    safeAppend('DocumentName', rowData.documentName);
    safeAppend('DocumentTypeCode', rowData.documentType);
    safeAppend('Version', rowData.version);
    safeAppend('Status', 'Approved'); // Assuming legacy docs are active/approved. Adjust as per your API rules.
    safeAppend('DivisionCode', rowData.level1Id);
    safeAppend('DepartmentCode', rowData.level2Id);
    safeAppend('SubDepartmentCode', rowData.level3Id);
    safeAppend('BusinessDomainCode', rowData.level4Id);

    if (rowData.nextReviewDate) {
      try {
        formData.append('NextReviewDate', new Date(rowData.nextReviewDate).toISOString());
      } catch (e) {
        formData.append('NextReviewDate', '');
      }
    } else {
      formData.append('NextReviewDate', '');
    }

    // ✅ REAL FILE — GUARANTEED
    if (!(file instanceof File)) {
      console.error('Not a File:', file);
      return;
    }

    formData.append('DocumentFile', file, file.name);

    this._documentService.create(formData).subscribe(() => {
      this._notificationToastService.createNotification(
        'success',
        'Document',
        'Document created successfully!',
      );

      const rowWithId = {
        ...rowData,
        id: this.generateId(),
        documentNumber: rowData.documentNumber,
        documentName: rowData.documentName,
        version: rowData.version,
        nextReviewDate: rowData.nextReviewDate,
        uploadDocument: 'Uploaded', // ❌ DO NOT store file
        // Map dropdown IDs to display names
        documentType: this.getDisplayName(this.documentTypes, rowData.documentType),
        divisionName: this.getDisplayName(this.divisions, rowData.level1Id),
        departmentName: this.getDisplayName(this.departments, rowData.level2Id),
        subDepartmentName: this.getDisplayName(this.subDepartments, rowData.level3Id),
        businessDomainname: this.getDisplayName(this.businessDomains, rowData.level4Id),
      };

      this.uploadedDocumentsData = [rowWithId, ...this.uploadedDocumentsData];
    });
  }

  onRowUpdated(event: { rowData: any; index: number }): void {
    //console.log('Row updated:', event);
    // debugger;
    // Update display names
    event.rowData.divisionName = this.getDisplayName(this.divisions, event.rowData.level1Id);
    event.rowData.departmentName = this.getDisplayName(this.departments, event.rowData.level2Id);
    event.rowData.subDepartmentName = this.getDisplayName(
      this.subDepartments,
      event.rowData.level3Id,
    );
    event.rowData.businessDomainname = this.getDisplayName(
      this.businessDomains,
      event.rowData.level4Id,
    );
    // event.rowData.roleName = this.getDisplayName(this.roles, event.rowData.roleId);

    this.uploadedDocumentsData[event.index] = { ...event.rowData };
    this.uploadedDocumentsData = [...this.uploadedDocumentsData]; // Trigger change detection
  }

  onRowDeleted(rowIndex: number): void {
    //console.log('Row deleted at index:', rowIndex);
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
      //this.buildGrid();
    });
  };
}

class UploadDocumentColumns {
  documentNumber: string = '';
  documentName: string = '';
  version: string = '';
  documentType: string | null = null;
  //documentType: string = '';

  divisionId: string | null = null;
  //division: string | null = null;
  departmentId: string | null = null;
  //department: string | null = null;
  subDepartmentId: string | null = null;
  businessDomainId: string | null = null;
  //subDepartment: string | null = null;
  nextReviewDate: string | null = null;
  uploadDocument: any = null;
  isNewRow: boolean = false;
}
