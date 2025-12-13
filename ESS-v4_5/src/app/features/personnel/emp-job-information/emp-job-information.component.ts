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

@Component({
  selector: 'EmpJobInformation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    AgGridAngular,
    NzDatePickerModule
  ],
  templateUrl: './emp-job-information.component.html',
  styleUrl: './emp-job-information.component.css'
})
export class EmpJobInformationComponent implements OnInit {
  private translate = inject(TranslateService);
  private _userService = inject(DataService);
  private _UtilitiesService = inject(UtilitiesService);

  constructor () { }
  image: any = './assets/images/pro.png'
  selectedTab: string = 'EmployeeInformation';
  show: boolean = false;
  LoginEmpId: string = '';
  ReporterLevels: any;
  ModelLevel: any = 0;
  SubordinatesList: any[] = [];
  SubOrdinateEmpId: any;
  SubOrdinateEmpCode: string = '';
  public defaultColDef: ColDef = {};
  public noRowsOverlay: string = '';

  EmployeeInfo: EmployeeInfo = new EmployeeInfo();

  EmployeeLeaves: Array<EmployeeLeaves> = new Array<EmployeeLeaves>();
  public EmployeeLeavesColumnDefs: ColDef[] = [];

  EmployeeHolidays: Array<EmployeeHolidays> = new Array<EmployeeHolidays>();
  public EmployeeHolidaysColumnDefs: ColDef[] = [];

  DocumentsGrid: Array<DocumentsGrid> = new Array<DocumentsGrid>();
  public DocumentsGridColumnDefs: ColDef[] = [];

  MiscAlerts: Array<MiscAlerts> = new Array<MiscAlerts>();
  public MiscAlertsColumnDefs: ColDef[] = [];

  AwardsGrid: Array<AwardsGrid> = new Array<AwardsGrid>();
  public AwardsGridColumnDefs: ColDef[] = [];

  DisciplinaryActions: Array<DisciplinaryActions> = new Array<DisciplinaryActions>();
  public DisciplinaryActionsColumnDefs: ColDef[] = [];
  CompletedTrainings: Array<CompletedTrainings> = new Array<CompletedTrainings>();
  public CompletedTrainingsColumnDefs: ColDef[] = [];
  TrainingNominationsConfirmations: Array<TrainingNominationsConfirmations> = new Array<TrainingNominationsConfirmations>();
  public TrainingNominationsConfirmationsColumnDefs: ColDef[] = [];
  AssetsDetail: Array<AssetsDetail> = new Array<AssetsDetail>();
  public AssetsDetailColumnDefs: ColDef[] = [];
  JobDescription: Array<JobDescription> = new Array<JobDescription>();
  public AssetsDetailJobDescriptionColumnDefs: ColDef[] = [];
  ActiveLoans: Array<ActiveLoans> = new Array<ActiveLoans>();
  public ActiveLoansColumnDefs: ColDef[] = [];
  selectedSubject: any = "0";
  Subjects: Array<Subject> = new Array<Subject>();
  DateFromSubject: any = null;
  DateToSubject: any = null;
  ForeignEmployees: boolean = false;

  // Image variables
  imgUrl: string = './assets/images/pro.png';
  uniqueImgName: any;
  EmpPicPath: any;
  picexistsornot: any;
  imageToUpload: File[] | null = null;
  fileToUpload: File[] | null = null;
  previousImagePath: string = "";
  previousThumbnailImagePath: string = "";
  public dateRange: Date[] = [];
  
  ngOnInit() {
    this.GetLoginEmpId();
    this.loadEmployeeImage();
    this.LoadDropDowns();
    this.LoadEmployeeData(this.LoginEmpId);
    this.setupEmployeeLeavesGrid();
    this.setupEmployeeHolidaysGrid();
    this.setupMiscAlertsGrid();
    this.setupDocumentsGrid();
    this.setupAwardsGrid();
    this.setupDisciplinaryActionsGrid();
    this.setupCompletedTrainingsGrid();
    this.setupTrainingNominationsConfirmationsGrid();
    this.setupAssetsDetailGrid();
    this.setupAssetsDetailJobDescriptionGrid();
    this.setupActiveLoansGrid();
    // Modern subscription syntax (Observer object)
    this._UtilitiesService.IsInternationalDeployment().subscribe({
      next: (result: boolean) => {
        this.ForeignEmployees = result;
      },
      error: (err: any) => console.error('Flag load failed', err)
    });
    ///from here testing
   
  }
  GetLoginEmpId() {
    this.LoginEmpId = this._UtilitiesService.GetEmpid() || '';
    this.SubOrdinateEmpId = this.LoginEmpId;
  }

