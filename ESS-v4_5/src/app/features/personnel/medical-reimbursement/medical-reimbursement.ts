import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '@app/core/services/data.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { MedicalReimbursementService } from '../medical-reimbursement-service';
import {
  Input,
  Output,
  NgZone,
  EventEmitter,
  Inject,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { ViewChild, ViewContainerRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { GridOptions } from 'ag-grid-community';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { Subscription } from 'rxjs';
import { NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { switchMap, distinctUntilChanged, map, catchError, tap } from 'rxjs/operators';
import { NzIconService } from 'ng-zorro-antd/icon';
import { DownloadOutline } from '@ant-design/icons-angular/icons';
const icons = [DownloadOutline, { ...DownloadOutline, name: 'download-o' }];
@Component({
  selector: 'app-medical-reimbursement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    AgGridAngular,
    NzDatePickerModule,
    NzUploadModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCheckboxModule,
  ],
  providers: [
    MedicalReimbursementService,
    DatePipe,
    DecimalPipe,
    { provide: NZ_ICONS, useValue: icons },
  ],
  templateUrl: './medical-reimbursement.html',
  styleUrl: './medical-reimbursement.css',
})
export class MedicalReimbursement implements OnInit {
  private translate = inject(TranslateService);
  private _userService = inject(DataService);
  private _UtilitiesService = inject(UtilitiesService);
  private medicalService = inject(MedicalReimbursementService);
  public gridOptions: GridOptions | undefined;
  @ViewChild('fileUploader') fileUploader: any;
  constructor(
    private router: Router,
    private _dataService: DataService,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private objUtilitiesService: UtilitiesService,
    private objDataService: DataService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
    private http: HttpClient,
    private iconService: NzIconService
  ) {
    this.iconService.addIcon(DownloadOutline);
    this.iconService.addIcon({ ...DownloadOutline, name: 'download-o' });
  }
  formId: string = 'EmployeeMedicalReimbursement';
  selectedTab: string = 'MedicalEntitlementDetails';
  image: any = './assets/images/pro.png';
  TopRightValidationMsg: string = '';
  public defaultColDef: ColDef = {};
  public noRowsOverlay: string = '';
  public recordsPerPage: number = 5;
  FiscalYear: FiscalYear = new FiscalYear();
  fiscalYearBy: Array<FiscalYear> = new Array<FiscalYear>();
  Dependents: Dependent[] = [];
  public DependentsColumnDefs: ColDef[] = [];
  public rowSelection: 'single' | 'multiple' = 'single';
  MedicalInfoRows: Array<MedicalInfoRow> = new Array<MedicalInfoRow>();
  public MedicalInfoColumnDefs: ColDef[] = [];
  MedicalReimbursement: medicalReimbursement = new medicalReimbursement();
  GridMedicalTypeSetup: Array<MedicalTypeSetup> = new Array<MedicalTypeSetup>();
  public MedicalTypeSetupColumnDefs: ColDef[] = [];
  MedicalClaimTransaction: MedicalClaimTransaction = new MedicalClaimTransaction();
  empMedicalTypes: Array<{ ID: number; NAME: string }> = [];
  MedicalTypeSetup: MedicalTypeSetup = new MedicalTypeSetup();
  currencies: Array<Currency> = new Array<Currency>();
  Hospitals: Array<HospitalSetup> = new Array<HospitalSetup>();
  public medicalExpenseDateObj: Date | null = null;
  public admissionDateObj: Date | null = null;
  public dischargeDateObj: Date | null = null;
  isMedicalExpenseDateInvalid: boolean = false;
  isMedicalCategoryInvalid: boolean = false;
  isTotalClaimInvalid: boolean = false;
  LoginEmpId: string = '';
  LoginCompanyId: string = '';
  culture: string = '';
  Amount: number | null = 0;
  AmountText: string | null = '';
  CurrencyCode: string = '';
  currencyId: number = 0;
  companyId: string = '';
  EmpId: number = 0;
  claimStatusId: 'P' | 'A' | 'N' = 'P';
  selectedDpdId: number = 0;
  claimStatus: string = 'P';
  recordId = 0;
  public nzFileList: NzUploadFile[] = [];
  public selectedFile: File | null = null;
  public fileSizeError: string | null = null;
  attachmentUrl: SafeUrl | null = null;
  validationMessage = { text: '', type: 'error' };
  conversionRate: number = 0;
  isSaveDisabled: boolean = false;
  showHrFields: boolean = false;
  msg: string = '';
  hasAttemptedSave = false;
  expenseDateWasEverValid: boolean = false;
  categoryWasEverValid: boolean = false;
  amountWasEverValid: boolean = false;
  isCurrencyInvalid: boolean = false;
  touched = {
    expenseDate: false,
    admissionDate: false,
    dischargeDate: false,
    category: false,
    totalClaim: false,
  };

  ngOnInit() {
    this.LoginEmpId = this._UtilitiesService.GetEmpid() || '';
    this.LoginCompanyId = this._UtilitiesService.GetCompanyId() || '';
    this.culture = this._UtilitiesService.GetAppCurrentUICulture() || '';
    this.loadEmployeeImage();
    this.medicalService.entitlements$.subscribe((data) => (this.MedicalInfoRows = data));
    this.medicalService.transactions$.subscribe((data) => (this.GridMedicalTypeSetup = data));
    this.medicalService.netAmount$.subscribe((data) => {
      this.Amount = data ? data.amount : null;
      this.AmountText = data ? data.text : null;
    });
    this.medicalService.currencyCode$.subscribe((code) => {
      this.CurrencyCode = code;
      this.setupMedicalInfoGrid();
    });
    this.LoadFiscalYearData(this.LoginCompanyId);
    this.LoadDependentData(this.LoginEmpId);
    this.LoadCurrency();
    this.LoadHospitals();
    this.setupDependentsGrid();
    this.setupMedicalTypeGrid();
  }
  loadEmployeeImage() {
    this._UtilitiesService.GetEmployeeImage(this.LoginEmpId).subscribe({
      next: (blob: any) => {
        if (!blob) {
          this.image = './assets/images/pro.png';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.image = reader.result as string;
        };
        reader.readAsDataURL(blob);
      },
      error: (error: any) => {
        console.error('Failed to load image from API:', error);
        this.image = './assets/images/pro.png';
      },
    });
  }
  LoadFiscalYearData(CompanyId: string): void {
    const url = `MedicalReimbursement/GetFiscalYear/${CompanyId}`;
    this._userService
      .get<any[]>(url)
      .pipe()
      .subscribe({
        next: (data: any[]) => {
          this.fiscalYearBy = data;
          if (data?.length > 0) {
            this.FiscalYear.ID = data[0].ID;
            this.loadEmployeeMedicalEnt(true);
            this.triggerRefresh();
          }
        },
        error: (error: any) => {
          console.error('Error fetching fiscal year:', error);
        },
      });
  }
  dependents: { id: number; text: string }[] = [{ id: 0, text: 'Self' }];
  LoadDependentData(EmpId: string): void {
    const url = `MedicalReimbursement/GetDependentsDetail/${EmpId}`;
    this._userService
      .get<any>(url)
      .pipe()
      .subscribe({
        next: (data) => {
          let dependents = data?.dependents ? [...data.dependents] : [];
          const selfRowIndex = dependents.findIndex((d: any) => d && Number(d.EMPDPDID) === 0);
          let selfRow = null;
          if (selfRowIndex > -1) {
            selfRow = dependents.splice(selfRowIndex, 1)[0];
          }
          dependents.sort((a: any, b: any) => a.NAME.localeCompare(b.NAME));
          if (selfRow) {
            dependents.unshift(selfRow);
          }
          this.Dependents = dependents;
          this.selectedDpdId = 0;
        },
        error: (error: any) => {
          console.error('Error loading dependents:', error);
        },
      });
  }
  loadEmployeeMedicalEnt(setAsDefault: boolean): Promise<void> {
    const url = `MedicalReimbursement/GetEmployeeMedicalType/${this.LoginEmpId}/${this.FiscalYear.ID}/${this.selectedDpdId}`;
    return firstValueFrom(this._userService.get<any>(url))
      .then((data) => {
        this.empMedicalTypes = data?.EmpMedicalType || [];
        if (setAsDefault) {
          const defaultOption = this.empMedicalTypes.find((t: any) => t.NAME === 'N/A');
          this.MedicalClaimTransaction.medicalCategoryId = defaultOption ? defaultOption.ID : 0;
        }
      })
      .catch((error) => {
        console.error('Error loading medical types:', error);
      });
  }
  LoadCurrency(): void {
    const url = 'MedicalReimbursement/GetCurrency/';
    this._userService.get<any>(url).subscribe({
      next: (data) => {
        this.currencies = data?.Currency || [];
        if (this.currencies.length > 0) {
          const defaultCurrency = this.currencies.find((c: any) => c.Code?.trim() === 'Rs.');
          if (defaultCurrency) {
            this.MedicalClaimTransaction.currencyId = defaultCurrency.SDLID;
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading currency:', error);
      },
    });
  }

  LoadHospitals() {
    const url = 'MedicalReimbursement/GetHospitals/';
    this._userService.get<any>(url).subscribe({
      next: (data) => {
        this.Hospitals = data?.Hospital || [];
        if (this.Hospitals.length > 0) {
          const defaultHospital = this.Hospitals.find((c) => c.NAME.trim() === 'N/A');
          if (defaultHospital) {
            this.MedicalClaimTransaction.hospitalId = defaultHospital.HOSID;
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading hospitals:', error);
      },
    });
  }
  setupDependentsGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.rowSelection = 'single';
    this.gridOptions = {
      rowSelection: 'single',
    };
    this.DependentsColumnDefs = [
      {
        headerName: this.translate.instant('labels.DependentsName'),
        field: 'NAME',
      },
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound');
  }
  setupMedicalInfoGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.MedicalInfoColumnDefs = [
      {
        headerName: this.translate.instant('labels.MedicalEntitlementCategory'),
        field: 'Medical Type',
        minWidth: 150,
      },
      {
        headerName: this.translate.instant('labels.AmmountScope'),
        field: 'AmountScope',
        minWidth: 120,
      },
      {
        headerName: `${this.translate.instant('labels.MonthlyAccumulatedLimit')} (${
          this.CurrencyCode
        })`,
        field: 'MonthlyAccumulated',
        cellRenderer: (params: any) => (params.value ? params.value.toLocaleString() : ''),
        minWidth: 150,
      },
      {
        headerName: `${this.translate.instant('labels.AvailableMonthlyLimit')} (${
          this.CurrencyCode
        })`,
        field: 'AvailableMonthlyLimit',
        cellRenderer: (params: any) => (params.value ? params.value.toLocaleString() : ''),
        minWidth: 150,
      },
      {
        headerName: this.translate.instant('labels.PendingforApproval'),
        field: 'Pendingforapproval',
        cellRenderer: (params: any) => (params.value ? params.value.toLocaleString() : ''),
        minWidth: 140,
      },
      {
        headerName: `${this.translate.instant('labels.AnnualLimit')} (${this.CurrencyCode})`,
        field: 'Balance Limit',
        cellRenderer: (params: any) => (params.value ? params.value.toLocaleString() : ''),
        minWidth: 140,
      },
      {
        headerName: `${this.translate.instant('labels.AvailableAnnualLimit')} (${
          this.CurrencyCode
        })`,
        field: 'Remaining Balance',
        cellRenderer: (params: any) => (params.value ? params.value.toLocaleString() : ''),
        minWidth: 140,
      },
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound');
  }
  setupMedicalTypeGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 90,
      tooltipValueGetter: (params) => params.value,
    };
    this.MedicalTypeSetupColumnDefs = [
      {
        headerName: this.translate.instant('labels.Dependents'),
        field: 'DpdName',
        minWidth: 150,
      },
      {
        headerName: this.translate.instant('labels.RelationwithDependent'),
        field: 'DpdRel',
        minWidth: 120,
      },
      {
        headerName: this.translate.instant('labels.MedicalEntitlementCategory'),
        field: 'MedicalName',
        minWidth: 150,
      },
      {
        headerName: this.translate.instant('labels.DateofClaim'),
        field: 'MDATE',
        minWidth: 150,
      },
      {
        headerName: this.translate.instant('labels.ClaimAmount'),
        field: 'TOTALCLAIM',
        cellRenderer: (params: any) => (params.value ? params.value.toLocaleString() : ''),
        minWidth: 140,
      },
      {
        headerName: this.translate.instant('labels.LessDisallowedAmount'),
        field: 'LessDisallowed',
        minWidth: 140,
      },
      {
        headerName: this.translate.instant('labels.NetClaimAmount'),
        field: 'AMOUNT',
        cellRenderer: (params: any) => {
          if (params.value == null) return '';
          const netAmount = params.value.toLocaleString();
          return `${netAmount} ${this.CurrencyCode}`;
        },
        minWidth: 140,
      },
      {
        headerName: this.translate.instant('labels.View'),
        field: 'ViewAttachment',
        cellRenderer: (params: any) => {
          if (this.hasAttachment(params.data)) {
            return `<a href="javascript:void(0);" data-action="download" style="cursor: pointer;">View</a>`;
          }
          return '';
        },
        onCellClicked: (params: any) => {
          if (params.event?.target?.tagName === 'A') {
            params.event.preventDefault();
            this.downloadGridAttachment(params.data);
          }
        },
        maxWidth: 80,
        sortable: false,
        filter: false,
      },
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound');
  }
  async NetAmount(fiscalYearId: number): Promise<void> {
    const empId = Number(this.LoginEmpId || 0);
    const companyId = String(this.LoginCompanyId || '');
    const claimstatus = this.claimStatus || 'P';
    const url = `MedicalReimbursement/GetEmployeeNetAmount/${empId}/${companyId}/${fiscalYearId}/${claimstatus}`;
    try {
      const data = await firstValueFrom(this._userService.get<any>(url));
      if (data?.employeeNetAmount?.length > 0) {
        const item = data.employeeNetAmount[0];
        this.Amount = item.Amount;
        this.AmountText = item.AmountText;
      }
    } catch (error) {
      console.error('Error fetching Net Amount:', error);
    }
  }
  onSelectClick(event: any): void {
    if (!event.node.isSelected()) {
      return;
    }
    const selectedDependentData = event.node.data;
    if (!selectedDependentData?.EMPDPDID && selectedDependentData.EMPDPDID !== 0) {
      return;
    }
    const dpdId = Number(selectedDependentData.EMPDPDID);
    const fyId = this.FiscalYear?.ID;
    const empId = this.LoginEmpId;
    const companyId = this.LoginCompanyId;
    const claimStatus = this.claimStatus;
    const culture = this.culture;
    if (!fyId || !empId || !companyId || Number.isNaN(dpdId)) {
      console.warn('Missing required IDs for refresh:', { fyId, empId, companyId, dpdId });
      return;
    }
    this.selectedDpdId = dpdId;
    if (!this.FiscalYear?.ID || !this.LoginEmpId || !this.LoginCompanyId) {
      console.warn('Missing required IDs for refresh.');
      return;
    }

    this.medicalService
      .refreshPageData(
        this.LoginEmpId,
        this.LoginCompanyId,
        this.FiscalYear.ID,
        dpdId,
        this.claimStatus,
        this.culture
      )
      .subscribe({
        next: () => {
          console.log('Dependent data refreshed successfully for DPD:', dpdId);
        },
        error: (err) => {
          console.error('Refresh failed after row click:', err);
        },
      });
  }
  onGridRowSelected(event: any): void {
    if (!event.node.isSelected()) {
      return;
    }
    const selectedRowData = event.node.data;
    if (!selectedRowData?.EMPID) return;

    const empId = selectedRowData.EMPID;
    const recordId = selectedRowData.MEDID;
    if (!empId || recordId == null) {
      return;
    }
    this.isSaveDisabled = true;
    this.medicalService.getRecordForEdit(empId, recordId).subscribe({
      next: (recordData: any) => {
        if (recordData && recordData.MEDID > 0) {
          this.populateForm(recordData);
          console.log('populate:', recordData);
          this.showHrFields = true;
        } else {
          this.isSaveDisabled = false;
        }
      },
      error: (err: any) => {
        console.error('Error fetching record for edit:', err);
        this.isSaveDisabled = false;
      },
    });
  }
  validateForm(): boolean {
    this.isMedicalExpenseDateInvalid = false;
    this.isMedicalCategoryInvalid = false;
    this.isTotalClaimInvalid = false;
    this.isCurrencyInvalid = false;
    this.hasAttemptedSave = true;
    this.TopRightValidationMsg = '';

    const claim = this.MedicalClaimTransaction;
    const expenseDateValue = this.medicalExpenseDateObj;
    const admissionDateValue = this.admissionDateObj;
    const dischargeDateValue = this.dischargeDateObj;

    let mandatoryError = false;

    const parseAmount = (val: any): number => {
      if (val == null || val === '') return NaN;
      if (typeof val === 'number') return val;
      return Number(String(val).replace(/,/g, '').trim());
    };

    if (!expenseDateValue) {
      this.isMedicalExpenseDateInvalid = true;
      mandatoryError = true;
    }

    const naCategory = this.empMedicalTypes.find((t) => t.NAME?.trim().toUpperCase() === 'N/A');
    const naCategoryId = naCategory?.ID ?? 0;
    const invalidCategoryId = 0;

    if (
      !claim.medicalCategoryId ||
      claim.medicalCategoryId === invalidCategoryId ||
      claim.medicalCategoryId === naCategoryId
    ) {
      this.isMedicalCategoryInvalid = true;
      mandatoryError = true;
    }
    const amount = parseAmount(claim.totalClaim);
    if (Number.isNaN(amount) || amount <= 0) {
      this.isTotalClaimInvalid = true;
      mandatoryError = true;
    }
    if (mandatoryError) {
      this.TopRightValidationMsg = 'Please enter mandatory fields.';
      this.scrollToError();
      this.cdRef.detectChanges();
      return false;
    }

    const expenseDate = expenseDateValue;
    const fy = this.getSelectedFiscalRange();

    if (!expenseDate) {
      this.isMedicalExpenseDateInvalid = true;
      this.TopRightValidationMsg = 'Invalid Date of Medical Expense detected.';
      return false;
    }

    if (fy && (expenseDate < fy.start || expenseDate > fy.end)) {
      this.isMedicalExpenseDateInvalid = true;
      this.TopRightValidationMsg =
        'Record cannot be saved as the Claim Date either does not fall in the selected fiscal year or the selected fiscal year is closed.';
      return false;
    }

    if (amount <= 0) {
      this.isTotalClaimInvalid = true;
      this.TopRightValidationMsg = 'Claim Amount must be greater than zero.';
      return false;
    }

    const admissionDate = this.admissionDateObj;
    const dischargeDate = this.dischargeDateObj;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (admissionDate && expenseDate && admissionDate > expenseDate) {
      this.TopRightValidationMsg = `'Date of Medical Expense' cannot be before the 'Date of Admission'.`;
      return false;
    }

    if (admissionDate && dischargeDate && admissionDate > dischargeDate) {
      this.TopRightValidationMsg = `'Date of Discharge' must be on or after the 'Date of Admission'.`;
      return false;
    }

    if (admissionDate && admissionDate >= now) {
      this.TopRightValidationMsg = 'Date of Admission must be in the past before the current date.';
      return false;
    }

    if (dischargeDate && dischargeDate > new Date()) {
      this.TopRightValidationMsg = 'Date of Discharge cannot be greater than the current date.';
      return false;
    }

    let lessDisallowedAmount = 0;
    const disallowedParsed = parseAmount(claim.lessDisallowedAmount);

    if (!Number.isNaN(disallowedParsed) && disallowedParsed >= 0) {
      lessDisallowedAmount = disallowedParsed;
    }

    if (lessDisallowedAmount > amount) {
      this.TopRightValidationMsg = "'Disallowed Amount' cannot be greater than 'Claim Amount'.";
      return false;
    }

    this.TopRightValidationMsg = '';
    return true;
  }
  onfiscalYearchange() {
    this.triggerRefresh();
  }
  onclaimStatuschange(newStatus: 'P' | 'A' | 'N') {
    this.claimStatus = newStatus;
    this.triggerRefresh();
    this.resetMedicalForm();
  }
  onMedicalExpenseDateChange(newDate: Date | null): void {
    this.touched.expenseDate = true;
    this.isMedicalExpenseDateInvalid = false;
    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      const saveFormat = 'yyyy-MM-dd';
      const formattedDateString = this.datePipe.transform(newDate, saveFormat);

      this.MedicalClaimTransaction.medicalExpenseDate = formattedDateString || '';
      this.expenseDateWasEverValid = true;

      if (this.TopRightValidationMsg === 'Please enter mandatory fields.') {
        this.TopRightValidationMsg = '';
      }
    } else {
      this.MedicalClaimTransaction.medicalExpenseDate = '';
      this.isMedicalExpenseDateInvalid = this.hasAttemptedSave;
    }
  }
  onAdmissionDateChange(newDate: Date | null): void {
    this.touched.admissionDate = true;

    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      const saveFormat = 'yyyy-MM-dd';
      const getValue = this.datePipe.transform(newDate, saveFormat);
      this.MedicalClaimTransaction.admissionDate = getValue || '';
      this.calculateAdmissionDuration(getValue, null);
    } else {
      this.MedicalClaimTransaction.admissionDate = '';
      this.calculateAdmissionDuration('', null);
    }
  }

  onDischargeDateChange(newDate: Date | null): void {
    this.touched.dischargeDate = true;
    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      const saveFormat = 'yyyy-MM-dd';
      const getValue = this.datePipe.transform(newDate, saveFormat);
      this.MedicalClaimTransaction.dischargeDate = getValue || '';
      this.calculateAdmissionDuration(null, getValue);
    } else {
      this.MedicalClaimTransaction.dischargeDate = '';
      this.calculateAdmissionDuration(null, '');
    }
  }
  calculateAdmissionDuration(
    admissionDateStr?: string | null,
    dischargeDateStr?: string | null
  ): void {
    const startDateStr = admissionDateStr ?? this.MedicalClaimTransaction.admissionDate;
    const endDateStr = dischargeDateStr ?? this.MedicalClaimTransaction.dischargeDate;

    if (!startDateStr || !endDateStr) {
      this.MedicalClaimTransaction.admissionDuration = '';
      return;
    }
    try {
      const startTime = Date.parse(startDateStr);
      const endTime = Date.parse(endDateStr);

      if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
        this.MedicalClaimTransaction.admissionDuration = '';
        return;
      }

      if (endTime < startTime) {
        this.MedicalClaimTransaction.admissionDuration = '0';
        return;
      }
      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const timeDifference = endTime - startTime;
      const dayDifference = Math.round(timeDifference / millisecondsPerDay) + 1;

      this.MedicalClaimTransaction.admissionDuration = (
        dayDifference < 1 ? 1 : dayDifference
      ).toString();
    } catch (e) {
      console.error('Error calculating duration:', e);
      this.MedicalClaimTransaction.admissionDuration = '';
    }
  }
  onCategoryChange(): void {
    this.touched.category = true;
    const selectedId = this.MedicalClaimTransaction?.medicalCategoryId;
    const invalidCategoryId = 0;
    const isValid = selectedId != null && selectedId !== invalidCategoryId;

    if (isValid) {
      this.isMedicalCategoryInvalid = false;
      this.categoryWasEverValid = true;
      if (this.TopRightValidationMsg === 'Please enter mandatory fields.') {
        this.TopRightValidationMsg = '';
      }
    } else {
      if (this.hasAttemptedSave) {
        this.isMedicalCategoryInvalid = true;
      }
    }
  }
  onAmountInput(): void {
    this.touched.totalClaim = true;
    const raw = this.MedicalClaimTransaction?.totalClaim;
    const valueAsString = raw != null ? String(raw).trim() : '';

    const numericValue = valueAsString !== '' ? Number(valueAsString.replace(/,/g, '')) : NaN;
    const isValid = valueAsString !== '' && !Number.isNaN(numericValue);

    if (isValid) {
      this.isTotalClaimInvalid = false;
      this.amountWasEverValid = true;

      if (this.TopRightValidationMsg === 'Please enter mandatory fields.') {
        this.TopRightValidationMsg = '';
      }
    } else {
      this.isTotalClaimInvalid = this.hasAttemptedSave;
    }
  }
  onCurrencyChange() {
    this.isCurrencyInvalid = false;
    if (this.TopRightValidationMsg === 'Exchange rate not found for the selected currency.') {
      this.TopRightValidationMsg = '';
    }
  }

  dummyRequest = (item: NzUploadXHRArgs): Subscription => {
    const file: NzUploadFile | undefined = item.file;

    if (!file) {
      const errorPayload = { message: 'File is undefined' };
      item.onError?.(errorPayload, item.file as NzUploadFile);

      return new Subscription();
    }

    setTimeout(() => {
      item.onSuccess?.({}, file, null);
    }, 0);

    return new Subscription();
  };
  handleNzFileUpload(event: NzUploadChangeParam): void {
    this.nzFileList = [...event.fileList];
    this.zone.run(() => {
      if (event.file.status === 'done') {
        const uploadedFile: File | undefined =
          event.fileList.length > 0 ? (event.fileList[0].originFileObj as File) : undefined;

        if (!uploadedFile) {
          this.removeFile(event.file);
          return;
        }

        const MAX_SIZE = 2 * 1024 * 1024;
        this.fileSizeError = null;

        if (uploadedFile.size > MAX_SIZE) {
          this.fileSizeError = 'Error: File attachment must be less than 2MB.';
          this.removeFile(event.file);
          return;
        }

        this.MedicalClaimTransaction.hasAttachment = false;
        this.selectedFile = uploadedFile;
        this.attachmentUrl = null;
      } else if (event.file.status === 'removed') {
      } else if (event.file.status === 'error') {
        this.fileSizeError = 'File upload failed.';
        this.removeFile(event.file);
      }
    });
  }
  removeFile = (file: NzUploadFile): boolean => {
    this.selectedFile = null;
    this.nzFileList = [];
    this.fileSizeError = null;

    this.MedicalClaimTransaction.hasAttachment = false;
    this.MedicalClaimTransaction.fileExtension = '';

    if (this.fileUploader?.nativeElement) {
      (this.fileUploader.nativeElement as HTMLInputElement).value = '';
    }

    return true;
  };
  resetFileState(): void {
    this.selectedFile = null;
    this.nzFileList = [];
    this.fileSizeError = null;
    this.MedicalClaimTransaction.hasAttachment = false;
    this.MedicalClaimTransaction.fileExtension = '';

    if (this.fileUploader?.nativeElement) {
      (this.fileUploader.nativeElement as HTMLInputElement).value = '';
    }
  }
  handleDownload = (file: NzUploadFile): void => {
    if (file.originFileObj) {
      const blob = file.originFileObj;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      this.downloadAttachment();
    }
  };
  populateForm(setup: any): void {
    this.TopRightValidationMsg = '';
    this.hasAttemptedSave = false;
    this.isMedicalExpenseDateInvalid = false;
    this.isMedicalCategoryInvalid = false;
    this.isTotalClaimInvalid = false;
    this.expenseDateWasEverValid = false;
    this.categoryWasEverValid = false;
    this.amountWasEverValid = false;

    this.touched = {
      expenseDate: false,
      admissionDate: false,
      dischargeDate: false,
      category: false,
      totalClaim: false,
    };
    this.MedicalClaimTransaction = {
      recordId: setup?.MEDID,
      dateOfEntry: setup?.DateOfEntry,
      invoiceNumber: setup?.VOUCHERNO,
      dependentId: Number(setup?.DPDID ?? 0),
      medicalExpenseDate: '',
      totalClaim: setup?.TOTALCLAIM,
      currencyId: setup?.CURRENCYID,
      comments: setup?.COMMENTS,
      hospitalId: setup?.HOSID,
      procedureDone: setup?.PRCDONE,
      doctorName: setup?.DOCTORNAME,
      wardNumber: setup?.WARDNO,
      admissionDate: '',
      dischargeDate: '',
      admissionDuration: setup?.ADMDURATION,
      admissionMode: setup?.ADMMODE,
      admissionReason: setup?.ADMREASON,
      prescribedMedicines: setup?.MEDICINEPRESCRIBE,
      hasAttachment: setup?.HasAttachment,
      fileExtension: setup?.Extention,
      SubMedTypeId: setup?.SUBMEDTYPEID,
      // --- HR Fields ---
      claimAmountHR: setup?.TOTALCLAIM,
      currencyname: setup?.CurrencyName,
      lessDisallowedAmount: setup?.LESSDISALLOWED,
      netAmount: setup?.AMOUNT,
      paid: setup?.PAID ? 'Yes' : 'No',
      chequeNumber: setup?.ChequeNumber,
      chequeDate: '',
      disallowedReason: setup?.DisallowedReason,
      bankName: setup?.BankName,
      branchName: setup?.BranchName,
      bankId: setup?.bnkid,
      branchId: setup?.bnkbrnid,
      medicalCategoryId: 0,
    };

    const invalidCategoryId = 0;
    if (setup?.MEDTYPEID && setup.MEDTYPEID !== invalidCategoryId) {
      this.categoryWasEverValid = true;
    }
    const loadedAmount = Number(setup?.TOTALCLAIM);

    if (!Number.isNaN(loadedAmount) && loadedAmount > 0) {
      this.amountWasEverValid = true;
    }
    this.FiscalYear.ID = setup?.FiscalYearID;
    this.selectedDpdId = Number(setup?.DPDID ?? 0);
    this.loadEmployeeMedicalEntAndSetDates(setup);
  }
  async loadEmployeeMedicalEntAndSetDates(setup: any): Promise<void> {
    try {
      await this.loadEmployeeMedicalEnt(false);
    } catch (error) {
      console.error('Error loading entitlements:', error);
    } finally {
      this.MedicalClaimTransaction.medicalCategoryId = setup?.MEDTYPEID;

      const displayFormat = 'dd-MM-yyyy';
      const saveFormat = 'yyyy-MM-dd';

      const safeParseDate = (dateString: string | null | undefined): Date | null => {
        if (!dateString) return null;
        try {
          const dateObj = new Date(dateString);
          return isNaN(dateObj.getTime()) ? null : dateObj;
        } catch {
          return null;
        }
      };

      const expenseDateObj = safeParseDate(setup?.MDATE);
      this.medicalExpenseDateObj = expenseDateObj;

      this.MedicalClaimTransaction.medicalExpenseDate = expenseDateObj
        ? this.datePipe.transform(expenseDateObj, 'yyyy-MM-dd') || ''
        : '';

      const admissionDateObj = safeParseDate(setup?.AdmissionDate);
      this.admissionDateObj = admissionDateObj;
      this.MedicalClaimTransaction.admissionDate = admissionDateObj
        ? this.datePipe.transform(admissionDateObj, 'yyyy-MM-dd') || ''
        : '';

      const dischargeDateObj = safeParseDate(setup?.DischargeDate);
      this.dischargeDateObj = dischargeDateObj;
      this.MedicalClaimTransaction.dischargeDate = dischargeDateObj
        ? this.datePipe.transform(dischargeDateObj, 'yyyy-MM-dd') || ''
        : '';

      if (expenseDateObj) {
        const expense = expenseDateObj;
        const fy = this.getSelectedFiscalRange();

        if (expense && fy && expense >= fy.start && expense <= fy.end) {
          this.expenseDateWasEverValid = true;
        }
      }
      this.cdRef.detectChanges();
    }
  }
  async saveClaim(): Promise<void> {
    if (!this.validateForm()) {
      this.scrollToError();
      return;
    }

    const toBase64 = (f: File): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const buf = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(buf);
          let bin = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            bin += String.fromCharCode(bytes[i]);
          }
          resolve(btoa(bin));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(f);
      });
    const claim = this.MedicalClaimTransaction;
    const id = Number(this.MedicalClaimTransaction.recordId);
    const totalClaim = Number(claim.totalClaim || 0);
    const disallowed = Number(claim.lessDisallowedAmount || 0);
    const saveFormat = 'yyyy-MM-dd';

    const MedicalExpenseDate = this.medicalExpenseDateObj
      ? this.datePipe.transform(this.medicalExpenseDateObj, saveFormat)
      : this.MedicalClaimTransaction.medicalExpenseDate || null; // Fallback for loaded value

    const admissionDate = this.admissionDateObj
      ? this.datePipe.transform(this.admissionDateObj, saveFormat)
      : this.MedicalClaimTransaction.admissionDate || null;

    const dischargeDate = this.dischargeDateObj
      ? this.datePipe.transform(this.dischargeDateObj, saveFormat)
      : this.MedicalClaimTransaction.dischargeDate || null;

    const payload: any = {
      MEDID: id,
      EMPID: Number(this._UtilitiesService.GetEmpid()) || null,
      MEDTYPEID: claim.medicalCategoryId || null,
      HOSID: claim.hospitalId || null,
      DPDID: claim.dependentId != null ? String(claim.dependentId) : null,
      MDATE: MedicalExpenseDate,
      AdmissionDate: admissionDate,
      DischargeDate: dischargeDate,
      VOUCHERNO: claim.invoiceNumber || null,
      WARDNO: claim.wardNumber || null,
      DOCTORNAME: claim.doctorName || null,
      ADMREASON: claim.admissionReason || null,
      ADMMODE: claim.admissionMode || null,
      PRCDONE: !!claim.procedureDone,
      ADMDURATION: claim.admissionDuration || null,
      MEDICINEPRESCRIBE: claim.prescribedMedicines || null,
      SUBMEDTYPEID: claim.SubMedTypeId ?? 0,
      TOTALCLAIM: claim.totalClaim,
      LESSDISALLOWED: claim.lessDisallowedAmount,
      AMOUNT: claim.totalClaim - claim.lessDisallowedAmount,
      CURRENCYID: claim.currencyId || null,
      CONVERSIONRATE: this.conversionRate || null,
      PAID: claim.paid === 'Yes' ? true : claim.paid === 'No' ? false : null,
      ChequeNumber: claim.chequeNumber || null,
      ChequeDate: claim.chequeDate || null,
      bnkid: claim.bankId || null,
      bnkbrnid: claim.branchId || null,
      COMMENTS: claim.comments || null,
      DisallowedReason: claim.disallowedReason || null,
      FiscalYearID: this.FiscalYear.ID,
      DocumentBody: null,
      Extention: null,
    };

    try {
      if (this.selectedFile) {
        payload.DocumentBody = await toBase64(this.selectedFile);
        const dotIndex = this.selectedFile.name.lastIndexOf('.');
        payload.Extention = dotIndex >= 0 ? this.selectedFile.name.substring(dotIndex) : null;
      } else if (claim.fileExtension && claim.hasAttachment) {
        payload.Extention = claim.fileExtension;
      }
    } catch (e) {
      this.TopRightValidationMsg = 'Could not read the attachment file.';
      this.scrollToError();
      return;
    }
    this._userService.post('MedicalReimbursement/InsertEmpMedical', payload).subscribe({
      next: (res: any) => {
        const isValid = (res?.isValid ?? res?.IsValid) === true;
        const message = res?.message ?? res?.Message;
        const displayMsg = message ? message : isValid ? 'Saved successfully' : 'Failed to save';

        if (isValid) {
          this.TopRightValidationMsg = '';
          this.selectedFile = null;
          if (this.MedicalClaimTransaction) {
            this.MedicalClaimTransaction.hasAttachment = false;
            this.MedicalClaimTransaction.fileExtension = '';
          }

          // Clear File Input safely
          if (this.fileUploader?.nativeElement) {
            (this.fileUploader.nativeElement as HTMLInputElement).value = '';
          }

          this.resetMedicalForm();
          this.triggerRefresh();
        } else {
          const apiMsgLower = displayMsg.toLowerCase();

          if (apiMsgLower.includes('exchange rate')) {
            this.TopRightValidationMsg = 'Exchange rate for the selected currency is not defined.';
            this.isCurrencyInvalid = true;
          } else if (apiMsgLower.includes('limit exceeds')) {
            this.TopRightValidationMsg =
              'Medical Reimbursement Claim Amount should be lesser than the Limit Amount.';
            this.isTotalClaimInvalid = true;
          } else if (apiMsgLower.includes('over age') || apiMsgLower.includes('expired')) {
            this.TopRightValidationMsg = displayMsg;
          } else {
            this.TopRightValidationMsg = displayMsg;
          }
          this.scrollToError();
        }
      },
      error: (err: any) => {
        const errorMsg =
          err.error?.message ||
          err.error?.Message ||
          err.message ||
          'An unknown error occurred while saving.';
      },
    });
  }

  scrollToError(): void {
    setTimeout(() => {
      const errorElement = document.getElementById('validationMessage');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
  triggerRefresh(): void {
    this.medicalService
      .refreshPageData(
        this.LoginEmpId,
        this.LoginCompanyId,
        this.FiscalYear.ID,
        this.selectedDpdId,
        this.claimStatus,
        this.culture
      )
      .subscribe({
        next: () => {},
        error: (err) => {},
      });
  }
  private getSelectedFiscalRange(): { start: Date; end: Date } | null {
    const fy = this.fiscalYearBy?.find((f: any) => f.ID === this.FiscalYear?.ID);
    if (!fy?.Name) return null;
    const [startStr, endStr] = fy.Name.split(/\s*-\s*/);
    if (!startStr || !endStr) return null;
    const start = this.parseHumanDate(startStr);
    const end = this.parseHumanDate(endStr);

    if (!start || !end) return null;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private parsePickerDateFiscal(input: string | null | undefined): Date | null {
    if (!input) return null;
    const s = String(input).trim().replace(/\//g, '-');
    const parts = s.split('-');
    if (parts.length !== 3) return null;

    if (parts[0].length === 4) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      const dt = new Date(y, m - 1, d);
      return isNaN(dt.getTime()) ? null : dt;
    }

    const dd = Number(parts[0]);
    const mm = parts[1];
    const yyyy = Number(parts[2]);

    const monthFrom = (token: string): number | null => {
      if (/^\d+$/.test(token)) {
        const m = Number(token);
        return m >= 1 && m <= 12 ? m - 1 : null;
      }
      const map: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const key = token.toLowerCase().slice(0, 3);
      return key in map ? map[key] : null;
    };

    const monthIdx = monthFrom(mm);
    if (monthIdx == null) return null;

    const dt = new Date(yyyy, monthIdx, dd);
    return isNaN(dt.getTime()) ? null : dt;
  }

  private parseHumanDate(s: string): Date | null {
    return this.parsePickerDateFiscal(s);
  }
  hasAttachment(row: MedicalTypeSetup): boolean {
    if (!row.Extention) {
      return false;
    }
    const ext = String(row.Extention).trim().toLowerCase();
    if (ext.length === 0 || ext === 'null') {
      return false;
    }
    if (ext === '.doc') {
      return false;
    }
    return true;
  }

  cleanExtension(extension: any): string {
    if (!extension) return '';
    let ext = String(extension).trim().toLowerCase();
    if (ext.startsWith('.')) {
      ext = ext.substring(1);
    }
    const parts = ext.split('.');
    let realExt = parts[parts.length - 1];
    return '.' + realExt;
  }
  downloadGridAttachment(row: MedicalTypeSetup): void {
    debugger;
    if (!row || row.MEDID == null || row.MEDID <= 0) {
      console.log('Cannot download file: Invalid record ID.');
      alert('Cannot download file: Invalid record ID.'); // V7 style alert
      return;
    }
    const url = `MedicalReimbursement/GetDocument/${row.MEDID}`;
    const cleanExt = this.cleanExtension(row.Extention) || '.dat';
    const fileName = `MedicalDocument_${row.MEDID}${cleanExt}`;

    this._dataService.downloadFileXHR(url, fileName).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          console.log('Blob received:', blob.type, blob.size);
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');

          link.href = downloadUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
        } else {
          console.log('Failed to download file: Empty response from server.');
        }
      },
      error: (err: any) => {
        console.error('Download error:', err);
        const message =
          err.response || err.statusText || err.message || 'Could not download the file.';
        console.log(`Download Failed: ${message}`);
      },
    });
  }

  downloadAttachment() {
    if (this.MedicalClaimTransaction && this.MedicalClaimTransaction.recordId > 0) {
      const recordId = this.MedicalClaimTransaction.recordId;
      const url = `MedicalReimbursement/GetDocument/${recordId}`;
      let fileExtension = this.MedicalClaimTransaction.fileExtension || '.dat';
      if (fileExtension && !fileExtension.startsWith('.')) {
        fileExtension = '.' + fileExtension;
      }
      const fileName = `MedicalDocument_${recordId}${fileExtension}`;
      this._dataService.downloadFileXHR(url, fileName).subscribe({
        next: (blob: Blob) => {
          if (blob && blob.size > 0) {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
          } else {
            console.error('Received invalid blob from XHR observable for form attachment');
          }
        },
        error: (err) => {
          const message = err.response || err.statusText || 'Could not download the file.';
          alert(`Download Failed: ${message} (Status: ${err.status})`);
        },
      });
    } else {
      alert('Cannot download file: Invalid record ID or transaction data.');
    }
  }

  reloadPage(): void {
    window.location.reload();
  }
  resetMedicalForm(): void {
    this.MedicalClaimTransaction = new MedicalClaimTransaction();
    //this.ResetDatePickers();
    this.medicalExpenseDateObj = null;
    this.admissionDateObj = null;
    this.dischargeDateObj = null;
    this.loadEmployeeMedicalEnt(true);
    const defaultHospital = this.Hospitals.find((h) => h.NAME.trim().toUpperCase() === 'N/A');
    this.MedicalClaimTransaction.hospitalId = defaultHospital ? defaultHospital.HOSID : 0;
    this.isSaveDisabled = false;
    this.showHrFields = false;
    this.selectedFile = null;
    this.nzFileList = [];
    this.MedicalClaimTransaction.fileExtension = '';
    this.fileSizeError = null;
    if (this.fileUploader && this.fileUploader.nativeElement) {
      (this.fileUploader.nativeElement as HTMLInputElement).value = '';
    }
    this.hasAttemptedSave = false;
    this.expenseDateWasEverValid = false;
    this.categoryWasEverValid = false;
    this.amountWasEverValid = false;
    this.isMedicalExpenseDateInvalid = false;
    this.isMedicalCategoryInvalid = false;
    this.isTotalClaimInvalid = false;
    this.TopRightValidationMsg = '';
    this.touched = {
      expenseDate: false,
      admissionDate: false,
      dischargeDate: false,
      category: false,
      totalClaim: false,
    };
  }
}
export class medicalReimbursement {
  EmployeeName: string = '';
  Designation: string = '';
}
export class FiscalYear {
  ID: number = 0;
  Name: string = '';
}
export class Dependent {
  EMPDPDID: number = 0;
  NAME: string = '';
}
export class MedicalInfoRow {
  MId: number = 0;
  Prorate: boolean = false;
  MTypeId: number = 0;
  MonthlyAccumulated: number = 0;
  AvailableMonthlyLimit: number = 0;
  MedicalAmountScope: boolean = false;
  prorateAmount: number = 0;
  MedicalName: string = '';
  Amount: number = 0;
  Pendingforapproval: number = 0;
}
export class Currency {
  SDLID: number = 0;
  Code: string = '';
  CURRENCY: string = '';
}
export class HospitalSetup {
  HOSID: number = 0;
  NAME: string = '';
}
export class MedicalClaimTransaction {
  recordId: number;
  dateOfEntry: string = '';
  invoiceNumber: string = '';
  dependentId: number = 0;
  medicalExpenseDate: string = '';
  medicalCategoryId: number = 0;
  totalClaim: number = 0;
  currencyId: number = 3045;
  comments: string = '';
  hospitalId: number = -1;
  procedureDone: boolean = false;
  doctorName: string = '';
  wardNumber: string = '';
  admissionDate: string = '';
  dischargeDate: string = '';
  admissionDuration: string = '';
  admissionMode: string = '';
  admissionReason: string = '';
  prescribedMedicines: string = '';
  hasAttachment: boolean = false;
  fileExtension: string = '';
  SubMedTypeId: number = 0;
  // HR Department Fields
  claimAmountHR: string = '';
  currencyname: string = '';
  lessDisallowedAmount: number = 0;
  netAmount: number = 0;
  paid: string = '';
  chequeNumber: string = '';
  chequeDate: string = '';
  disallowedReason: string = '';
  bankName: string = '';
  branchName: string = '';
  bankId: number = 0;
  branchId: number = 0;
  constructor() {
    this.recordId = 0;
    this.dateOfEntry = new Date()
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '/');
    this.dependentId = 0;
    this.medicalCategoryId = 0;
    this.currencyId = 3045;
    this.hospitalId = -1;
    this.procedureDone = false;
    this.hasAttachment = false;
    this.paid = '';
    this.invoiceNumber = '';
    this.medicalExpenseDate = '';
    this.totalClaim = 0;
    this.comments = '';
    this.doctorName = '';
    this.wardNumber = '';
    this.admissionDate = '';
    this.dischargeDate = '';
    this.admissionDuration = '';
    this.admissionMode = '';
    this.admissionReason = '';
    this.prescribedMedicines = '';
    this.fileExtension = '';
    this.claimAmountHR = '';
    this.currencyname = '';
    this.lessDisallowedAmount = 0;
    this.netAmount = 0;
    this.chequeNumber = '';
    this.chequeDate = '';
    this.disallowedReason = '';
    this.bankName = '';
    this.branchName = '';
    this.bankId = 0;
    this.branchId = 0;
  }
}
export class MedicalTypeSetup {
  MEDID: number = 1;
  CurrencyCode: string = '';
  MedicalName: string = '';
  FiscalYearID: number = 0;
  SubMedicalName: string = '';
  SUBMEDTYPEID: number = 0;
  EMPID: string = '';
  MEDTYPEID: number = 0;
  HOSID: number = 0;
  Hospitalname: string = '';
  WARDNO: string = '';
  DOCTORNAME: string = '';
  ADMREASON: string = '';
  ADMMODE: string = '';
  PRCDONE: boolean = false;
  ADMDURATION: string = '';
  MEDICINEPRESCRIBE: string = '';
  VOUCHERNO: string = '';
  DocumentBody: any;
  Extention: any = null;
  DPDID: string = '';
  MDATE: string = '';
  AdmissionDate: string = '';
  DischargeDate: string = '';
  TOTALCLAIM: number = 0;
  LESSDISALLOWED: number = 0;
  AMOUNT: number = 0;
  CURRENCYID: number = 0;
  CurrencyRate: number = 0;
  PAID: boolean = false;
  COMMENTS: string = '';
  DpdRel: string = '';
  ChequeNumber: string = '';
  ChequeDate: string = '';
  bnkid: number = 0;
  BankName: string = '';
  CONVERSIONRATE: number = 0;
  Status: string = '';
  bnkbrnid: number = 0;
  BranchName: string = '';
  DisallowedReason: string = '';
  DateOfEntry: string = '';
  DpdName: string = '';
  CurrencyName: string = '';
}
export class DatePickerObj {
  SetValue: string = '';
  GetValue: string = '';
  IsValidDate: boolean = true;
  isInValidCondition: boolean = false;
  isDisabled: boolean = false;
  serverObj = { isError: false, msg: '' };
}
