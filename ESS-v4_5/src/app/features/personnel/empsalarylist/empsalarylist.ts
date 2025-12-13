import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '@app/core/services/data.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { TranslateService } from '@ngx-translate/core';
/*import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';*/
import { AgGridAngular } from 'ag-grid-angular'; 
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { finalize } from 'rxjs/operators';


//import { ViewChild, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
//import { Observable } from 'rxjs/Rx';
//import { Subject } from 'rxjs';

//import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
//import { DatePipe } from '@angular/common';

//import { Customizelabel, ManageLookup, ValidationResponse, CustomizeValidation, DatePickerComponent } from '../../../../shared';
//import { ChangeDetectorRef } from '@angular/core';
//import { isNullOrUndefined, debug } from 'util';
//import { AfterViewInit } from '@angular/core';
//import { HttpClient } from '@angular/common/http';
//import { Router } from '@angular/router';
//import { HttpParams } from '@angular/common/http';


@Component({
  selector: 'empsalarylist',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    NzSelectModule,
    /*SafeTranslatePipe,*/
    /*AgGridAngular*/],

  templateUrl: './empsalarylist.html',
  styleUrls: ['./empsalarylist.css']
})
export class Empsalarylist implements OnInit
{
    private translate = inject(TranslateService);
    private _userService = inject(DataService);
    private _UtilitiesService = inject(UtilitiesService);

  
 /* formId: 'employeesalarylist';*/
  constructor(
   
   
  ) { }


  //TemplateMasterby: Array<UserInfo> = new Array<UserInfo>();
  //TemplateMaster: any = {};

  //TemplateGrid: Array<TemplateGrid> = new Array<TemplateGrid>();
  //public TemplateGridColumnDefs: ColDef[] = [];

  //EmployeeFilterMaster: EmployeeSalary = new EmployeeSalary();
  //  divisionList: DropdownResult[] = [];

  //departmentList: DropdownResult[] = [];
  //subDepartmentList: DropdownResult[] = [];
  //locationList: DropdownResult[] = [];


  //// Selected Values (Single values for now, array if multiple)
  //  selectedDivision: string[] = [];
  //  selectedDepartment: string[] = [];
  //  selectedSubDepartment: string[] = [];

  //EmployeeJobInformationMaster: JobInformation = new JobInformation();
  //EmployeeResignationMaster: Resignation = new Resignation();
  //AdvanceSalaryFiltersMaster: AdvanceSalaryFilters = new AdvanceSalaryFilters();
  //PaymentModeChequePayeeMaster: ChequePayee = new ChequePayee();
  //BankTransferMaster: BankTransfer = new BankTransfer();
  //CompanyBankDetailsMaster: CompanyBankDetails = new CompanyBankDetails();
  //SalaryFilterMaster: SalaryFilter = new SalaryFilter();
  //DateFromSubject: any = null;
  //DateToSubject: any = null;
  //EmployeeSalary: salarygridModel = new salarygridModel();
  //EmployeeSalaryFilterGrid: Array<salarygridModel> = Array<salarygridModel>();
  //GroupByMaster: GroupBy = new GroupBy();
  //SortByMaster: SortBy = new SortBy();
  //EarningMaster: EarninggridModel = new EarninggridModel();
  //EarningGrid: Array<EarninggridModel> = Array<EarninggridModel>();
  //DeductionMaster: DeductiongridModel = new DeductiongridModel();
  //DeductionGrid: Array<DeductiongridModel> = Array<DeductiongridModel>();
  //TopRightValidationMsg: string = "";
  //FormID: string = "MainProbationEvaluation";
  ////showDates: boolean = false;
  ///*showEmployeefilterlist: boolean = false;*/
  ////showEmployeesalarylist: boolean = false;
  ///*showJobInfo: boolean = false;*/
  ///*resign: boolean = false;*/
  ///*advsalsetup: boolean = false;*/
  ///*advsalfilters: boolean = false;*/
  ///*datefilters: boolean = false;*/
  ///* entitlements: boolean = false;*/
  ///*exactMatch: boolean = false;*/
  ///*anyMatch: boolean = false;*/
  ///*paymentmode: boolean = false;*/
  ///* cheque: boolean = false;*/
  ///* sortby: boolean = false;*/
  ///*jobinformation: boolean = false;*/
  //chequePanelOpen: boolean = false;
  //chequeChecked: boolean = false;
  //cashChecked: boolean = false;
  //ReporterLevels: any;
  //ModelLevel: any = 0;
  //LoginEmpId: string = '';
  //LoginCompanyId: string = '';
  //culture: string = '';
  //SubordinatesList: any[] = [];
  //selectedTab: string = 'templatesandfilters';
  ////bankTransferEnabled: boolean = false;
  ////banktransferChecked: boolean = false;
  ////banktransferOpen: boolean = false;
  ////salaryfilters: boolean = false;
  ////groupby: boolean = false;
  ///* columnstobeshownonreport: boolean = false;*/
  ///*employeeinformation: boolean = false;*/
  ///*dates: boolean = false;*/
  ///*entitlements1: boolean = false;*/
  ///* salaryinfo: boolean = false;*/
  ///*resignation: boolean = false;*/
  //employeebankdetails: boolean = false;
  //addrupees: boolean = false;
  //topRightValidationMsg: string = '';
  //masterToggleentitlement: boolean = false;
  //masterToggleEmployee: boolean = false;
  //masterToggleJobInfo: boolean = false;
  //masterToggleDates: boolean = false;
  //masterToggleEntitlements: boolean = false;
  //masterToggleEntitlement: boolean = false;
  //masterToggleSalary: boolean = false;
  //masterTogglePayment: boolean = false;
  //masterToggleResignation: boolean = false;
  //earnings: boolean = false;
  //allControlsDisable: any = true;
  //mdlAPDateFrom = '';
  //mdlAPDateTo = '';
  //AutoPresentDateFrom = "";
  //AutoPresentDateTo = "";
  //autoPresentDateFromServerValidation = { isError: false, msg: "" }; autoPresentDateToServerValidation = { isError: false, msg: "" };

