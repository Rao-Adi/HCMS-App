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
import { statusBadgeClass, normalizeStatusLabel } from '@app/shared/utils/document-status';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';
import { WorkflowStepService } from '@app/shared/services/workflow-step-service';
import { TrainingPolicyService } from '@app/shared/services/training-policy-service';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { RoleList } from '@app/shared/Dropdowns/role-list/role-list';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { EmployeeList } from '@app/shared/Dropdowns/employee-list/employee-list';

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
    NzSelectModule,
    RoleList,
    EmployeeList,
  ],
  templateUrl: './draft-document-list.html',
  styleUrl: './draft-document-list.css',
})
export class DraftDocumentList implements OnInit {
  @ViewChild(AgGridWrapper) agGridWrapper!: AgGridWrapper;
  @ViewChild('fileInput') fileInput!: any;
  // Reads its label from adHocEmployeeListRef.options -- see AddAdHocApprover, mirrored from
  // create-update-document.ts's own picker.
  @ViewChild('adHocEmployeeList') adHocEmployeeListRef?: EmployeeList;

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

  // Workflow Authorities preview. approvalSequenceData is the policy-resolved chain, fetched the
  // same way create-update-document.ts's own preview does. adHocApprovers is this document's
  // ad-hoc approver, editable here the same way it is on Create/Update Document -- previously
  // this screen only showed whatever get-carried-adhoc-approver returned, with no way to add one
  // back. That mattered because SaveDocumentAsDraftAsync did not persist an ad-hoc approver
  // picked on Create/Update Document, so one added there and then only Draft-saved (rather than
  // submitted immediately) was silently lost, and this screen -- the only other place a reverted
  // or still-drafted document can be resubmitted from -- had no control to add it back. Confirmed
  // on IT-II-SOP-012: an ad-hoc approver picked at creation never made it into the workflow, and
  // after the document was reverted this screen offered no way to add them for resubmission.
  // loadCarriedAdHocApprover seeds this array from whatever's already persisted
  // (DocumentAdHocApprovers); AddAdHocApprover/RemoveAdHocApprover edit it from there. Capped at
  // exactly one entry, matching Create/Update Document's own confirmed scope.
  approvalSequenceData: any[] = [];
  adHocApprovers: { EmployeeCode: string; EmployeeName: string; Role: string }[] = [];
  selectedAdHocApprover: string = '';
  combinedWorkflowAuthorities: any[] = [];

  private rebuildCombinedWorkflowAuthorities(): void {
    const policySteps = this.approvalSequenceData || [];
    const adHocSteps = (this.adHocApprovers || []).map((a, idx) => ({
      StepOrder: policySteps.length + idx + 1,
      EmployeeCode: a.EmployeeCode,
      EmployeeName: a.EmployeeName,
      UserRole: a.Role,
    }));
    this.combinedWorkflowAuthorities = [...policySteps, ...adHocSteps];
  }

