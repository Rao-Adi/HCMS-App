import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridWrapper } from '@app/shared/ag-grid-wrapper/ag-grid-wrapper';
import { ColDef } from 'ag-grid-community';
import * as mammoth from 'mammoth';

import { DocumentService } from '@app/shared/services/document.service';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { DocumentAttributeService } from '@app/shared/services/document-attribute.service';
import { TemplateService } from '@app/shared/services/template.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { CabinetSelection, ColumnToggle } from '@app/shared/interfaces/interfaces';
import { CabinetStructureList } from '@app/shared/Dropdowns/cabinet-structure-list/cabinet-structure-list';
import { DocumentTypeList } from '@app/shared/Dropdowns/document-type-list/document-type-list';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { DRUsersComponent } from '../../document-request-management/drusers-component/drusers-component';
import { DRDistributionList } from '../../document-request-management/drdistribution-list/drdistribution-list';
import { NzModalService } from 'ng-zorro-antd/modal';
import { WorkflowObservationDialogComponent } from '@app/shared/Dialog/workflow-observation-dialog-component/workflow-observation-dialog-component';
import { CabinetHierarchyService } from '@app/shared/services/CacheServices/cabinet-hierarchy-service';

// Documents the user created that are still in Draft: never submitted ("Draft"), or submitted and
// then sent back for rework ("Reverted"). Mirrors document-request-management's draft-request-list
// -- picking a row opens an editable detail panel below the grid, in this same tab, with its own
// Draft and Submit actions. Nothing navigates away.
@Component({
  selector: 'app-draft-document-list',
  imports: [
    CommonModule,
    FormsModule,
    AgGridWrapper,
    CabinetStructureList,
    DocumentTypeList,
    SafeTranslatePipe,
    DMSRichTextEdit,
    DRUsersComponent,
    DRDistributionList,
  ],
  templateUrl: './draft-document-list.html',
  styleUrl: './draft-document-list.css',
})
export class DraftDocumentList implements OnInit {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('fileInput') fileInput!: any;

  // Lets the parent (create-update-document.ts) refresh the "Document Draft" tab badge when a
  // draft is saved or submitted out of Draft status.
  @Output() draftDocumentChanged = new EventEmitter<void>();

  pageSize = 10;
  totalRows = 0;
  draftDocumentsData: any[] = [];

  // --- grid filters ---
  cabinetHierarchy: CabinetSelection[] = [];
  filterDivision: string | null = '';
  filterDepartment: string | null = '';
  filterSubDepartment: string | null = '';
  filterBusinessDomain: string | null = '';
  filterDocumentType: string = '';

  // --- selected row / detail panel ---
  selectedDraftDocument: any = null;
  revertedObservations: any[] = [];
  loadingObservations = false;

  documentId: number = 0;
  documentName: string = '';
  inputJustificationValue: string = '';
  selectedDocumentType: string = '';
  selectedDocumentTypeCode: string = '';
  selectedDivisions: string = '';
  selectedDepartment: string = '';
  selectedSubDepartment: string = '';
  selectedBusinessDomain: string = '';

  distributionListPayload: any[] = [];
  distributionUserList: any[] = [];

  templateHtml: string = '';
  selectedTemplateType: string = '';
  templateFileUrl: string = '';
  draftFileUrl: string = '';
  draftFile: File | null = null;
  convertingUploadedFile = false;

  // Carried through Draft/Submit unchanged. The backend validates the SUBMITTED attribute and
  // training lists on Submit (not what is already stored), so a draft that was saved with these
  // filled in would be rejected if this panel dropped them -- they are loaded on row click and
  // sent straight back. Editing them stays on the Create/Update Document form.
  attributeValues: any[] = [];
  trainingUsersData: any[] = [];

  loadingDraft = false;
  loadingSubmit = false;
  // True while the per-row lookups kicked off by onCellClicked are still in flight, so Draft and
  // Submit stay disabled until the panel actually holds that row's data.
  loadingDetail = false;
  private pendingDetailLoads = 0;