  //public defaultColDef: ColDef = {};
  //public noRowsOverlay: string = '';

    ngOnInit() {
        //        debugger
        //        /*this.LoginEmpId = this._UtilitiesService.GetEmpid() || '';*/
        //        this.LoginCompanyId = this._UtilitiesService.GetCompanyId() || '';
        //        this.culture = this._UtilitiesService.GetAppCurrentUICulture() || '';
        //        this.LoadDropDowns();
        //        this.loadDivision();
        //        this.loadDepartment();
        //        this.loadSubDepartment();
        //        this.setupTemplateGrid();

        //        this.EmployeeSalaryFilterGrid = [
        //            { salarycriteria: 'Basic Salary', operand: '=', amount: '50000', currency: 'PKR' },
        //            { salarycriteria: 'Bonus', operand: '>', amount: '10000', currency: 'USD' },
        //            { salarycriteria: 'Allowance', operand: '<', amount: '3000', currency: 'PKR' }
        //        ];
    }
//  //loadDivision() {
//  //  const companyId = this.LoginCompanyId;
//  //  if (!companyId) {
//  //    console.error("Initialization failed: Login Company ID is missing.");
//  //    return;
//  //  }
//  //  this._UtilitiesService.GetGeneralsetupsCompanywise(
//  //    companyId,
//  //    '70',
//  //    true,
//  //    true
//  //  ).subscribe({
//  //    next: (data: any) => {
//  //      console.log("division:", data);
//  //      this.divisionList = data;
//  //      console.log("Division list loaded successfully:", this.divisionList);
//  //    },
//  //    error: (error: any) => {
//  //      console.error("Error loading divisions (SMS 70):", error);
//  //          }
//  //  });
//  //}

//  //loadDepartment() {
//  //  const companyId = this.LoginCompanyId;
//  //  if (!companyId) {
//  //    console.error("Initialization failed: Login Company ID is missing.");
//  //    return;
//  //  }
//  //  this._UtilitiesService.GetGeneralsetupsCompanywise(
//  //    companyId,
//  //    '84',
//  //    true,
//  //    true
//  //  ).subscribe({
//  //    next: (data: any) => {
//  //      console.log("department", data);
//  //      this.departmentList = data;
       
//  //      console.log("Department list loaded successfully:", this.departmentList);

//  //    },
//  //    error: (error: any) => {
//  //      console.error("Error loading department (SMS 84):", error);
//  //    }
//  //  });
//  //}

//  //loadSubDepartment() {
//  //  const companyId = this.LoginCompanyId;
//  //  if (!companyId) {
//  //    console.error("Initialization failed: Login Company ID is missing.");
//  //    return;
//  //  }
   
//  //  this._UtilitiesService.GetGeneralsetupsCompanywise(
//  //    companyId,
//  //    '24',
//  //    true,
//  //    true
//  //  ).subscribe({
//  //    next: (data: any) => {
//  //      console.log("subdepartment", data);
//  //      this.subDepartmentList = data;
        
//  //      console.log("subDepartment list loaded successfully:", this.subDepartmentList);

//  //    },
//  //    error: (error: any) => {
//  //      console.error("Error loading subDepartment (SMS 24):", error);
       
//  //    }
//  //  });
//  //}

//  //loadlocation() {
//  //  const companyId = this.LoginCompanyId;
//  //  if (!companyId) {
//  //    console.error("Initialization failed: Login Company ID is missing.");
//  //    return;
//  //  }
   
//  //  this._UtilitiesService.GetGeneralsetupsCompanywise(
//  //    companyId,
//  //    '63',
//  //    true,
//  //    true
//  //  ).subscribe({
//  //    next: (data: any) => {
//  //      console.log("location", data);
//  //      this.locationList = data;
       
//  //      console.log("location list loaded successfully:", this.locationList);

//  //    },
//  //    error: (error: any) => {
//  //      console.error("Error loading locationl (SMS 63):", error);
       
//  //    }
//  //  });
//  //}

//  //fetchDropdownData(selectedId: string, secondId: string, controlName: string) {

//  //  // Safety check for null/undefined company ID
//  //  const companyIdStr = this.LoginCompanyId.toString() || '0';

//  //  // Route Construction (Corrected URL for Path Parameters)
//  //  // Matches C# route: api/EmployeeSalaryList/GetDropDownDetail/{selectedId}/{secondId}/{companyId}/{controlName}
//  //  const url = `api/EmployeeSalaryList/GetDropDownDetail/${selectedId}/${secondId || ''}/${companyIdStr}/${controlName}`;

//  //  return this._userService.get(url).pipe(
//  //    // Map the result to unwrap the { Result: [...] } structure
//  //    map((response: any) => response.Result || [])
//  //  );
//  //}

//  //public agGridApi: any;

//  //onGridReady(params: any) {
//  //  this.agGridApi = params.api;
//  //}

//  //setupTemplateGrid() {

//  //  this.defaultColDef = {
//  //    sortable: true,
//  //    filter: true,
//  //    resizable: true,
//  //    flex: 1,
//  //    tooltipValueGetter: (params:any) => params.value,
//  //  };

//  //  this.TemplateGridColumnDefs = [
//  //    {
//  //      headerName: this.translate.instant('labels.TemplateCode'),
//  //      field: 'TemplateCode',
//  //      filter: 'agTextColumnFilter', 

//  //    },
//  //    {
//  //      headerName: this.translate.instant('labels.TemplateDescription'),
//  //      field: 'TemplateDescription',
//  //      filter: 'agTextColumnFilter'
//  //    },
//  //    {
//  //      headerName: this.translate.instant('labels.CreatedBy'),
//  //      field: 'CreatedBy'
//  //    },
//  //    {
//  //      headerName: this.translate.instant('labels.CreatedOn'),
//  //      field: 'CreatedOn',

//  //    },
//  //    {
//  //      headerName: this.translate.instant('labels.CreatedOnShareTemplateWithOthers'),
//  //      field: 'CreatedOnShareTemplateWithOthers',        
//  //    }
//  //  ];

//  //  this.noRowsOverlay = this.translate.instant('labels.NoRowsFound');
//  //}

//  ////till here
//  //toggleAllJobInfo(value: boolean): void {
//  //  if (this.jobinformationList && this.jobinformationList.length) {
//  //    this.jobinformationList.forEach(item => item.checked = value);
//  //  }
//  //}

//  //toggleAllEmployeeInfo(value: boolean): void {
//  //  if (this.employeeinformationList && this.employeeinformationList.length) {
//  //    this.employeeinformationList.forEach(item => item.checked = value);
//  //  }
//  //}

//  //toggleAllDates(value: boolean): void {
//  //  if (this.DatesList && this.DatesList.length) {
//  //    this.DatesList.forEach(item => item.checked = value);
//  //  }
//  //}

//  //toggleAllEntitlement(value: boolean): void {
//  //  if (this.EntitlementList && this.EntitlementList.length) {
//  //    this.EntitlementList.forEach(item => (item.checked = value));
//  //  }

//  //}

//  //toggleAllSalaryInfo(value: boolean): void {
//  //  if (this.SalaryInfoList && this.SalaryInfoList.length) {
//  //    this.SalaryInfoList.forEach(item => item.checked = value);
//  //  }
//  //}

//  //toggleAllSalaryReviewInfo(value: boolean): void {
//  //  if (this.SalaryReviewInfoList && this.SalaryReviewInfoList.length) {
//  //    this.SalaryReviewInfoList.forEach(item => item.checked = value);
//  //  }
//  //}
//  //toggleAllEntitlements(value: boolean): void {
//  //  if (this.entitlementsList && this.entitlementsList.length) {
//  //    this.entitlementsList.forEach(item => item.checked = value);
//  //  }
//  //  if (this.entitlementsList1 && this.entitlementsList1.length) {
//  //    this.entitlementsList1.forEach(item => item.checked = value);
//  //  }
//  //  if (this.entitlementsList2 && this.entitlementsList2.length) {
//  //    this.entitlementsList2.forEach(item => item.checked = value);
//  //  }
//  //}

//  ////toggleAllPaymentMode(value: boolean): void {
//  ////  if (this.PaymentModeList && this.PaymentModeList.length) {
//  ////    this.PaymentModeList.forEach(item => item.checked = value);
//  ////  }
//  ////}

//  //toggleAllResignation(value: boolean): void {
//  //  if (this.ResignationList && this.ResignationList.length) {
//  //    this.ResignationList.forEach(item => item.checked = value);
//  //  }
//  //}

//  //entitlementsList = [
//  //  'Over Time Entitlement',
//  //  'Regularity Allowance',
//  //  'Night Shift Allowance',
//  //  'Dinner Allowance',
//  //  'Fuel Allowance',
//  //  'Punctuality Allowance',
//  //  'Provident Fund Member',
//  //  'Social Security Member',
//  //  'Union Member',
//  //  'Extra Compensation',
//  //  'CNG Allowance',
//  //  'Ex-Gratia Entitlement',
//  //  'Annual-Leave Fare Allowance (LFA)',
//  //  'Shift Allowance',
//  //  'Pension Member',
//  //  'Iftar Allowance',
//  //  'EOBI Member',
//  //  'Gratuity Member',
//  //  'Medical Entitlement',
//  //  'Sehri Allowance',
//  //  'Asset Allowance',



//  //].map((name, index) => ({
//  //  name,
//  //  id: 'ent-' + index,
//  //  checked: false
//  //}));

//  //entitlementsList1 = [

//  //  'Show employees with entitlements exactly matching the above selection',



//  //].map((name, index) => ({
//  //  name,
//  //  id: 'ent-' + index,
//  //  checked: false
//  //}));

//  //entitlementsList2 = [

//  //  'Show employees with entitlements matching with any of the above selection'


//  //].map((name, index) => ({
//  //  name,
//  //  id: 'ent-' + index,
//  //  checked: false
//  //}));
//  //employeeinformationList =
//  //  [
//  //    'Employee Code',
//  //    'Grade',
//  //    'Sub-Department',
//  //    'Employee Code Old',
//  //    'Payroll Group',
//  //    'Designation',
//  //    'Employee Title',
//  //    'Division',
//  //    'Region',
//  //    'Employee Name',
//  //    'Department',
//  //    'Location',
//  //  ].map((name, index) => ({
//  //    name,
//  //    id: 'emp-' + index,
//  //    checked: false
//  //  }));


//  //jobinformationList = [
//  //  'Direct Reporting To (Company)',
//  //  'Base Station (Country)',
//  //  'Profile Shift',
//  //  'Auto Present',
//  //  'Employee Category',
//  //  'Direct Reporting to (Employee)',
//  //  'Base Station City',
//  //  'Duty Group',
//  //  'Status for Payroll Approval',
//  //  'Employee Type',
//  //  'Indirect Reporting to (Company)',
//  //  'Current Station (Country)',
//  //  'Duties',
//  //  'Employee Company',
//  //  'Employee Status',
//  //  'Indirect Reporting to (Employee)',
//  //  'Current Station (City)',
//  //  'Team',
//  //  'Direct Reporting To',

//  //].map((name, index) => ({
//  //  name,
//  //  id: 'job-' + index,
//  //  checked: false
//  //}));

//  //DatesList = [
//  //  'Date of Birth',
//  //  'Date of Probation Extended',
//  //  'Date of Retirement',
//  //  'Date of Joining',
//  //  'Date of Last Promotion',
//  //  'Date of Internship Expiry',
//  //  'Date of Confirmation',
//  //  'Date of Last Increment',
//  //  'Date of Contract Expiry',
//  //  'Date of Confirmation Due',
//  //  'Date of Next Increment',
//  //].map((name, index) => ({
//  //  name,
//  //  id: 'dat-' + index,
//  //  checked: false
//  //}));

//  //EntitlementList = [
//  //  'Over Time Entitlement',
//  //  'Regularity Allowance',
//  //  'Night Shift Allowance',
//  //  'Dinner Allowance',
//  //  'Fuel Allowance',
//  //  'Punctuality Allowance',
//  //  'PF Member',
//  //  'Social Security Member',
//  //  'Union Member',
//  //  'Extra Compensation',
//  //  'CNG Allowance',
//  //  'Custom Entitlement',
//  //  'Ex-Gratia Entitlement',
//  //  'Annual-Leave Fare Allowance (LFA)',
//  //  'Shift Allowance',
//  //  'Pension Member',
//  //  'Iftar Allowance',
//  //  'EOBI Member',
//  //  'Gratuity Member',
//  //  'Medical Entitlement',
//  //  'Sehri Allowance',
//  //  'Asset Allowance',
//  //].map((name, index) => ({
//  //  name,
//  //  id: 'ent-' + index,
//  //  checked: false
//  //}));

//  //SalaryInfoList = [
//  //  'Gross Package',
//  //  'Gross Salary',
//  //  'Currency',
//  //  'Salary Processing Status',

//  //].map((name, index) => ({
//  //  name,
//  //  id: 'sal-' + index,
//  //  checked: false
//  //}));

//  //SalaryReviewInfoList = [
//  //  'Last Gross Salary',
//  //  '%age Changed',
//  //  'Current Gross Salary Changed',
//  //  'Amount Changed',


//  //].map((name, index) => ({
//  //  name,
//  //  id: 'salrevinfo-' + index,
//  //  checked: false
//  //}));

//  ////SalaryReviewList = [
//  ////  'Last Gross Salary',
//  ////  '%age Changed',    
//  ////  'Amount Changed',
//  ////  'Current Gross Salary Changed w.e.f',

//  ////].map((name, index) => ({
//  ////  name,
//  ////  id: 'salrev-' + index,
//  ////  checked: false
//  ////  }));

//  //PaymentModeList = [
//  //  'Cash',
//  //  'Employee Bank Code',
//  //  'Employee Account Title',
//  //  'Company Account No.',
//  //  'Cheque',
//  //  'Employee Bank',
//  //  'Employee Account No.',
//  //  'Bank Transfer',
//  //  'Employee Bank Branch Code',
//  //  'Company Bank',
//  //  'Payee',
//  //  'Employee Bank Branch',
//  //  'Company Bank Branch',

//  //].map((name, index) => ({
//  //  name,
//  //  id: 'pay-' + index,
//  //  checked: false
//  //}));

//  //ResignationList = [
//  //  'Exit Type',
//  //  'Resign Accepted (Employee)',
//  //  'Notice Period (Days)',
//  //  'Phone No. 1',
//  //  'Resignation Accepted Date',
//  //  'Exit Reason',
//  //  'Resign Accepted (Remarks)',
//  //  'Final Settlement Policy',
//  //  'Phone No. 2',
//  //  'Date of Resignations submitted',
//  //  'Exit Remarks',
//  //  'Post Exit Status',
//  //  'Address 1',

//  //  'HR Comments',
//  //  'Last working Dates',
//  //  'Resign Accepted (Company)',
//  //  'Sponsor Details',
//  //  'Address 2',
//  //  'Other Comments',

//  //].map((name, index) => ({
//  //  name,
//  //  id: 'res-' + index,
//  //  checked: false
//  //}));

//  //earningsList = [
//  //  { name: 'Basic Salary', checked: false },
//  //  { name: 'HOUSE RENT', checked: false },
//  //  { name: 'UTILITY', checked: false },
//  //  { name: 'MEDICAL ALLOWANCE', checked: false }
//  //];

//  //deductionsList = [
//  //  { name: 'N/A.', checked: false },
//  //  { name: 'CANTEEN CHARGES', checked: false },
//  //  { name: 'Roshan Mustakbil Fund', checked: false }
//  //];

//  //checkAllEarnings(checked: boolean) {
//  //  this.earningsList.forEach(item => item.checked = checked);
//  //}

//  //checkAllDeductions(checked: boolean) {
//  //  this.deductionsList.forEach(item => item.checked = checked);
//  //}

//  //checkAllColumns(state: boolean) {
//  //  this.employeeinformationList.forEach(item => item.checked = state);
//  //  this.jobinformationList.forEach(item => item.checked = state);
//  //  this.DatesList.forEach(item => item.checked = state);
//  //  this.EntitlementList.forEach(item => item.checked = state);
//  //  this.entitlementsList.forEach(item => item.checked = state);
//  //  this.entitlementsList1.forEach(item => item.checked = state);
//  //  this.SalaryInfoList.forEach(item => item.checked = state);
//  //  this.SalaryReviewInfoList.forEach(item => item.checked = state);
//  //  this.PaymentModeList.forEach(item => item.checked = state);
//  //  this.ResignationList.forEach(item => item.checked = state);

//  //}

//  ////SalaryTemplate: { id: number, text: string }[] = [
//  ////  { id: 0, text: "--Select--" },
//  ////  { id: 1, text: "Self" }

//  ////];

 

//  //Payroll:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Consultants (not on Payroll)" },
//  //    { id: 3, text: "Field Force" },
//  //    { id: 4, text: "HCMS Payroll Group" }
//  //  ];
 

//  //Designation:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Advisior" },
//  //    { id: 3, text: "Area Manager" },
//  //    { id: 4, text: "Assistant" }
//  //  ];

//  //Grade:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Contract" },
//  //    { id: 3, text: "Executive" },
//  //    { id: 4, text: "Contract Permanent" }
//  //  ];

//  //Location:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "All" },
//  //    //{ id: 1, text: "N/A" },
//  //    //{ id: 2, text: "Contract" },
//  //    //{ id: 3, text: "Executive" },
//  //    //{ id: 4, text: "Contract Permanent" }
//  //  ];

//  //EmployeeCategoary:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Contract" },
//  //    { id: 3, text: "Permanent" }
//  //  ];
//  //Region:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "All" },
//  //    //    { id: 1, text: "N/A" },
//  //    //    { id: 2, text: "North" },
//  //    //    { id: 3, text: "South" }
//  //  ];
//  //EmployeeType:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Confirmed" },
//  //    { id: 3, text: "Intern" },
//  //    { id: 3, text: "On Probation" },
//  //    { id: 3, text: "Management Trainee" }
//  //  ];

//  //Team:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "ATCO CLASSIC" },
//  //    { id: 3, text: "ATCO EFFECTIVE" },
//  //    { id: 3, text: "ATCO VIBRANT" },
//  //    { id: 3, text: "ATCO VISION" }
//  //  ];
//  //EmployeeStatus:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Active (Not Resigned)" },
//  //    { id: 3, text: "Active (Resigned but not Seperated)" }
//  //  ];
//  //DirectReporting:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Type here to filter list--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Abdul Qadir Khan (0000112545)" },
//  //    { id: 3, text: "Abdul Basit (513441)" }
//  //  ];
//  //BaseStationCountry:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Aruba" },
//  //    { id: 3, text: "Pakistan" },
//  //    { id: 4, text: "Afghanistan" },
//  //  ];

//  //CurrentStation: { id: number, text: string }[] = [
//  //  { id: 0, text: "--Select--" },
//  //  { id: 1, text: "N/A" },
//  //  { id: 2, text: "Australia" },
//  //  { id: 3, text: "Pakistan" },
//  //  { id: 4, text: "Afghanistan" },
//  //];
//  //ProfileShift:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "A [0800 - 1700] [0815Hours]" },
//  //    { id: 3, text: "B [0900 - 1800] [0815Hours]" },
//  //    { id: 4, text: "C [2300 - 0800] [0800Hours]" },
//  //  ];

//  //BaseStationCity:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Azad Kashmir" },
//  //    { id: 3, text: "Karachi" },
//  //    { id: 4, text: "Lahore" },
//  //  ];

//  //CurrentStationCity:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Azad Kashmir" },
//  //    { id: 3, text: "Karachi" },
//  //    { id: 4, text: "Lahore" },
//  //  ];
//  //DutyGroup:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "N/A" },
//  //    { id: 2, text: "Duty Group1" },
//  //  ];

//  //AutoPresent:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Only employees on Auto-Present" },
//  //    { id: 2, text: "Only employees not on Auto-Present" },
//  //  ];
//  //ResignationExitType:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Resign" },
//  //    { id: 2, text: "Demise" },
//  //    { id: 2, text: "Retire" },
//  //  ];

//  //ResignationExitReason:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Leaving Industry" },
//  //    { id: 2, text: "Accidental Death" },
//  //    { id: 2, text: "Asked to Resign" },
//  //  ];

//  //AdvanceSalary:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Yes" },
//  //    { id: 2, text: "No" },
//  //  ];
//  //EmployeeAppPay:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Approved" },
//  //    { id: 2, text: "Not Approved" },
//  //    { id: 3, text: "Sent for Review" },
//  //  ];

//  //BankDetail:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Silk Bank" },
//  //    { id: 2, text: "Standard Chartered Bank" },
//  //    { id: 3, text: "HBL Bank" },
//  //  ];
//  //BankBranch:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Silk Bank" },
//  //    { id: 2, text: "Standard Chartered Bank" },
//  //    { id: 3, text: "HBL Bank" },
//  //  ];
//  //CompanyBankDetail:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Silk Bank" },
//  //    { id: 2, text: "Standard Chartered Bank" },
//  //    { id: 3, text: "HBL Bank" },
//  //  ];
//  //CompanyBankBranch:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Select--" },
//  //    { id: 1, text: "Silk Bank" },
//  //    { id: 2, text: "Standard Chartered Bank" },
//  //    { id: 3, text: "HBL Bank" },
//  //  ];
//  //SalaryFilter:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Gross Salary--" },
//  //    { id: 1, text: "Gross Package" },
//  //    { id: 2, text: "Gross Salary" }
//  //  ];
//  //SalaryValFilter:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Equal to--" },
//  //    { id: 1, text: "Greater than" },
//  //    { id: 2, text: "Less than" },
//  //    { id: 3, text: "Equal to" },
//  //    { id: 4, text: "Between" },
//  //  ];

//  //SalaryValCurr:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--Rs--" },
//  //    { id: 1, text: "PAK" },
//  //    { id: 2, text: "BTD" },
//  //    { id: 3, text: "EUR" }
//  //  ];

//  //Grpby1:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--N/A--" },
//  //    { id: 1, text: "Division Wise" },
//  //    { id: 2, text: "Department Wise" },
//  //    { id: 3, text: "Sub-Department Wise" }
//  //  ];
//  //Grpby2:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "--N/A--" },
//  //    { id: 1, text: "Division Wise" },
//  //    { id: 2, text: "Department Wise" },
//  //    { id: 3, text: "Sub-Department Wise" }
//  //  ];
//  //sortby1:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "Employee Code" },
//  //    { id: 1, text: "Gross Salary" },
//  //    { id: 2, text: "Gross Package" }
//  //  ];

//  //Sortby2:
//  //  { id: number, text: string }[] = [
//  //    { id: 0, text: "Smallest to Largest" },
//  //    { id: 1, text: "Largest to Smallest" },
//  //  ];

  

//  //GetDropDownDetail(companyId: string): void {
//  //  this._spinnerService.showSpinner();
//  //  const url = `api/EmployeeSalaryList/GetAllDropdowns/${companyId}`;

//  //  this._userService.get(url).subscribe({
//  //    next: (data: any) => {
//  //      console.log('All Dropdown Data:', data);

//  //      // 1. Data Mapping
//  //      this.division = data.divisionList || [];
//  //      // Initial load pe hum department/subdept empty bhi rakh skty hain agar filter krna hai
//  //      this.department = data.departmentList || [];
//  //      this.subdepartment = data.subDepartmentList || [];

//  //      // 2. Default Selections (Agar data aya ho)
//  //      if (this.division.length > 0) {
//  //        this.selecteddivision = [this.division[0]];
//  //        // Division select honay par Department load/filter hona chahiye
//  //        // this.onDivisionChange(); 
//  //      }

//  //      if (this.department.length > 0) {
//  //        this.selectedDepartment = [this.department[0]];
//  //      }

//  //      this._spinnerService.hideSpinner();
//  //    },
//  //    error: (err) => {
//  //      console.error('Error loading dropdowns:', err);
//  //      this._spinnerService.hideSpinner();
//  //    }
//  //  });
//  //}


 



 

//  //onEmployeeSalaryChange() {
//  //  debugger
//  //  this.TemplateMaster = this.SalaryTemplate.find(e => e.id == this.TemplateMaster.EmployeeSalaryid).text;
//  /*}*/

//  //onForNewRecordEmployeesTeam_Change() {
//  //  debugger;
//  //  this.AddEmployeeTeam.UserEmpNameId = this.EmployeesTeamby.find(x => x.TeamId == this.AddEmployeeTeam.TeamId).Team;
//  //}

//  //SalaryDivisionChange(event: any): void {
//  //  console.log('Selected Divisions:', this.selectedDivision);
//  //}

//  //SalaryPayrollChange() {
//  //  this.EmployeeSalaryFilterMaster.employeePayName = this.Payroll.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeePayid).text;
//  //}

//  //SalaryDepartmentChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeDepartmentName = this.Department.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeDepid).text;

//  //}

//  //SalaryDesignationChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeDesignationName = this.Designation.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeDesid).text;

//  //}

//  //SalarySubDepChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeSubDepartmentName = this.SubDepartment.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeSubid).text;

//  //}

//  //SalaryGradeChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeGradeName = this.Grade.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeGradid).text;

//  //}
//  //SalaryLocChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeLocationName = this.Location.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeLocid).text;
//  //}

//  //SalaryCatChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeCategoryName = this.EmployeeCategoary.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeCatid).text;
//  //}

//  //SalaryRegChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeRegionName = this.Region.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeRegid).text;

//  //}

//  //SalaryTypChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeTypename = this.EmployeeType.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeTypid).text;
//  //}

//  //SalaryTeaChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeTeamName = this.Team.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeTeaid).text;

//  //}
//  //SalaryStatChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeStatusName = this.EmployeeStatus.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeStaid).text;


//  //}
//  //SalaryDirChange() {
//  //  this.EmployeeSalaryFilterMaster.employeeDirectReportingName = this.DirectReporting.find(e => e.id == this.EmployeeSalaryFilterMaster.EmployeeDirid).text;
//  //}

//  //BasicStationCountryChange() {
//  //  this.EmployeeJobInformationMaster.employeeBasicStationCountryname = this.BaseStationCountry.find(e => e.id == this.EmployeeJobInformationMaster.EmployeeStCountid).text;
//  //}

//  //CurrentStationCountryChange() {
//  //  this.EmployeeJobInformationMaster.employeeStationCurrentName = this.CurrentStation.find(e => e.id == this.EmployeeJobInformationMaster.EmployeeStCurrid).text;

//  //}
//  //ProfileShiftChange() {
//  //  this.EmployeeJobInformationMaster.profileShiftName = this.ProfileShift.find(e => e.id == this.EmployeeJobInformationMaster.ProfileShiftid).text;

//  //}
//  //BaseStationChange() {
//  //  this.EmployeeJobInformationMaster.baseStationName = this.BaseStationCity.find(e => e.id == this.EmployeeJobInformationMaster.BaseStationid).text;

//  //}
//  //CurrentStationChange() {
//  //  this.EmployeeJobInformationMaster.currentStationName = this.CurrentStation.find(e => e.id == this.EmployeeJobInformationMaster.CurrentStationid).text;
//  //}
//  //DutyGroupChange() {
//  //  this.EmployeeJobInformationMaster.dutyGroupName = this.DutyGroup.find(e => e.id == this.EmployeeJobInformationMaster.DutyGroupid).text;
//  //}

//  //AutoPresentChange() {
//  //  this.EmployeeJobInformationMaster.autoPresentName = this.AutoPresent.find(e => e.id == this.EmployeeJobInformationMaster.AutoPresentid).text;
//  //}

//  //ExitTypeChange() {
//  //  this.EmployeeResignationMaster.exitTypeName = this.ResignationExitType.find(e => e.id == this.EmployeeResignationMaster.ExitTypeid).text;

//  //}
//  //ExitReasonChange() {
//  //  this.EmployeeResignationMaster.exitReasonName = this.ResignationExitReason.find(e => e.id == this.EmployeeResignationMaster.ExitReasonid).text;

//  //}

//  //AdvanceSalaryChange() {
//  //  this.AdvanceSalaryFiltersMaster.advanceSalaryName = this.AdvanceSalary.find(e => e.id == this.AdvanceSalaryFiltersMaster.AdvanceSalaryid).text;

//  //}

//  //EmployeeAppPayChange() {
//  //  this.AdvanceSalaryFiltersMaster.advanceSalaryPayName = this.EmployeeAppPay.find(e => e.id == this.AdvanceSalaryFiltersMaster.EmployeeAppPayid).text;
//  //}

//  //BankDetailChange() {
//  //  this.BankTransferMaster.bankDetailName = this.BankDetail.find(e => e.id == this.BankTransferMaster.BankDetailid).text;
//  //}

//  //BankBranchChange() {
//  //  this.BankTransferMaster.bankBranchName = this.BankBranch.find(e => e.id == this.BankTransferMaster.BankBranchid).text;
//  //}

//  //CompanyBankDetailChange() {
//  //  this.CompanyBankDetailsMaster.companyBankDetailsName = this.CompanyBankDetail.find(e => e.id == this.CompanyBankDetailsMaster.CompanyBankDetailid).text;
//  //}

//  //SalaryFilterChange() {
//  //  this.SalaryFilterMaster.salaryFilterName = this.SalaryFilter.find(e => e.id == this.SalaryFilterMaster.SalaryFilterid).text;
//  //}
//  //SalaryValFilterChange() {
//  //  this.SalaryFilterMaster.salaryFilterValueName = this.SalaryValFilter.find(e => e.id == this.SalaryFilterMaster.SalaryFilterid).text;
//  //}
//  //SalaryValCurrChange() {
//  //  this.SalaryFilterMaster.salaryValCurrName = this.SalaryValCurr.find(e => e.id == this.SalaryFilterMaster.SalaryValCurrid).text;
//  //}

//  //Grpby1Change() {
//  //  this.GroupByMaster.grpby1Name = this.Grpby1.find(e => e.id == this.GroupByMaster.Grpby1id).text;
//  //}
//  //Grpby2Change() {
//  //  this.GroupByMaster.grpby2Name = this.Grpby2.find(e => e.id == this.GroupByMaster.Grpby2id).text;
//  //}
//  //sortby1Change() {
//  //  this.SortByMaster.sortbyidName = this.sortby1.find(e => e.id == this.SortByMaster.Sortbyid).text;
//  //}
//  //Sortby2Change() {
//  //  this.SortByMaster.sortbyName = this.Sortby2.find(e => e.id == this.SortByMaster.Sortbyid2).text;
//  //}


 
//    //this.EmployeeSalaryGrid = [
//    //  {
//    //    templatecode: '2',
//    //    templatedescription: '21/5/2025',
//    //    createdby: '19/4/2025',
//    //    createdon: '50000',
//    //    sharetemplatewithothers: 'Cash',
//    //  },

//    //];

//  //}
//  //LoadDropDowns() {
//  //  this._UtilitiesService.GetUserLevelsDataParameters(this.LoginEmpId, "1").subscribe({
//  //    next: (data: any) => {
//  //      this.ReporterLevels = data;
//  //      this._UtilitiesService.GetSubOrdinates(this.LoginEmpId, this.ModelLevel).subscribe({
//  //        next: (subData: any) => {
//  //          this.SubordinatesList = subData;
//  //        }
//  //      });
//  //    }
//  //  });
//  //}

//   /*loadTemplates(empId) {*/
//    //debugger;
//    //console.log('empId:', empId);  // Check if empId has value
//    //const url = `api/EmployeeSalaryList/GetLoadSavedTemp/${empId}`;
//    //console.log('url:', url); // Check the final url


//    //this._userService.get(url).subscribe(
//    //  data => {
//    //    this.TemplateMasterby = (data.loadSavedTemplate || []).map((item: any) => ({
//    //      CreatedById: item.UserID,
//    //      UserEmpNameId: item.UserEmpName
//    //    }));

//    //    // Step 2: Set default selection if label is "N/A" or "Self"
//    //    const defaultTemplate = this.TemplateMasterby.find(
//    //      t => (t.UserEmpNameId || '').trim().toUpperCase() === 'N/A' || t.UserEmpNameId === 'Self'
//    //    );

//    //    if (defaultTemplate) {
//    //      this.TemplateMaster.CreatedById = defaultTemplate.CreatedById;
//    //    }

//    //    this._spinnerService.hideSpinner();
//    //  },
//    //  (error: any) => {
//    //    console.error('Error loading template:', error);
//    //    this._spinnerService.hideSpinner();
//    //  }
//    //);
//  //}


//  //loadLocDropdown(companyId: string) {
//  //  const url = `api/EmployeeSalaryList/GetLocation/${companyId}`;
//  //  console.log('API URL:', url);
//  //  this._userService.get(url).subscribe(
//  //    (data: any) => {
//  //      console.log('Dropdowns loaded Data:', data);
//  //      this.Location = (data.location || []).map((item: any) => ({
//  //        id: item.id,
//  //        text: item.text
//  //      }));
//  //    },
//  //    (error: any) => {
//  //      console.error('loadLocDropdown error:', error);
       
//  //    }
//  //  );
//  //}


//  //loadRegDropdown(companyId: string) {
//  //  const url = `api/EmployeeSalaryList/GetRegion/${companyId}`;
//  //  console.log('API URL:', url);

   
//  //  this._userService.get(url).subscribe(
//  //    (data: any) => {
//  //      console.log('Dropdowns loaded Data:', data);
//  //      this.Region = (data.region || []).map((item: any) => ({
//  //        id: item.id,
//  //        text: item.text
//  //      }));
        
//  //    },
//  //    (error: any) => {
//  //      console.error('loadRegDropdown error:', error);
       
//  //    }
//  //  );
//  //}


  

}