  // Mirrors create-update-document.ts's own AddAdHocApprover.
  AddAdHocApprover(): void {
    if (!this.selectedAdHocApprover) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select an approver.',
      );
      return;
    }
    if (this.adHocApprovers.length > 0) {
      return;
    }

    const opt = this.adHocEmployeeListRef?.options.find(
      (o) => o.value === this.selectedAdHocApprover,
    );
    const name = opt?.label ? opt.label.replace(/\s*\([^)]*\)\s*$/, '') : this.selectedAdHocApprover;
    const employeeCode = this.selectedAdHocApprover;
    this.adHocApprovers.push({
      EmployeeCode: employeeCode,
      EmployeeName: name,
      Role: 'Ad-hoc Approver',
    });
    this.rebuildCombinedWorkflowAuthorities();
    this.selectedAdHocApprover = '';

    this._peoplePartnerService.GetEmployeeRoleByCode(employeeCode).subscribe({
      next: (res) => {
        const role = res?.Data;
        if (!role) return;
        const entry = this.adHocApprovers.find((a) => a.EmployeeCode === employeeCode);
        if (entry) {
          entry.Role = role;
          this.adHocApprovers = [...this.adHocApprovers];
          this.rebuildCombinedWorkflowAuthorities();
        }
      },
      error: () => {},
    });
  }

  RemoveAdHocApprover(index: number): void {
    this.adHocApprovers.splice(index, 1);
    this.rebuildCombinedWorkflowAuthorities();
  }

  // Training Users -- editable here, same as on Create/Update Document. Previously this panel
  // only fetched the document's existing assignment to carry it through unchanged on Submit
  // (loadTrainingAssignments); there was no way to add or change a trainee from a reverted
  // document, so a document reverted specifically for a training-assignment problem had no way
  // to be corrected from this tab.
  trainingRequired: boolean = false;
  showTrainingUserTable = false;
  selectedTrainingMode: string = '';
  selectedRole?: string = '';
  selectedUser: string[] = [];
  trainingModes: SelectList[] = [
    { CODE: 'Classroom', NAME: 'Classroom' },
    { CODE: 'Online', NAME: 'Online' },
  ];
  users: any[] = [];
  // Dedicated to the trainer/user picker's own lookup -- deliberately NOT the same totalRows the
  // grid's own pagination uses above, so picking a trainer can never clobber the grid's state.
  private trainingUserTotalRows = 0;

  private CheckTrainingPolicy(documentTypeCode: string): void {
    this.trainingRequired = false;
    if (!documentTypeCode) return;
    this._trainingPolicyService.GetTrainingPolicyByDocumentType(documentTypeCode).subscribe({
      next: (res) => {
        this.trainingRequired = !!res?.Data?.TrainingRequired;
      },
      error: () => {
        this.trainingRequired = false;
      },
    });
  }

  // Verbatim from create-update-document.ts's own AddTrainingUsers -- same validation (including
  // the same-User+same-Training-Mode duplicate check), same shape pushed into trainingUsersData,
  // which SubmitDraftDocument already sends unchanged.
  AddTrainingUsers(): void {
    if (!this.selectedTrainingMode) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Training Mode.',
      );
      return;
    }
    if (!this.selectedRole) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select a Trainer.',
      );
      return;
    }
    if (!this.selectedUser || this.selectedUser.length === 0) {
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        'Please select at least one User.',
      );
      return;
    }

    const mode = this.trainingModes.find((m) => m.CODE === this.selectedTrainingMode);

    // Mirrors create-update-document.ts's own duplicate check: a user already assigned for this
    // SAME Training Mode is a duplicate; the same person under a DIFFERENT mode stays allowed.
    const alreadyAssigned = this.selectedUser.filter((userCode) =>
      this.trainingUsersData.some(
        (row: any) => row.UserCode === userCode && row.TrainingMode === mode?.NAME,
      ),
    );
    const usersToAdd = this.selectedUser.filter((userCode) => !alreadyAssigned.includes(userCode));

    if (alreadyAssigned.length > 0) {
      const names = alreadyAssigned
        .map((code) => this.users.find((u) => u.CODE === code)?.RAW_NAME || code)
        .join(', ');
      this._notificationToastService.createNotification(
        'warning',
        'Validation',
        `${names} ${alreadyAssigned.length > 1 ? 'are' : 'is'} already assigned for ${mode?.NAME} training.`,
      );
    }

    if (usersToAdd.length === 0) {
      return;
    }

    this.showTrainingUserTable = true;

    usersToAdd.forEach((userCode) => {
      const user = this.users.find((u) => u.CODE === userCode);
      this.trainingUsersData.push({
        TrainingMode: mode?.NAME,
        TrainerName: user?.role,
        // RAW_NAME is the bare name; NAME is that same name pre-formatted as "(code) Name" for
        // the picker's own dropdown label -- see the matching note on create-update-document.ts's
        // own AddTrainingUsers. Kept bare here too so the table formats every row the same way,
        // whether it was just added or prefilled from the document's existing assignment.
        UserName: user?.RAW_NAME || user?.CODE,
        TrainerCode: this.selectedRole,
        UserCode: user?.CODE,
      });
    });

    this.selectedRole = '';
    this.selectedUser = [];
  }

  // Mirrors create-update-document.ts's own RemoveTrainingUser -- the table had no way to undo an
  // add. Reported after a user added three trainees and had no way to remove the two they didn't
  // mean to keep.
  RemoveTrainingUser(index: number): void {
    this.trainingUsersData.splice(index, 1);
  }

  // Verbatim from create-update-document.ts's own loadUsersWhenRoleIdChanges.
  loadUsersWhenRoleIdChanges(query: any = {}): void {
    const roleId = this.selectedRole;
    if (!roleId) {
      this.users = [];
      this.trainingUserTotalRows = 0;
      this.selectedUser = [];
      return;
    }
    const sort = query.sortModel?.[0];
    const payload = {
      searchtext: query.searchTerm || query.searchText || '',
      sortby: sort?.sort?.toUpperCase() || 'ASC',
      sortcolumn: sort?.colId || 'empid',
      isactive: true,
      pagenumber: Number(query.pageNumber) || 1,
      pagesize: Number(query.pageSize) || 50,
      divisionCode: null,
      departmentCode: null,
      subDepartmentCode: null,
      businessDomainCode: null,
      documentTypeCode: this.selectedDocumentTypeCode,
    };

    this._peoplePartnerService.getUserByRoleId(roleId, payload).subscribe((res) => {
      if (res?.Success && res.Data) {
        const data = res.Data;
        const users = (Array.isArray(data) ? data : data.Items || []).filter((u: any) => u != null);

        if (users.length > 0) {
          this.trainingUserTotalRows = data.TotalCount ?? users.length;
          this.users = users
            .map((u: any) => {
              const code =
                u.empcode ||
                u.empCode ||
                u.EmployeeCode ||
                u.employeeCode ||
                u.empid ||
                u.empId ||
                u.EmployeeId ||
                u.id ||
                u.Id ||
                u.UserId ||
                u.userId ||
                u.UserCode ||
                u.userCode ||
                u.CODE;
              const name = u.firstname
                ? `${u.firstname} ${u.midname || ''} ${u.lastname || ''}`.trim().replace(/\s+/g, ' ')
                : u.EmployeeName ||
                  u.employeeName ||
                  u.empName ||
                  u.EmpName ||
                  u.UserName ||
                  u.userName ||
                  u.Name ||
                  u.name ||
                  u.NAME ||
                  code;

              return {
                ...u,
                CODE: code,
                NAME: '(' + code + ') ' + name,
                RAW_NAME: name,
              };
            })
            .sort((a: any, b: any) => (a.RAW_NAME || '').localeCompare(b.RAW_NAME || ''));
        } else {
          this.users = [];
          this.trainingUserTotalRows = 0;
        }
      } else {
        this.users = [];
        this.trainingUserTotalRows = 0;
      }
    });
  }

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
        const label = normalizeStatusLabel(params.value);
        if (!label) return '';
        // Only a Reverted row has an observation behind it, so only that one reads as clickable.
        const clickable = label === 'Reverted' ? ' dms-status-clickable' : '';
        return `<span class="dms-status-pill ${statusBadgeClass(label)}${clickable}" data-action="open">${label}</span>`;
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
    private _navigationCountsService: NavigationCountsService,
    private _workflowStepService: WorkflowStepService,
    private _trainingPolicyService: TrainingPolicyService,
    private _peoplePartnerService: PeoplePartnersService,
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

  /**
   * Drops whatever row was open in the detail panel.
   *
   * Changing a filter re-queries the grid, so the row the panel is showing may no longer be in
   * the results at all -- leaving its Justification, Cabinet, Users, Distribution, Content and
   * attributes on screen under an empty grid, still editable and still submittable. Every field
   * onCellClicked sets is reset here, so the two can never drift apart.
   */
  private clearSelectedDocument(): void {
    this.selectedDraftDocument = null;
    this.documentId = 0;
    this.documentName = '';
    this.inputJustificationValue = '';
    this.templateHtml = '';
    this.draftFileUrl = '';
    this.draftFile = null;
    this.templateFileUrl = '';
    this.selectedTemplateType = '';
    this.selectedDocumentType = '';
    this.selectedDocumentTypeCode = '';
    this.selectedDivisions = '';
    this.selectedDepartment = '';
    this.selectedSubDepartment = '';
    this.selectedBusinessDomain = '';
    this.distributionListPayload = [];
    this.distributionUserList = [];
    this.revertedObservations = [];
    this.attributeValues = [];
    this.trainingUsersData = [];
    this.trainingRequired = false;
    this.showTrainingUserTable = false;
    this.selectedTrainingMode = '';
    this.selectedRole = '';
    this.selectedUser = [];
    this.users = [];
    this.approvalSequenceData = [];
    this.adHocApprovers = [];
    this.selectedAdHocApprover = '';
    this.combinedWorkflowAuthorities = [];
    this.pendingDetailLoads = 0;
    this.loadingDetail = false;
  }

  onFilterHierarchyChange(values: CabinetSelection[]): void {
    this.cabinetHierarchy = values ?? [];
    this.filterDivision = values.find((v) => v.level === 1)?.value ?? null;
    this.filterDepartment = values.find((v) => v.level === 2)?.value ?? null;
    this.filterSubDepartment = values.find((v) => v.level === 3)?.value ?? null;
    this.filterBusinessDomain = values.find((v) => v.level === 4)?.value ?? null;
    this.clearSelectedDocument();
    this.refreshGrid();
  }

  onDocumentTypeChange(value: string): void {
    this.filterDocumentType = value;
    this.clearSelectedDocument();
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

    // Transient picker state for adding a trainer -- reset per row so leftover selections from
    // whichever document was open before can't be added to this one by mistake.
    this.selectedTrainingMode = '';
    this.selectedRole = '';
    this.selectedUser = [];
    this.users = [];
    this.CheckTrainingPolicy(this.selectedDocumentTypeCode);

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

    this.pendingDetailLoads++;
    this.loadWorkflowAuthorities(this.selectedDocumentTypeCode);

    this.pendingDetailLoads++;
    this.loadCarriedAdHocApprover(row.Id);

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
    this.showTrainingUserTable = false;
    if (!documentId) {
      this.finishDetailLoad();
      return;
    }
    this._documentService.GetDocumentTrainingAssignments(documentId).subscribe({
      next: (res) => {
        // The raw response shape (TrainingMode as a numeric code, Role/EmployeeName/EmployeeCode)
        // does not match what the table below reads (TrainingMode as a name, TrainerName,
        // UserName) -- same mapping create-update-document.ts's own onCellClicked applies to this
        // same endpoint. Without it the table showed the bare numeric mode and blank Trainer/User
        // cells, even though the assignment itself was loaded correctly.
        const modeName = (m: number) => (m === 1 ? 'Classroom' : m === 2 ? 'Online' : '');
        this.trainingUsersData = (res?.Data || []).map((t: any) => ({
          TrainingMode: modeName(t.TrainingMode),
          TrainerName: t.Role || '',
          UserName: t.EmployeeName?.trim() || t.EmployeeCode,
          TrainerCode: '',
          UserCode: t.EmployeeCode,
        }));
        this.showTrainingUserTable = this.trainingUsersData.length > 0;
        this.finishDetailLoad();
      },
      error: () => {
        this.trainingUsersData = [];
        this.showTrainingUserTable = false;
        this.finishDetailLoad();
      },
    });
  }

  // The policy-resolved approval chain for this row's Document Type + Cabinet -- same call
  // create-update-document.ts's own Workflow Authorities preview makes, so a document revised or
  // resubmitted from either screen shows the identical sequence.
  private loadWorkflowAuthorities(documentTypeCode: string): void {
    this.approvalSequenceData = [];
    if (!documentTypeCode) {
      this.rebuildCombinedWorkflowAuthorities();
      this.finishDetailLoad();
      return;
    }
    const payLoad = {
      EntityType: 'Document',
      documentTypeCode,
      divisionCode: this.selectedDivisions || '',
      departmentCode: this.selectedDepartment || '',
      subDepartmentCode: this.selectedSubDepartment || '',
      businessDomainCode: this.selectedBusinessDomain || '',
    };
    this._workflowStepService.getWorkflowStepByDocumentTypeCode(payLoad).subscribe({
      next: (res) => {
        this.approvalSequenceData = res?.Data || [];
        this.rebuildCombinedWorkflowAuthorities();
        this.finishDetailLoad();
      },
      error: () => {
        this.approvalSequenceData = [];
        this.rebuildCombinedWorkflowAuthorities();
        this.finishDetailLoad();
      },
    });
  }

  // Seeds adHocApprovers from whatever this document already has persisted (DocumentAdHocApprovers,
  // via get-carried-adhoc-approver) -- either a prior execution's ad-hoc step, or one picked on
  // Create/Update Document and only Draft-saved since. AddAdHocApprover/RemoveAdHocApprover edit
  // it from there, same as on Create/Update Document.
  private loadCarriedAdHocApprover(documentId: number): void {
    this.adHocApprovers = [];
    if (!documentId) {
      this.rebuildCombinedWorkflowAuthorities();
      this.finishDetailLoad();
      return;
    }
    this._documentService.getCarriedAdHocApprover(documentId).subscribe({
      next: (res) => {
        const carried = res?.Data;
        this.adHocApprovers = carried
          ? [{ EmployeeCode: carried.EmployeeCode, EmployeeName: carried.EmployeeName, Role: carried.Role }]
          : [];
        this.rebuildCombinedWorkflowAuthorities();
        this.finishDetailLoad();
      },
      error: () => {
        this.adHocApprovers = [];
        this.rebuildCombinedWorkflowAuthorities();
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

    // The four typed value columns are forwarded individually, NOT flattened into one
    // `value` field. SubmitDocument's attribute DTO binds ValueText / ValueNumber / ValueDate /
    // ValueBoolean; a property named `value` binds to none of them, so every attribute arrived
    // with all four null and ValidateAndSaveAttributesAsync rejected the submit with
    // "Attribute '<label>' is mandatory" -- even though the draft had the value saved.
    //
    // get-document-attributes-by-documentId already returns exactly these four columns, so this
    // is a pass-through. ?? (not ||) is deliberate: it preserves a false ValueBoolean and a zero
    // ValueNumber, which || would have turned back into null.
    // A blank is not a value. ?? only replaces null and undefined, so an empty string from
    // the read API was forwarded verbatim -- and "" is not a date, which failed the submit
    // outright. Anything blank becomes null here regardless of which end produced it.
    const orNull = (v: any) => (v === null || v === undefined || v === '' ? null : v);

    const attributes = (this.attributeValues || []).map((a: any) => ({
      documentAttributeId: a.DocumentAttributeId ?? a.documentAttributeId ?? a.AttributeId,
      valueText: orNull(a.ValueText ?? a.valueText),
      valueNumber: orNull(a.ValueNumber ?? a.valueNumber),
      valueDate: orNull(a.ValueDate ?? a.valueDate),
      valueBoolean: orNull(a.ValueBoolean ?? a.valueBoolean),
    }));

    const trainingUsers = (this.trainingUsersData || []).map((t: any) => {
      // TrainingMode on trainingUsersData rows is always the display name ("Classroom"/"Online",
      // see AddTrainingUsers/loadTrainingAssignments above), never the numeric code the backend's
      // TraningUsers.TrainingMode (int) expects -- forwarding it unconverted made
      // save-document-as-draft's JSON.Deserialize fail with "The JSON value could not be
      // converted to System.Int32" on $[0].trainingmode. Mirrors create-update-document.ts's own
      // buildDocumentFormData.
      const modeVal =
        t.TrainingMode === 'Classroom' ? 1 : t.TrainingMode === 'Online' ? 2 : (t.trainingmode ?? 0);
      return {
        trainingmode: modeVal,
        employeecode: t.EmployeeCode ?? t.employeecode ?? t.UserCode ?? '',
      };
    });

    // employeecode only, matching create-update-document.ts's own buildDocumentFormData -- the
    // backend re-resolves everything else (active check, responsibility transfer, job Role) at
    // Draft-save/Submit time. Sending this.adHocApprovers explicitly (rather than always []) is
    // what lets an ad-hoc approver added or removed here actually take effect -- previously this
    // screen hardcoded an empty list, relying entirely on the backend's own carry-over, which
    // could not restore one that had never made it into a workflow execution in the first place.
    const adHocApprovers = (this.adHocApprovers || []).map((a) => ({
      employeecode: a.EmployeeCode,
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
    formData.append('adhocapprovers', JSON.stringify(adHocApprovers));

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
            'Document saved as draft successfully!',
          );
          // Every badge, not just this screen's: a workflow transition can empty one inbox and
          // fill a queue on a screen the user is not looking at.
          this._navigationCountsService.refreshAfterAction('Document Draft Saved');
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

  // Success wording per activity type, matching the Create/Update Document screen.
  private submitSuccessMessage(): string | null {
    const code = this.selectedDraftDocument?.activityTypeCode || this.selectedDraftDocument?.ActivityTypeCode;
    switch (code) {
      case 'DRT-0002':
        return 'Document Revised Successfully!';
      case 'DRT-0003':
        return 'Document Obsoleted Successfully!';
      default:
        return 'Document Created Successfully!';
    }
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
            this.submitSuccessMessage() || response.Message || 'Document submitted successfully.',
          );
          // Every badge, not just this screen's: a workflow transition can empty one inbox and
          // fill a queue on a screen the user is not looking at.
          this._navigationCountsService.refreshAfterAction('Document Submitted from Draft');
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
