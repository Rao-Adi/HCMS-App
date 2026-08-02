import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { ApiResponse, SelectList } from '@app/shared/interfaces/interfaces';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { ColDef } from 'ag-grid-community';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  EditableAgGridWrapper,
  GridColumn,
  GridConfig,
} from '@app/shared/editable-ag-grid-wrapper/editable-ag-grid-wrapper';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { MandatoryCabinetWisePopup } from '../mandatory-cabinet-wise-popup/mandatory-cabinet-wise-popup';
import { NotificationToastService } from '@app/shared/notification/notification.service'; 
import { ControlTypeService } from '@app/shared/services/control-type.service'; 
import { PermissionService } from '@app/shared/services/permission.service';
@Component({
  selector: 'app-document-attributes',
  imports: [
    CommonModule,
    FormsModule,
    EditableAgGridWrapper,
    NzSelectModule,
    SafeTranslatePipe,
    DocumentTypeList,
    NzButtonModule,
    NzModalModule,
  ],
  templateUrl: './document-attributes.html',
  styleUrl: './document-attributes.css',
})
export class DocumentAttributes {
  gridConfig: GridConfig = {} as GridConfig;

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'documentattributes';

  selectedPageSize = 10;
  pageSize = 10;
  totalDocumentAttributes = 0;
  documentAttributeData: any[] = [];

  controlTypes: any[] = [ 
  ]; // for dropdowns

