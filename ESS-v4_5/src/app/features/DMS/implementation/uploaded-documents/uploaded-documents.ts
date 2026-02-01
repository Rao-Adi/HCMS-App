import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { CabinetLevel } from '@app/shared/interfaces/interfaces';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetGridService } from '@app/shared/services/CacheServices/cabinet-grid.service';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';
import { DocumentService } from '@app/shared/services/document.service';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-uploaded-documents',
  imports: [AgGridWrapper],
  templateUrl: './uploaded-documents.html',
  styleUrl: './uploaded-documents.css',
})
export class UploadedDocuments {
  gridConfig: GridConfig = {} as GridConfig;

  uploadedDocumentsData: any[] = [];
  totalUplodedDocument = 0;

  pageSize = 10;
  divisionPageSize = 10;
  employeePageSize = 10;
  selectedPageSize = 1; // default value

  dropdownDataSources: Record<number, any[]> = {};
  cabinetHierarchy: CabinetLevel[] = [];
  levelTitles: Record<number, string> = {};

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  workflowAuthoritiesColumnDefs = [
    { field: 'documentId', headerName: 'Document Id', flex: 1 },
    { field: 'documentName', headerName: 'Document Name', flex: 1 },
    { field: 'version', headerName: 'Version Number', flex: 1 },
    { field: 'documentTypeId', headerName: 'Document Type', flex: 1 },
    { field: 'divisionName', headerName: 'Division', flex: 1 },
    { field: 'departmentName', headerName: 'Department', flex: 1 },
    { field: 'subDepartmentName', headerName: 'Sub-Department', flex: 1 },
    { field: 'businessDomainName', headerName: 'Business Domain', flex: 1 },
    { field: 'nextReviewDate', headerName: 'Next Review Date', flex: 1 },
  ];

  constructor(
    private _documentService: DocumentService,
    private readonly hierarchyService: CabinetHierarchyService,
    private cabinetGridService: CabinetGridService,
  ) {}

  ngOnInit() {
    this.GetAllUploadedDocuments({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }

  private getFixedColumns(): GridColumn[] {
    return [
      {
        field: 'documentId',
        headerName: 'Document Id',
        type: 'readonly',
        minWidth: 150,
        pinned: 'left',
        required: false,
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
        minWidth: 120,
        pinned: 'left',
        required: true,
      },
      {
        field: 'documentTypeId',
        headerName: 'Document Type',
        type: 'dropdown',
        //dropdownOptions: this.documentTypes,
        // dropdownValueField: 'id',
        // dropdownDisplayField: 'text',
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
      },
      {
        field: 'uploadDocument',
        headerName: 'Upload Document',
        type: 'file',
        required: true,
      },
    ];
  }

  private getColumns(): GridColumn[] {
    return [
      ...this.getFixedColumns(),
      //...this.cabinetGridService.buildCabinetColumns(this.cabinetHierarchy),
      ...this.getRemainingColumns(),
    ];
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
        pageSize,
      )
      .subscribe((res) => {
        const items = res?.Data?.Items;
        console.log(items);
        if (Array.isArray(items)) {
          this.uploadedDocumentsData = items.map((item: any) => ({
            Id: item.Id,
            documentTypeId: item.DocumentTypeCode,
            documentTypeName: item.DocumentTypeCode,
            version: item.Version,
            divisionName: item.Division,
            divisionId: item.DivisionCode,
            documentId: item.DocumentNumber,
            documentName: item.DocumentName,
            DocumentCode: item.DocumentCode,
            departmentName: item.Department,
            departmentId: item.DepartmentCode,
            subDepartmentName: item.SubDepartment,
            subDepartmentId: item.SubDepartmentCode,
            businessDomainName: item.BusinessDomain,
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
      });
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    const { gridId, pageSize } = event;

    this.divisionPageSize = pageSize;
    this.GetAllUploadedDocuments({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
  }
}