  currentGridQuery: any = {
    pageNumber: 1,
    pageSize: 10,
    sortModel: [],
    filterModel: {},
    searchTerm: '',
  };

  defaultColDef: ColDef = {
    filter: true,
    cellDataType: false,
    editable: false,
  };

  private readonly cabinetLevelFields: Record<number, { field: string; label: string }> = {
    1: { field: 'division', label: 'Division' },
    2: { field: 'department', label: 'Department' },
    3: { field: 'subdepartment', label: 'Sub-Department' },
    4: { field: 'businessDomain', label: 'Business Domain' },
  };

  private readonly leadingColumnDefs: ColDef[] = [
    { field: 'documentNumber', headerName: 'Document Number', minWidth: 150 },
    { field: 'documentType', headerName: 'Document Type', minWidth: 150 },
    { field: 'documentName', headerName: 'Document Title', minWidth: 200 },
    { field: 'version', headerName: 'Version', minWidth: 100 },
    {
      field: 'justification',
      headerName: 'Justification',
      minWidth: 130,
      cellRenderer: (params: any) => {
        const val = params.value || '';
        if (!val) return '<span>-</span>';
        return `
          <span style="color:#1976d2; cursor:pointer; text-decoration:underline">
            Justification
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        if (event?.value) this.openJustificationModal(event.value);
      },
    },
  ];

  private readonly trailingColumnDefs: ColDef[] = [
    { field: 'lastSavedOn', headerName: 'Last Saved On', minWidth: 170, cellClass: 'audit-cell' },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 140,
      cellRenderer: (params: any) => {
        const reverted = params.value === 'Reverted';
        const color = reverted ? '#f59e0b' : '#6b7280';
        const bg = reverted ? '#fffbeb' : '#f3f4f6';
        const border = reverted ? '#fef3c7' : '#e5e7eb';
        // Only a Reverted row has an observation behind it, so only that one reads as clickable.
        const clickable = reverted ? 'cursor:pointer; text-decoration:underline;' : '';
        return `
          <span style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 12px;
            font-size: 12px;
            font-weight: 600;
            line-height: 1;
            color: ${color};
            background-color: ${bg};
            border: 1px solid ${border};
            border-radius: 9999px;
            ${clickable}
          ">
            ${params.value || 'Draft'}
          </span>
        `;
      },
      onCellClicked: (event: any) => {
        if (event?.data?.status === 'Reverted') this.openObservationModal(event.data);
      },
    },
  ];

  // Rebuilt once the cabinet hierarchy loads (see ngOnInit), so it starts out showing just the
  // fixed columns until we know which levels are enabled.
  documentColumnDefs: ColDef[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs];

  columnToggles: ColumnToggle[] = [...this.leadingColumnDefs, ...this.trailingColumnDefs].map(
    (c) => ({
      field: c.field as string,
      label: c.headerName as string,
      visible: true,
    }),
  );

  constructor(
    private _documentService: DocumentService,
    private _documentRequestService: DocumentRequestService,
    private _documentAttributeService: DocumentAttributeService,
    private _documentTemplateService: TemplateService,
    private _notificationToastService: NotificationToastService,
    private modal: NzModalService,
    private _cabinetHierarchyService: CabinetHierarchyService,
  ) {}

  ngOnInit(): void {
    this._cabinetHierarchyService.loadDropdownHierarchy().subscribe((levels) => {
      const activeLevelDefs = levels
        .filter((level) => level.isActive && this.cabinetLevelFields[level.level])
        .map((level) => ({
          ...this.cabinetLevelFields[level.level],
          title: level.title,
        }));

      this.documentColumnDefs = [
        ...this.leadingColumnDefs,
        ...activeLevelDefs.map((def) => ({ field: def.field, headerName: def.title })),
        ...this.trailingColumnDefs,
      ];

      this.columnToggles = [
        ...this.leadingColumnDefs.map((c) => ({
          field: c.field as string,
          label: c.headerName as string,
          visible: true,
        })),
        ...activeLevelDefs.map((def) => ({ field: def.field, label: def.title, visible: true })),
        ...this.trailingColumnDefs.map((c) => ({
          field: c.field as string,
          label: c.headerName as string,
          visible: true,
        })),
      ];
    });
  }

  // The actual file extension a drafted upload must match. Derived from the template/existing
  // document URL rather than the TemplateType code, which is an unreliable classification.
  get expectedTemplateExtension(): string {
    const url = this.templateFileUrl || this.draftFileUrl || '';
    if (!url) return '';
    try {
      const clean = decodeURIComponent(url).split('?')[0].split('#')[0];
      const parts = clean.split('.');
      return parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
    } catch {
      return '';
    }
  }

  onPageSizeChanged(event: { gridId: string; pageSize: number }) {
    if (event && event.pageSize) {
      this.pageSize = event.pageSize;
      this.currentGridQuery.pageSize = this.pageSize;
    }
  }

  onFilterHierarchyChange(values: CabinetSelection[]): void {
    this.cabinetHierarchy = values ?? [];
    this.filterDivision = values.find((v) => v.level === 1)?.value ?? null;
    this.filterDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.filterSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.filterBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
    this.refreshGrid();
  }

  onDocumentTypeChange(value: string): void {
    this.filterDocumentType = value;
    this.refreshGrid();
  }

  // The detail panel's own Cabinet control is read-only; this only exists so the component
  // keeps compiling against app-cabinet-structure-list's required output.
  onHierarchyChange(values: CabinetSelection[]): void {
    this.selectedDivisions = values.find((v) => v.level === 1)?.value ?? '';
    this.selectedDepartment = values.find((v) => v.level === 2)?.value ?? '';
    this.selectedSubDepartment = values.find((v) => v.level === 3)?.value ?? '';
    this.selectedBusinessDomain = values.find((v) => v.level === 4)?.value ?? '';
  }

  onDistributionChanged(list: any[]) {
    this.distributionListPayload = list;
  }

  // Server-side row model: reassigning draftDocumentsData alone isn't picked up by AG Grid's
  // cache -- refresh() is what actually re-fetches with the new filters.
  refreshGrid(): void {
    if (this.agGridWrapper) {
      this.agGridWrapper.refresh();
    } else {
      this.GetAllDraftDocuments();
    }
  }

  GetAllDraftDocuments(query?: any) {
    const searchText = query?.searchText || query?.filterModel?.fname?.filter || '';

    if (query && typeof query === 'object') {
      this.currentGridQuery = query;
    } else {
      this.currentGridQuery.pageNumber = 1;
    }

    const sortModel = this.currentGridQuery.sortModel || [];
    let sortBy = 'DESC';
    let sortColumn = 'CreatedAt';
    if (sortModel.length > 0) {
      sortColumn = sortModel[0].colId;
      sortBy = sortModel[0].sort === 'asc' ? 'ASC' : 'DESC';
    }

    const payload = {
      pageNumber: this.currentGridQuery.pageNumber,
      pageSize: this.currentGridQuery.pageSize,
      sortModel: this.currentGridQuery.sortModel || [],
      filterModel: this.currentGridQuery.filterModel || {},
      sortBy: sortBy,
      sortColumn: sortColumn,
      searchText: searchText || '',
      divisionCode: this.filterDivision || '',
      departmentCode: this.filterDepartment || '',
      subDepartmentCode: this.filterSubDepartment || '',
      businessDomainCode: this.filterBusinessDomain || '',
      documentTypeCode: this.filterDocumentType || '',
    };

    this._documentService.getMyDraftDocuments(payload).subscribe({
      next: (response) => {
        if (response?.Success) {
          const data = response?.Data;
          const items = data?.Items || (Array.isArray(data) ? data : []);

          this.totalRows = data?.TotalCount ?? items.length;
          this.draftDocumentsData = items.map((item: any) => ({
            Id: item.Id ?? item.id,
            documentNumber: item.DocumentNumber ?? item.documentNumber,
            documentType: item.DocumentType ?? item.documentType,
            documentTypeCode: item.DocumentTypeCode ?? item.documentTypeCode,
            documentName: item.DocumentName ?? item.documentName,
            justification: item.Justification ?? item.justification ?? '',
            version: item.Version ?? item.version,
            division: item.Division ?? item.division,
            divisionCode: item.DivisionCode ?? item.divisionCode,
            department: item.Department ?? item.department,
            departmentCode: item.DepartmentCode ?? item.departmentCode,
            subdepartment: item.SubDepartment ?? item.subDepartment,
            subDepartmentCode: item.SubDepartmentCode ?? item.subDepartmentCode,
            businessDomain: item.BusinessDomain ?? item.businessDomain,
            businessDomainCode: item.BusinessDomainCode ?? item.businessDomainCode,
            // A reverted document was submitted once before; a plain draft never was.
            status: (item.IsReworked ?? item.isReworked) ? 'Reverted' : 'Draft',
            proposedContent: item.VersionContent ?? item.versionContent ?? '',
            draftFileUrl: item.DocumentURL ?? item.documentURL ?? '',
            distributionListPayload: (item.DistributionList ?? item.distributionList ?? []).map(
              (x: any) => ({
                ...x,
                level1Id: x.DivisionCode ?? x.divisionCode,
                level2Id: x.DepartmentCode ?? x.departmentCode,
                level3Id: x.SubDepartmentCode ?? x.subDepartmentCode,
                level4Id: x.BusinessDomainCode ?? x.businessDomainCode,
                roleId: x.RoleId ?? x.roleId,
                distributiontypeId: x.DistributionTypeId ?? x.distributionTypeId,
              }),
            ),
            distributionUserList: item.UserList ?? item.userList ?? [],
            lastSavedOn: new CustomDateFormatPipe().transform(
              item.LastModifiedAt ?? item.lastModifiedAt ?? item.CreatedAt ?? '',
            ),
          }));
        } else {
          this.draftDocumentsData = [];
          this.totalRows = 0;
        }
      },
      error: (err) => {
        this.draftDocumentsData = [];
        this.totalRows = 0;
        this._notificationToastService.createNotification(
          'error',
          'Error',
          err?.error?.Message || err?.Message || 'Failed to fetch your draft documents.',
        );
      },
    });
  }

  onCellClicked(event: any): void {
    // The Justification and Status cells have their own popups -- clicking those shouldn't also
    // reload the detail panel.
    const field = event?.colDef?.field;
    if (field === 'justification' || field === 'status') return;

    const row = event?.data;
    if (!row) return;

    this.selectedDraftDocument = row;
    this.loadingDetail = true;
    this.pendingDetailLoads = 0;

    this.documentId = row.Id;
    this.documentName = row.documentName || '';
    this.inputJustificationValue = row.justification || '';
    this.templateHtml = row.proposedContent || '';
    this.draftFileUrl = row.draftFileUrl || '';
    this.draftFile = null;
    this.templateFileUrl = '';
    this.selectedTemplateType = '';
    this.selectedDocumentType = row.documentType || '';
    this.selectedDocumentTypeCode = row.documentTypeCode || '';
    this.selectedDivisions = row.divisionCode || '';
    this.selectedDepartment = row.departmentCode || '';
    this.selectedSubDepartment = row.subDepartmentCode || '';
    this.selectedBusinessDomain = row.businessDomainCode || '';

    this.distributionListPayload = row.distributionListPayload || [];
    this.distributionUserList = row.distributionUserList || [];

    if (this.selectedDocumentTypeCode) {
      this.pendingDetailLoads++;
      this.GetTemplate(this.selectedDocumentTypeCode);
    }

    this.pendingDetailLoads++;
    this.loadRevertedObservations(row);

    this.pendingDetailLoads++;
    this.loadSavedAttributes(row.Id);

    this.pendingDetailLoads++;
    this.loadTrainingAssignments(row.Id);

    if (this.pendingDetailLoads === 0) {
      this.loadingDetail = false;
    }
  }

  // Called from every exit path of each lookup kicked off in onCellClicked, so loadingDetail
  // only clears once all of them are done.
  private finishDetailLoad(): void {
    this.pendingDetailLoads = Math.max(0, this.pendingDetailLoads - 1);
    if (this.pendingDetailLoads === 0) {
      this.loadingDetail = false;
    }
  }

  // Shown above the Justification panel so the user sees why the document was sent back before
  // reworking it -- the same data the "Reverted" status cell's popup shows in full.
  loadRevertedObservations(row: any): void {
    this.revertedObservations = [];

    if (!row || row.status !== 'Reverted') {
      this.finishDetailLoad();
      return;
    }

    this.loadingObservations = true;
    this._documentRequestService
      .GetWorkflowObservationDetails(row.Id, 'Document', 'Reworked')
      .subscribe({
        next: (response) => {
          this.loadingObservations = false;
          this.revertedObservations = (response?.Data || []).map((item: any) => ({
            Observation: item.Observation,
          }));
          this.finishDetailLoad();
        },
        error: () => {
          this.loadingObservations = false;
          this.revertedObservations = [];
          this.finishDetailLoad();
        },
      });
  }

  private loadSavedAttributes(documentId: number): void {
    this.attributeValues = [];
    if (!documentId) {
      this.finishDetailLoad();
      return;
    }
    this._documentAttributeService.getDocumentAttributeByDocumentId(documentId).subscribe({
      next: (res) => {
        this.attributeValues = res?.Data || [];
        this.finishDetailLoad();
      },
      error: () => {
        this.attributeValues = [];
        this.finishDetailLoad();
      },
    });
  }

  private loadTrainingAssignments(documentId: number): void {
    this.trainingUsersData = [];
    if (!documentId) {
      this.finishDetailLoad();
      return;
    }
    this._documentService.GetDocumentTrainingAssignments(documentId).subscribe({
      next: (res) => {
        this.trainingUsersData = res?.Data || [];
        this.finishDetailLoad();
      },
      error: () => {
        this.trainingUsersData = [];
        this.finishDetailLoad();
      },
    });
  }

  GetTemplate(documentTypeCode: string) {
    this._documentTemplateService.getTemplateByDocumentTypeCode(documentTypeCode).subscribe({
      next: (response: any) => {
        if (!response?.Success || !response?.Data || Object.keys(response.Data).length === 0) {
          this.selectedTemplateType = '';
          this.templateFileUrl = '';
          this.finishDetailLoad();
          return;
        }

        this.selectedTemplateType =
          response.Data?.TemplateType?.toString() || response.Data?.templateType?.toString() || '';
        this.templateFileUrl =
          response.Data?.TemplateFileUrl ||
          response.Data?.TemplateFileURL ||
          response.Data?.templateFileUrl ||
          '';
        this.finishDetailLoad();
      },
      error: () => {
        this.selectedTemplateType = '';
        this.templateFileUrl = '';
        this.finishDetailLoad();
      },
    });
  }

  onDraftFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      this.draftFile = null;
      return;
    }

    const file = fileList[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const expectedExt = this.expectedTemplateExtension;

    if (expectedExt && ext !== expectedExt) {
      this._notificationToastService.createNotification(
        'warning',
        'Invalid File',
        `The document template is a .${expectedExt} file. Please upload a matching .${expectedExt} file.`,
      );
      event.target.value = '';
      this.draftFile = null;
      return;
    }

    this.draftFile = file;
    this.previewUploadedFileContent(file);
  }

  // Converts an uploaded .docx to HTML client-side so its content shows in the editor for
  // review/editing. Only .docx is supported; anything else leaves the editor empty and the
  // original file is what gets submitted. Never blocks submission on failure.
  private previewUploadedFileContent(file: File): void {
    this.templateHtml = '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'docx') return;

    this.convertingUploadedFile = true;
    file
      .arrayBuffer()
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        this.templateHtml = result.value;
      })
      .catch(() => {
        // Leave templateHtml empty -- the uploaded file is still valid for submission.
      })
      .finally(() => {
        this.convertingUploadedFile = false;
      });
  }

  getFileIconClass(filename: string | null | undefined): string {
    if (!filename) return 'bi-file-earmark-text text-primary';
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'bi-file-earmark-pdf text-danger';
      case 'doc':
      case 'docx':
        return 'bi-file-earmark-word text-primary';
      case 'xls':
      case 'xlsx':
        return 'bi-file-earmark-excel text-success';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'bi-file-earmark-image text-info';
      default:
        return 'bi-file-earmark-text text-secondary';
    }
  }

  getDraftFileName(): string {
    if (this.draftFile) return this.draftFile.name;
    if (this.draftFileUrl) {
      try {
        const decoded = decodeURIComponent(this.draftFileUrl);
        const parts = decoded.split('/');
        return parts[parts.length - 1].split('?')[0];
      } catch {
        const parts = this.draftFileUrl.split('/');
        return parts[parts.length - 1];
      }
    }
    return '';
  }

  reviewDraftedFile(): void {
    if (!this.draftFile) return;
    const fileURL = URL.createObjectURL(this.draftFile);
    window.open(fileURL, '_blank');
    setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
  }

  removeDraftedFile(): void {
    this.draftFile = null;
    this.draftFileUrl = '';
    // templateHtml here only holds the removed file's converted preview -- leaving it set would
    // show stale content in the editor after the file is gone.
    this.templateHtml = '';
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  downloadDraft(): void {
    if (!this.documentId) return;
    this._documentService.DownloadDocumentTemplate(this.documentId).subscribe({
      next: (response: any) => {
        const body = response?.body || response;
        const blob = body instanceof Blob ? body : body instanceof ArrayBuffer ? new Blob([body]) : null;

        if (!blob) {
          this._notificationToastService.createNotification(
            'warning',
            'Draft',
            'No drafted file available for download.',
          );
          return;
        }

        let filename = this.getDraftFileName() || `Draft_${this.documentId}`;
        const contentDisposition =
          response?.headers?.get('content-disposition') ||
          response?.headers?.get('Content-Disposition');
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this._notificationToastService.createNotification(
          'error',
          'Draft',
          'Failed to download draft.',
        );
      },
    });
  }

  // Both actions post the identical multipart payload -- submit-document starts the approval
  // workflow, save-document-as-draft doesn't. documentid is always sent, so the existing draft is
  // updated rather than a second document being created.
  private buildFormData(): FormData {
    const distributionList = (this.distributionListPayload || []).map((x: any) => ({
      divisionCode: x.level1Id || x.divisionCode,
      departmentCode: x.level2Id || x.departmentCode,
      subDepartmentCode: x.level3Id || x.subDepartmentCode,
      businessDomainCode: x.level4Id || x.businessDomainCode,
      roleId: x.roleId,
      distributionTypeId: x.distributiontypeId || x.distributionTypeId,
    }));

    const userIds = (this.distributionUserList || [])
      .map((u: any) => ({
        employeeCode: u.EmployeeCode || u.employeeCode || u.empcode || u.UserCode || '',
        roleId: u.RoleId ?? u.roleId,
        divisionCode: u.DivisionCode ?? u.divisionCode,
        departmentCode: u.DepartmentCode ?? u.departmentCode,
        subDepartmentCode: u.SubDepartmentCode ?? u.subDepartmentCode,
        businessDomainCode: u.BusinessDomainCode ?? u.businessDomainCode,
      }))
      .filter((u: any) => !!u.employeeCode);

    const attributes = (this.attributeValues || []).map((a: any) => ({
      documentAttributeId: a.DocumentAttributeId ?? a.documentAttributeId ?? a.AttributeId,
      value: a.Value ?? a.value ?? '',
    }));

    const trainingUsers = (this.trainingUsersData || []).map((t: any) => ({
      trainingmode: t.TrainingMode ?? t.trainingmode ?? 0,
      employeecode: t.EmployeeCode ?? t.employeecode ?? t.UserCode ?? '',
    }));

    const formData = new FormData();
    formData.append('documentid', String(this.documentId || 0));
    formData.append('documenttypecode', this.selectedDocumentTypeCode || '');
    formData.append('documentname', this.documentName || '');
    formData.append('justification', this.inputJustificationValue || '');
    formData.append('divisioncode', this.selectedDivisions || '');
    formData.append('departmentcode', this.selectedDepartment || '');
    formData.append('subdepartmentcode', this.selectedSubDepartment || '');
    formData.append('businessdomaincode', this.selectedBusinessDomain || '');
    formData.append('distributionlist', JSON.stringify(distributionList));
    formData.append('userids', JSON.stringify(userIds));
    formData.append('attributes', JSON.stringify(attributes));
    formData.append('trainingusers', JSON.stringify(trainingUsers));
    formData.append('adhocapprovers', JSON.stringify([]));

    if (this.draftFile) {
      formData.append('DocumentFile', this.draftFile, this.draftFile.name);
    }
    if (this.templateHtml) {
      formData.append('ProposedContent', this.templateHtml);
    }

    return formData;
  }

  SaveDraftDocument(): void {
    this.loadingDraft = true;
    this._documentService.saveDocumentAsDraft(this.buildFormData()).subscribe({
      next: (response) => {
        this.loadingDraft = false;
        if (response?.Success) {
          this._notificationToastService.createNotification(
            'success',
            'Document Draft',
            response.Message || 'Draft saved successfully.',
          );
          this.closeDetailAndRefresh();
        }
      },
      error: (err) => {
        this.loadingDraft = false;
        this._notificationToastService.createNotification(
          'error',
          'Document Draft',
          err?.error?.Message || 'Failed to save draft.',
        );
      },
    });
  }

  SubmitDraftDocument(): void {
    this.loadingSubmit = true;
    this._documentService.submitDocument(this.buildFormData()).subscribe({
      next: (response) => {
        this.loadingSubmit = false;
        if (response?.Success) {
          this._notificationToastService.createNotification(
            'success',
            'Document',
            response.Message || 'Document submitted successfully.',
          );
          this.closeDetailAndRefresh();
        }
      },
      error: (err) => {
        this.loadingSubmit = false;
        this._notificationToastService.createNotification(
          'error',
          'Document',
          err?.error?.Message || 'Failed to submit document.',
        );
      },
    });
  }

  // This grid is server-side, so reassigning draftDocumentsData doesn't reach AG Grid's rendered
  // rows -- refresh() forces a real refetch. Closing the panel also stops the same in-memory form
  // being saved twice by mistake.
  private closeDetailAndRefresh(): void {
    this.agGridWrapper?.gridApi?.deselectAll();
    this.agGridWrapper?.refresh();
    this.selectedDraftDocument = null;
    this.draftDocumentChanged.emit();
  }

  openObservationModal(rowData: any) {
    this.modal.create({
      nzTitle: 'Observation',
      nzContent: WorkflowObservationDialogComponent,
      nzData: {
        id: rowData.Id,
        entityType: 'Document',
        mode: 'view',
        action: 'Approver',
        decision: 'Reworked',
      },
      nzFooter: null,
      nzWidth: '70%',
    });
  }

  openJustificationModal(justificationText: string): void {
    const text = justificationText || 'No justification provided.';
    const modalRef = this.modal.create({
      nzTitle: 'Justification',
      nzContent: `<div style="padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${text}</div>`,
      nzClosable: true,
      nzMaskClosable: true,
      nzFooter: [
        {
          label: 'Close',
          type: 'primary',
          onClick: () => modalRef.destroy(),
        },
      ],
      nzWidth: 600,
    });
  }
}