//export class TemplateGrid {
//  templatecode: string= '';
//  templatedescription: string = '';
//  createdby: string = '';
//  createdon: string = '';
//  sharetemplatewithothers: string = '';
//}

//export class salarygridModel {
//  salarycriteria: string = '';
//  operand: string = '';
//  amount: string = '';
//  currency: string = '';
//}

//export class UserInfo {
//  UserID: string = '';
//  UserEmpName: string = '';
//  UserEmpNameId: string = '';
//  CreatedById: string = '';
//}

////class EmployeeSalary {

////  employeeDivisionName: string;
////  EmployeePayid: number = 0;
////  employeePayName: string;
////  EmployeeDepid: number = 0;
////  employeeDepartmentName: string;
////  EmployeeDesid: number = 0;
////  employeeDesignationName: string;
////  EmployeeSubid: number = 0;
////  employeeSubDepartmentName: string;
////  EmployeeGradid: number = 0;
////  employeeGradeName: string;
////  EmployeeLocid: number = 0;
////  employeeLocationName: string;
////  EmployeeCatid: number = 0;
////  employeeCategoryName: string;
////  EmployeeRegid: number = 0;
////  employeeRegionName: string;
////  EmployeeTypid: number = 0;
////  employeeTypename: string;
////  EmployeeTeaid: number = 0;
////  employeeTeamName: string ;
////  EmployeeStaid: number = 0;
////  employeeStatusName: string;
////  EmployeeDirid: number = 0;
////  employeeDirectReportingName: string;
////}