  loadEmployeeImage() {
    this._UtilitiesService.GetEmployeeImage(this.SubOrdinateEmpId).subscribe({
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
      }
    });
  }

  LoadDropDowns() {
    this._UtilitiesService.GetUserLevelsDataParameters(this.LoginEmpId, "1").subscribe({
      next: (data: any) => {
        this.ReporterLevels = data;
        this._UtilitiesService.GetSubOrdinates(this.LoginEmpId, this.ModelLevel).subscribe({
          next: (subData: any) => {
            this.SubordinatesList = subData;
          }
        });
      }
    });
  }
  ChangeLevel() {
    this._UtilitiesService.GetSubOrdinates(this.LoginEmpId, this.ModelLevel).subscribe({
      next: (data: any) => {
        this.SubordinatesList = data;
        this.LoadEmployeeData(this.LoginEmpId);
      }
    });
  }
  ChangeSubOrdinates() {
    this.LoadEmployeeData(this.SubOrdinateEmpId);
    this.loadEmployeeImage();
  }

  LoadEmployeeData(EmpId: any) {
    this._userService.get('EmployeeJobInformation/GetEmployeeInfo/' + EmpId + '').subscribe({
      next: (data: any) => {
        if (data.EmployeeProfile && data.EmployeeProfile.length > 0) {
          this.EmployeeInfo = data.EmployeeProfile[0];
        }
        this.EmployeeLeaves = data.EmployeeLeaves;
        this.EmployeeHolidays = data.EmployeeHolidays || [];
        this.Subjects = data.Subjects || [];
        this.DocumentsGrid = data.Documents || [];
        this.MiscAlerts = data.MiscAlerts || [];
        this.AwardsGrid = data.AwardsGrid || [];
        this.DisciplinaryActions = data.DisciplinaryActions || [];
        this.CompletedTrainings = data.CompletedTrainings || [];
        this.AssetsDetail = data.AssetsDetail || [];
        this.TrainingNominationsConfirmations = data.TrainingNominationsConfirmations || [];
        this.JobDescription = data.JobDescription || [];
        this.ActiveLoans = data.ActiveLoans || [];
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }
  onsubjectChange() {
    // Implementation if needed
  }

  subjectdatePickerChanged(eventData: any, subject: string) {
    if (eventData.isValid === true) {
      if (subject == "DateFromSubject") {
        this.DateFromSubject = eventData.date;
      }
      if (subject == "DateToSubject") {
        this.DateToSubject = eventData.date;
      }
    }
  }

  filterSubjects() {
    const url = `api/EmployeeJobInformation/GetFilteredDocument/${this.LoginEmpId}/${this.selectedSubject}/${this.DateFromSubject}/${this.DateToSubject}`;

    this._userService.get(url).subscribe({
      next: (data: any) => {
        this.DocumentsGrid = data.Documents;
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }
  public agGridApi: any;

  onGridReady(params: any) {
    this.agGridApi = params.api;
  }

  AcknowledgedByEmployee(row: any, i: number, checked: boolean) {
    if (row.Received && checked) return;
    row.Received = checked;

    console.log(`Updating document status for index ${i}`);
    this._userService.post('EmployeeJobInformation/UpdateEmpDocRecStatus', row).subscribe({
      next: (res) => {
        console.log("Acknowledgement successful:", res);
        if (this.agGridApi) {
          this.agGridApi.applyTransaction({ update: [row] });
        }
      },
      error: (error: any) => {
        console.error("Acknowledgement failed:", error);
        row.Received = !checked;
        if (this.agGridApi) {
          this.agGridApi.applyTransaction({ update: [row] });
        }
      }
    });
  }
  setupEmployeeLeavesGrid() {

    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };

    this.EmployeeLeavesColumnDefs = [
      {
        headerName: this.translate.instant('labels.Description'),
        field: 'Description',
        filter: 'agTextColumnFilter', // Add a text filter

      },
      {
        headerName: this.translate.instant('labels.MaxAllowed'),
        field: 'MaxAllowed',
        filter: 'agTextColumnFilter'
      },
      {
        headerName: this.translate.instant('labels.LeavesApproved'),
        field: 'Availed'
      },
      {
        headerName: this.translate.instant('labels.PreviousYearBalance'),
        field: 'PrevBalance',

      }, 
      {
        headerName: this.translate.instant('labels.CurrentYearBalance'),
        field: 'CurrBalance',
        filter: 'agDateColumnFilter' 
      },
      {
        headerName: this.translate.instant('labels.LeaveRequestsPending'),
        field: 'PendingLeaves',

      }
    ];

    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound');
  }
  setupEmployeeHolidaysGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.EmployeeHolidaysColumnDefs = [
      {
        headerName: this.translate.instant('labels.Description'),
        field: 'Description',
        filter: 'agTextColumnFilter',
      },
      {
        headerName: this.translate.instant('labels.DateFrom'),
        field: 'dateFr',
        filter: 'agDateColumnFilter' // Fix: Proper date filter
      },
      {
        headerName: this.translate.instant('labels.DateTo'),
        field: 'DateTo',
        filter: 'agDateColumnFilter' // Fix: Added date filter
      },
      {
        headerName: this.translate.instant('labels.HolidayType'),
        field: 'HolidayType',
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); // Fix: Separate overlay
  }
  setupDocumentsGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.DocumentsGridColumnDefs = [
      {
        headerName: this.translate.instant('labels.Subject'),
        field: 'subject',
        filter: 'agTextColumnFilter',
      },
      {
        headerName: this.translate.instant('labels.DateOfIssuance'),
        field: 'IssueDate',
        filter: 'agDateColumnFilter' // Fix: Proper date filter
      },
      {
        headerName: this.translate.instant('labels.Remarks'),
        field: 'Remarks',
        filter: 'agDateColumnFilter' // Fix: Added date filter
      },
      {
        headerName: this.translate.instant('labels.AcknowledgedByEmployee'),
        field: 'HolidayType',
      },
      {
        headerName: this.translate.instant('labels.AcknowledgedByEmployee'),
        field: 'Received', // Yeh field aapke DocumentsGrid ka boolean field hai
        width: 150,
        cellRenderer: this.acknowledgedCellRenderer.bind(this), // <--- NEW RENDERER
        filter: false,
        sortable: false,
        resizable: false,
        editable: false,
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); // Fix: Separate overlay
  }
  acknowledgedCellRenderer(params: any): string {
    const row = params.data;
    const rowIndex = params.rowIndex;
    const isDisabled = row.Received ? 'disabled' : '';
    const isChecked = row.Received ? 'checked' : '';

    // Is HTML string mein aapka pura toggle switch code hai.
    // 'AcknowledgedByEmployee' function ko call karne ke liye hum event listener ki bajaye
    // Ag-Grid ka 'onmousedown' ya 'onclick' istemal karte hain.
    // **Yahan `AcknowledgedByEmployee(row, rowIndex)` call karna mushkil hai.**
    // Is liye hum Ag-Grid ka standard approach, yaani ek Button (ya checkbox) banayenge, 
    // aur usay component ke method se link karenge.

    // Simple Checkbox aur Toggle Class ke saath:
    return `
      <div class="ag-cell-centered-element" style="text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">
        <label class="switch" style="margin: 0;">
          <input type="checkbox" 
                 ${isDisabled} 
                 ${isChecked}
                 onclick="this.gridApi.context.componentParent.AcknowledgedByEmployee(this.gridApi.context.componentParent.DocumentsGrid[${rowIndex}], ${rowIndex}, this.checked)"
                 />
          <div class="slider round ${row.Received ? 'disableToggle' : ''}"></div>
        </label>
      </div>
    `;
  }
  setupMiscAlertsGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.MiscAlertsColumnDefs = [
      {
        headerName: this.translate.instant('labels.AlertType'),
        field: 'Name',
        filter: 'agTextColumnFilter',
      },
      {
        headerName: this.translate.instant('labels.ExpiryDate'),
        field: 'Date',
        filter: 'agDateColumnFilter' // Fix: Proper date filter
      },
      {
        headerName: this.translate.instant('labels.Remarks'),
        field: 'Remarks'
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); // Fix: Separate overlay
  }
  setupAwardsGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.AwardsGridColumnDefs = [
      {
        headerName: this.translate.instant('labels.Award'),
        field: 'Name'
      },
      {
        headerName: this.translate.instant('labels.AwardDate'),
        field: 'AwardDate',
        filter: 'agDateColumnFilter' 
      },
      {
        headerName: this.translate.instant('labels.Comments'),
        field: 'Comments'
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); // Fix: Separate overlay
  }
  setupDisciplinaryActionsGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.DisciplinaryActionsColumnDefs = [
      {
        headerName: this.translate.instant('labels.Date'),
        field: 'DspDate',
        filter: 'agTextColumnFilter',
      },
      {        
        headerName: this.translate.instant('labels.MisbehaveAction'),
        field: 'Dsp'
      }, 
      {
        headerName: this.translate.instant('labels.DisciplinaryAction'),
        field: 'DspAct'
      },
      {
        headerName: this.translate.instant('labels.Remarks'),
        field: 'Remarks'
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); // Fix: Separate overlay
  }
  setupCompletedTrainingsGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.CompletedTrainingsColumnDefs = [
      {
        headerName: this.translate.instant('labels.Institute'),
        field: 'DspDate'
      },
      {
        headerName: this.translate.instant('labels.Course'),
        field: 'Dsp'
      },
      {
        headerName: this.translate.instant('labels.DateFrom'),
        field: 'DspAct',
        filter: 'agTextColumnFilter',
      },
      {
        headerName: this.translate.instant('labels.DateTo'),
        field: 'Remarks',
        filter: 'agTextColumnFilter',
      },
      {
        headerName: this.translate.instant('labels.Need'),
        field: 'Remarks'
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); // Fix: Separate overlay
  }
  setupTrainingNominationsConfirmationsGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.TrainingNominationsConfirmationsColumnDefs = [
      {
        headerName: this.translate.instant('labels.InstituteName'),
        field: 'InstituteName'
      },
      {
        headerName: this.translate.instant('labels.CourseName'),
        field: 'CourseName'
      },
      {
        headerName: this.translate.instant('labels.StartDate'),
        field: 'StartDate',
        filter: 'agTextColumnFilter',
      },
      {
        headerName: this.translate.instant('labels.EndDate'),
        field: 'EndDate',
        filter: 'agTextColumnFilter',
      },
      {
        headerName: this.translate.instant('labels.Nomination'),
        field: 'Nomination'
      },
      {
        headerName: this.translate.instant('labels.Confirmation'),
        field: 'Confirmation'
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); // Fix: Separate overlay
  }
  setupAssetsDetailGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.AssetsDetailColumnDefs = [
      {
        headerName: this.translate.instant('labels.AssetNo'),
        field: 'AssetNo'
      },
      {
        headerName: this.translate.instant('labels.AssetDescription'),
        field: 'AssetDesc'
      },
      {
        headerName: this.translate.instant('labels.Category'),
        field: 'Category'
      },
      {
        headerName: this.translate.instant('labels.BrandModel'),
        field: 'Model'
      },
      {
        headerName: this.translate.instant('labels.MakeCompany'),
        field: 'Make'
      },
      {
        headerName: this.translate.instant('labels.DateOfAssignment'),
        field: 'HandingOverDate'
      },
      {
        headerName: this.translate.instant('labels.DateOfUnAssignment'),
        field: 'TakingOverDate'
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); 
  }
  detailViewRenderer(params: any): string {
    const detailValue = params.value || 'N/A'; 
    const jobCode = params.data.JobCode;
    const viewLink = `<a href="javascript:void(0);" 
                       data-jobcode="${jobCode}" 
                       onclick="this.gridApi.context.componentParent.ViewJobDetail('${jobCode}')"
                       style="color: #3F5AA8; cursor: pointer; margin-left: 5px;">View</a>`;
    return viewLink;
  }
  setupAssetsDetailJobDescriptionGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };
    this.AssetsDetailJobDescriptionColumnDefs = [
      {
        headerName: this.translate.instant('labels.JobCode'),
        field: 'JobCode'
      },
      {
        headerName: this.translate.instant('labels.JobTitle'),
        field: 'JobTitle'
      },
      {
        headerName: this.translate.instant('labels.Role'),
        field: 'Role'
      },
      {
        headerName: this.translate.instant('labels.Detail'),
        field: 'View', 
        cellRenderer: this.detailViewRenderer.bind(this), 
        width: 100, 
        filter: false,
        sortable: false,
        resizable: false
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound'); 
  }
  LoanAcknowledgedByEmployee(row: any, i: number) {
    this._userService.post('EmployeeJobInformation/UpdateLoan', row).subscribe({
      next: (res) => {
        console.log("Loan Acknowledged successfully:", res);
        if (this.agGridActiveLoansApi) {
          this.agGridActiveLoansApi.applyTransaction({ update: [row] });
        }
      },
      error: (error: any) => {
        console.error("Loan Acknowledgement failed:", error);
        row.ReceivedFromPortal = false;
        if (this.agGridActiveLoansApi) {
          this.agGridActiveLoansApi.applyTransaction({ update: [row] });
        }
      }
    });
  }
  loanAcknowledgedCellRenderer(params: any): string {
    const row = params.data;
    const rowIndex = params.rowIndex;

    // ReceivedFromPortal (Boolean field) ko check karein
    const isDisabled = row.ReceivedFromPortal ? 'disabled' : '';
    const isChecked = row.ReceivedFromPortal ? 'checked' : '';

    // Context se function call karne ke liye HTML mein onclick lagana parega.
    // this.gridApi.context.componentParent se aapka component milta hai.
    const clickHandler = `this.gridApi.context.componentParent.onLoanToggleClick(this.gridApi.context.componentParent.ActiveLoans[${rowIndex}], ${rowIndex}, this.checked)`;

    // Custom Toggle Switch HTML
    return `
      <div style="text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">
        <label class="switch" style="margin: 0;">
          <input type="checkbox" 
                 ${isDisabled} 
                 ${isChecked}
                 onclick="${clickHandler}"
                 />
          <div class="slider round ${row.ReceivedFromPortal ? 'disableToggle' : ''}"></div>
        </label>
      </div>
    `;
  }
  public agGridActiveLoansApi: any; // Grid API ko store karne ke liye
  onGridReadyLoans(params: any) {
    this.agGridActiveLoansApi = params.api;
  }
  onLoanToggleClick(row: any, i: number, checked: boolean) {
    if (row.ReceivedFromPortal && checked) return;
    row.ReceivedFromPortal = checked;
    this.LoanAcknowledgedByEmployee(row, i);
  }
  setupActiveLoansGrid() {
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,     
    };
    this.ActiveLoansColumnDefs = [
      {
        headerName: this.translate.instant('labels.LoanType'),
        field: 'LoanType'
      },
      {
        headerName: this.translate.instant('labels.ApplicationDate'),
        field: 'AppDate'
      },
      {
        headerName: this.translate.instant('labels.AmountApprovedWOInterest'),
        field: 'LoanAmtWithoutInt'
      },
      {
        headerName: this.translate.instant('labels.InterestAmount'),
        field: 'Interest'
      },
      {
        headerName: this.translate.instant('labels.BalanceAmount'),
        field: 'BalanceAmount'
      },
      {
        headerName: this.translate.instant('labels.AcknowledgedByEmployee'),
        field: 'HandingOverDate',
        cellRenderer: this.loanAcknowledgedCellRenderer.bind(this), 
        width: 150,
        filter: false,
        sortable: false,
        resizable: false,
        editable: false,
      }
    ];
    this.noRowsOverlay = this.translate.instant('labels.NoRowsFound');
  }
  applyDateRangeFilter(): void {
    if (this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      const startDate = this.dateRange[0];
      const endDate = this.dateRange[1];

      console.log('Filter applied from:', startDate.toLocaleDateString());
      console.log('Filter applied to:', endDate.toLocaleDateString());

      // Yahan aapko apne API call ya data filtering ki logic lagani hai
      // For Example: this.filterDataByDate(startDate, endDate);
    }
  }
  
}

//imgUrl: string = './assets/images/pro.png'; uniqueImgName: any;
//EmpPicPath: any; picexistsornot: any;
//imageToUpload: File[] = null;
//fileToUpload: File[] = null;
//previousImagePath: string = "";
//previousThumbnailImagePath: string = "";
///////// End image and file variable declare //////////////

export class EmployeeInfo {
  EmpCode: string = '';
  Name: string = '';
  MainDepartment: string = '';
  Department: string = '';
  DateJoin: string = '';
  Email: string = '';
  Designation: string = '';
  EmpPic: string = '';
  DReportToCompny: string = '';
  iDReportToCompny: string = '';
  ReportingPerson: string = '';
  DottedPerson: string = '';
  Shift: string = '';
  CompanyName: string = '';
  DivisionName: string = '';
  Location: string = '';
  JobGroup: string = '';
  PayrollGroup: string = '';
  EmployeeType: string = '';
  DateConfirm: string = '';
  DateConfirmDue: string = '';
  ContractExpiryDate: string = '';
  InternExpiryDate: string = '';
  ProbhationExtDate: string = '';
  IdCardRemarks: string = '';
  FamilyCardNo: string = '';
  IqamaNo: string = '';
  IqamaProfession: string = '';
  IqamaExpiryHijri: string = '';
  IqamaExpiryGregorian: string = '';
  CurrSpnsName: string = '';
  SpnsTransferable: string = ''; // "Yes", "No", or "N/A"
  SpnsType: string = '';
  SpnsCountry: string = '';
  SpnsCity: string = '';
  SpnsContactDetails: string = '';
  SpnsNatureOfBusiness: string = '';
  SpnsExpiryHijri: string = '';
  SpnsExpiryGregorian: string = '';
  EmployeeCategory: string = '';
  RoleName: string = '';
  JobProfileId: string = '';
}

export class EmployeeLeaves {
  Description: string = '';
  LCode: string = '';
  MaxAllowed: string = '';
  Availed: string = '';
  Balance: string = '';
  PrevBalance: string = '';
  CurrBalance: string = '';
  PendingLeaves: string = '';
  FiscalYear: string = '';
  IsGradeWiseLeaveEntitlementDifferent: string = '';
  Availed_Next: string = '';
  PendingLeaves_Next: string = '';
  PenaltyDaysDeduction: string = '';
}

export class EmployeeHolidays {
  SrNo: string = '';
  Description: string = '';
  HolidayType: string = '';
  dateFr: string = '';
  DateTo: string = '';
}

export class Subject {
  empDocId: number = 0;
  subject: string = '';
  subjectName: string = '';
}

export class DocumentsGrid {
  EmpDocId: number = 0;
  EmpId: number = 0;
  subject: string = '';
  Remarks: string = '';
  Received: boolean = false;
  IssueDate: string = '';
  CompanyId: number = 0;
}

export class MiscAlerts {
  SrNo: number = 0;
  Name: number = 0;
  Date: string = '';
  Remarks: string = '';
}

export class AwardsGrid {
  Name: string = '';
  AwardDate: string = '';
  Comments: string = '';
}

export class DisciplinaryActions {
  DspEmpid: number = 0;
  Empid: number = 0;
  DspDate: string = '';
  Dsp: string = '';
  DspAct: string = '';
  Remarks: string = '';
  Status: boolean = false;
  BlackListed: boolean = false;
  CompanyId: number = 0;
}

export class CompletedTrainings {
  Institute: string = '';
  Course: string = '';
  DateFrom: string = '';
  DateTo: string = '';
  Need: string = '';
}

export class AssetsDetail {
  AssetNo: string = '';
  sDate: string = '';
  AssetDesc: string = '';
  catid: string = '';
  Category: string = '';
  Model: string = '';
  Make: string = '';
  HandingOverDate: string = '';
  TakingOverDate: string = '';
}

export class TrainingNominationsConfirmations {
  SrNo: number = 0;
  InstituteName: string = '';
  Course: string = '';
  FromDate: string = '';
  DateTo: string = '';
  IsNominatedByDept: boolean = false;
  IsConfirm: boolean = false;
}

export class JobDescription {
  JobProfileId: number = 0;
  JobCode: string = '';
  JobTitle: string = '';
  Role: string = '';
}

export class ActiveLoans {
  LoanMstId: number = 0;
  LoanID: number = 0;
  EmpId: number = 0;
  Active: boolean = false;
  EmpCode: string = '';
  FullName: string = '';
  LoanAmtWithoutInt: number = 0;
  Interest: number = 0;
  Installment: number = 0;
  CompanyId: number = 0;
  BalanceAmount: number = 0;
  LoanType: string = '';
  AppDate: string = '';
  ReceivedFromPortal: boolean = false;
}
