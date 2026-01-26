import { Component } from '@angular/core';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
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

  // Default Column Definitions: Apply configuration across all columns
  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  workflowAuthoritiesColumnDefs = [
    { field: 'documentId', headerName: 'documentId', flex: 1 },
    { field: 'documentName', headerName: 'documentName', flex: 1 },
    { field: 'version', headerName: 'Version', flex: 1 },
    { field: 'documentTypeId', headerName: 'documentTypeId', flex: 1 },
    { field: 'divisionName', headerName: 'divisionName', flex: 1 },
    { field: 'departmentName', headerName: 'departmentName', flex: 1 },
    { field: 'subDepartmentName', headerName: 'subDepartmentName', flex: 1 },
    { field: 'nextReviewDate', headerName: 'nextReviewDate', flex: 1 },
  ];

  constructor(private _documentService: DocumentService) {}

  ngOnInit() {
    this.GetAllUploadedDocuments({
      pageNumber: 1,
      pageSize: this.selectedPageSize,
      sortModel: [], // or your current sort/filter model
      filterModel: {},
    });
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
            documentTypeId: item.DocumentType,
            documentTypeName: item.DocumentTypeCode,
            divisionName: item.Division,
            divisionId: item.DivisionCode,
            documentId: item.DocumentNumber,
            documentName: item.DocumentName,
            DocumentCode: item.DocumentCode,
            departmentName: item.Department,
            departmentId: item.DepartmentCode,
            subDepartmentName: item.SubDepartment,
            subDepartmentId: item.SubDepartmentCode,
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