//export class EmployeeSalary {
//  Id: number = 0;
//  Name: string = '';
//  employeeDivisionid: number = 0;
//  employeeDivisionName: string = '';
//  EmployeeDepid: number = 0;
//  EmployeeDepName: string = '';
//  EmployeeSubid: number = 0;
//  EmployeeSubName: string = '';
//  EmployeeLocid: number = 0;
//  EmployeeLocName: string = '';
//}
//export class JobInformation {
//  EmployeeStCountid: number = 0;
//  employeeBasicStationCountryname: string = '';
//  EmployeeStCurrid: number = 0;
//  employeeStationCurrentName: string = '';
//  ProfileShiftid: number = 0;
//  profileShiftName: string = '';
//  BaseStationid: number = 0;
//  baseStationName: string = '';
//  CurrentStationid: number = 0;
//  currentStationName: string = '';
//  DutyGroupid: number = 0;
//  dutyGroupName: string = '';
//  AutoPresentid: number = 0;
//  autoPresentName: string = '';
//}
//export class Resignation {
//  ExitTypeid: number = 0;
//  exitTypeName: string = '';
//  ExitReasonid: number = 0;
//  exitReasonName: string = '';
//}

//export class AdvanceSalaryFilters {
//  AdvanceSalaryid: number = 0;
//  advanceSalaryName: string = '';
//  EmployeeAppPayid: number = 0;
//  advanceSalaryPayName: string = '';
//}