  selectedDocumentType?: string = '';

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
  };

  constructor(
    private _documentAttribute: DocumentAttributeService,
    private modal: NzModalService,
    private _notificationToastService: NotificationToastService,
    private _controlTypeService: ControlTypeService,
    private _permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this._permissionService.getPermissions(this.formId).subscribe((permissions) => {
      this.canAdd = permissions.canAdd;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;

      this.getAllControlTypeList();
    });

    
    // this.getAllDocumentAttributes({
    //   pageNumber: 1,
    //   pageSize: this.pageSize,
    //   sortModel: [],
    //   filterModel: {},
    // });
  }

  pinnedTopRowDataPlanning: DocumentAttributeColumns[] = [
    {
      ControlLabel: '',
      ControlTypeId: '',
      ControlTypeName: '',
      ListValue: '',
      Mandatory: '',
    },
  ];

  private GenerateGrid() {
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
  }

  private getColumns(): GridColumn[] {
    return [
      {
        field: 'ControlLabel',
        headerName: 'Control Label',
        type: 'text',
        required: true,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'ControlTypeId',
        headerName: 'Control Type',
        type: 'dropdown',
        dropdownOptions: this.controlTypes,
        dropdownValueField: 'id',
        dropdownDisplayField: 'text',
        required: true,
        minWidth: 200,
      },
      {
        field: 'ListValue',
        headerName: 'List Value',
        type: 'text',
        required: false,
        minWidth: 150,
        pinned: 'left',
      },
      {
        field: 'Mandatory',
        headerName: 'Mandatory (Cabinet Wise)',
        type: 'button',
        minWidth: 150,
        pinned: 'left',
        required: false,
      },
    ];
  }

  getAllDocumentAttributesByDocumentType = (documentType: any) => {
    this._documentAttribute.getDocumentAttributeByDocumentType(documentType).subscribe((res) => {
      const items = res?.Data;
      if (Array.isArray(items)) {
        this.documentAttributeData = items.map((item: any) => ({
          Id: item.Id,
          DocumentTypeCode: item.DocumentTypeCode,
          ControlLabel: item.ControlLabel,
          ControlTypeId:
            this.controlTypes.find((ct) => ct.id === String(item.ControlTypeId))?.id ||
            item.ControlTypeId, // ✅ matches column
          ListValue: item.ListValues, // ✅ plural in API
          Mandatory: item.IsMandatory, // ✅ boolean
        }));
      } else {
        this.documentAttributeData = [];
      }

      //console.log('RowData length:', this.documentAttributeData.length);
    });
  };

  onDocumentTypeChange(value: string): void {
    // this.loading = true;
    this.selectedDocumentType = value;
    this.getAllDocumentAttributesByDocumentType(value);
  }

  onGridReady(gridApi: any): void {
    //console.log('Grid ready:', gridApi);
    // Store grid API if needed for external operations
  }

  /* ================= Inline Events ================= */

  onRowAdded(event: { rowData: any }): void {
    if (this.selectedDocumentType === undefined || this.selectedDocumentType === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Document Attribute',
        'Document Attribute is required',
      );
      return;
    }
    const payLoad = {
      documentTypeCode: this.selectedDocumentType,
      controlLabel: event.rowData.ControlLabel,
      ControlTypeId: event.rowData.ControlTypeId,
      listvalues: event.rowData.ListValue,
      isMandatory: false,
      IsActive: true,
      IsDeleted: false,
    };

    this._documentAttribute.create(payLoad).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.Success) { 
          this._notificationToastService.createNotification('success', 'Document attribute', res.Message);
          this.getAllDocumentAttributesByDocumentType(this.selectedDocumentType);
        } else {
          this._notificationToastService.createNotification('warning', 'Document attribute', res.Message);
        }
      },
      error: () => {
        this._notificationToastService.createNotification(
          'error',
          'Document Attribute',
          'Server error. Please try again.',
        );
      },
    });
  }

  onRowUpdated(event: { rowData: any }): void {
    if (this.selectedDocumentType === undefined || this.selectedDocumentType === '') {
      this._notificationToastService.createNotification(
        'warning',
        'Document Attribute',
        'Document Attribute is required',
      );
      return;
    }
    const payLoad = {
      id: event.rowData.Id,
      documentTypeCode: this.selectedDocumentType,
      controlLabel: event.rowData.ControlLabel,
      ControlTypeId: event.rowData.ControlTypeId,
      listValues: event.rowData.ListValue,
      isMandatory: true,
      IsActive: true,
      IsDeleted: false,
    }; 
    this._documentAttribute.update(payLoad).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.Success) { 
          this._notificationToastService.createNotification('success', 'Document attribute', res.Message);
          this.getAllDocumentAttributesByDocumentType(this.selectedDocumentType);
        } else {
          this._notificationToastService.createNotification('warning', 'Document attribute', res.Message);
        }
      },
      error: () => {
        this._notificationToastService.createNotification(
          'error',
          'Document Attribute',
          'Server error. Please try again.',
        );
      },
    });
  }

  onRowDeleted(index: number): void {
    const row = this.documentAttributeData[index];

    this._documentAttribute.delete(row.Id).subscribe(() => {
      this._notificationToastService.createNotification(
        'sucess',
        'Document Attribute',
        'Document Attribute deleted successfully!',
      );
      this.getAllDocumentAttributesByDocumentType(this.selectedDocumentType);
    });
  }

  onCellValueChanged(event: any): void {
    if (!event?.data) return;

    event.data.ControlTypeId =
      this.controlTypes.find((ct) => ct.text === String(event.data.ControlTypeId))?.id ??
      event.data.ControlTypeId;

    // update same row
    event.node.setData(event.data);
  }

  onRowValueChanged(event: any): void {
    // normalize dropdown
    event.data.ControlTypeId =
      this.controlTypes.find((ct) => ct.text === event.data.ControlTypeId)?.id ??
      event.data.ControlTypeId;

    // send PATCH API here
  }

  onSelectionChanged(selectedRows: any[]): void {
    console.log('Selected rows:', selectedRows);
  }

  handleGridAction(event: { action: string; rowData: any }) {
    if (event.action === 'VIEW_CABINET') {
      this.openCabinetModal(event.rowData);
    }
  }

  private getDisplayName(options: any[], id: any): string {
    const option = options.find((opt) => opt.id == id);
    return option ? option.text : '';
  }

  private generateId(): number {
    return Date.now();
  }

  openCabinetModal(rowData: any): void {
    const modalRef = this.modal.create({
      nzTitle: 'Mandatory (Cabinet Wise)',
      nzContent: MandatoryCabinetWisePopup,
      nzData: {
        data: rowData.Id, // 👈 this is what we’ll read inside modal
      },
      nzFooter: null, // custom footer handled inside component
      nzWidth: 1200,
    });

    modalRef.afterClose.subscribe((result) => {
      //console.log('Modal closed with:', result);
    });
  }

  getAllControlTypeList = () => {
    this._controlTypeService.getControlTypeList().subscribe((res) => {
      if (res?.Data) {
        this.controlTypes = (res.Data ?? []).map((d: any) => ({
          id: d.Id,
          text: d.Value,
        }));
        this.GenerateGrid();
      } else {
        this.controlTypes = [];
      }
    });
  };
}

class DocumentAttributeColumns {
  ControlLabel: string = '';
  ControlTypeId: string = '';
  ControlTypeName: string = '';
  ListValue: string = '';
  Mandatory: string = '';
}