//export class ChequePayee {
//  Payee: number = 0;
//}

//export class BankTransfer {
//  BankDetailid: number = 0;
//  bankDetailName: string = '';
//  BankBranchid: number = 0;
//  bankBranchName: string = '';
//}

//export class CompanyBankDetails {
//  CompanyBankDetailid: number = 0;
//  companyBankDetailsName: string= ' ';
//  BankBranchid: number = 0;
//  bankBranchName: string = '';
//  CompanyBankAmount: number = 0;
//}
//export class SalaryFilter {
//  SalaryFilterid: number = 0;
//  salaryFilterName: string = '';
//  SalaryFiltervalueid: number = 0;
//  salaryFilterValueName: string = '';
//  SalaryValFilterid: number = 0;
//  SalaryValCurrid: number = 0;
//  salaryValCurrName: string = '';
//}

//export class GroupBy {
//  Grpby1id: number = 0;
//  grpby1Name: string = '';
//  Grpby2id: number = 0;
//  grpby2Name: string = '';
//}
//export class SortBy {
//  Sortbyid: number = 0;
//  sortbyidName: string = '';
//  Sortbyid2: number = 0;
//  sortbyName: string = '';
//}

//export class EarninggridModel {
//  basicsalary: number = 0;
//  houserent: number = 0;
//  cola: string = '';
//  cola1994: string = '';
//  medicalallowance: number = 0;
//}

//export class DeductiongridModel {
//  basicsalary: number = 0;
//  houserent: number = 0;
//  cola: string = '';
//  cola1994: string = '';
//  medicalallowance: number = 0;
//}
//export class DropdownResult {
//  sdlid: string =  '';
//  Name: string = '';
//  }

