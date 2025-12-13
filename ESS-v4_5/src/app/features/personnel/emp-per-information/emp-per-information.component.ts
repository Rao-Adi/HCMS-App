import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '@app/core/services/data.service';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'empPerInformation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SafeTranslatePipe,
    AgGridAngular
  ],
  templateUrl: './emp-per-information.component.html',
  styleUrls: ['./emp-per-information.component.css']
})
export class EmpPerInformationComponent implements OnInit {

  private translate = inject(TranslateService);
  constructor(
    private _userService: DataService,
    // private _spinnerService: SpinnerService, // Uncomment if you add spinner back
    private _UtilitiesService: UtilitiesService
  ) { }

  LoginEmpId: string | null = null;
  ReporterLevels: any;
  ModelLevel: any = 0;

  // --- THIS IS THE FIX ---
  // We explicitly type the array as any[]
  SubordinatesList: any[] = [];
  // ---------------------

  SubOrdinateEmpId: any;
  SubOrdinateEmpCode: string | null = null;
  image: any = './assets/images/pro.png'
  EmpPicPath: any; picexistsornot: any;
  imageToUpload: File[] | null = null;
  fileToUpload: File[] | null = null;
  previousImagePath: string = ""; previousThumbnailImagePath: string = "";
  EmployeePerInformation: EmployeePerInformation = new EmployeePerInformation();
  EmployeeEmergencyContact: EmployeeEmergencyContact = new EmployeeEmergencyContact();
  certification: Array<certification> = Array<certification>();
  AcademicQualification: AcademicQualification[] = [];

  dependents: Array<dependents> = Array<dependents>();
  public dependentColumnDefs: ColDef[] = [];
  public defaultColDef: ColDef = {};
  public noRowsOverlay: string = '';

  selectedTab: string = 'EmployeeInformation';

  ngOnInit() {
    this.setupDependentGrid();

    this.GetLoginEmpId();
    this.LoadDropDowns();
    this.LoadEmployeeData(this.LoginEmpId); // Call LoadEmployeeData    
  }

  GetLoginEmpId() {
    this.LoginEmpId = this._UtilitiesService.GetEmpid();
    this.SubOrdinateEmpId = this.LoginEmpId;
    this.loadEmployeeImage();
  }

  LoadDropDowns() {
    if (!this.LoginEmpId) {
      console.error("Employee ID is null, cannot load dropdowns.");
      return;
    }

    // this._spinnerService.showSpinner();
    // Assuming 'true' is correct based on the previous TS error
    this._UtilitiesService.GetUserLevelsDataParameters(this.LoginEmpId, "1").subscribe(
      data => {
        this.ReporterLevels = data;

        this._UtilitiesService.GetSubOrdinates(this.LoginEmpId!, this.ModelLevel).subscribe(
          data => {
            this.SubordinatesList = data;
            // this._spinnerService.hideSpinner();
          })
      })
  }

  ChangeLevel() {    
    if (!this.LoginEmpId) { return; }

    // this.spinnerService.showSpinner();

    this._UtilitiesService.GetSubOrdinates(this.LoginEmpId!, this.ModelLevel).subscribe(
      data => {
        this.SubordinatesList = data;
        this.LoadEmployeeData(this.SubOrdinateEmpId);
        // this._spinnerService.hideSpinner();
      })
  }

  ChangeSubOrdinates() {
    this.LoadEmployeeData(this.SubOrdinateEmpId);
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

  LoadEmployeeData(EmpId: string | null) {
    if (!EmpId) {
      console.error("Employee ID is null, cannot load data.");
      return;
    }

    // this._spinnerService.showSpinner();
    this._userService.get('EmployeePersonalInformation/GetEmployeePersonalInfo/' + EmpId + '').subscribe({
      next: (data: any) => {
        console.log(data);
        if (data.EmployeePersonalProfile && data.EmployeePersonalProfile.length > 0) {
          this.EmployeePerInformation = data.EmployeePersonalProfile[0];
        }
        if (data.FillEmployeeProfile && data.FillEmployeeProfile.length > 0) {
          this.EmployeePerInformation = data.FillEmployeeProfile[0];
        }
        if (data.EmployeeEmergencyContact && data.EmployeeEmergencyContact.length > 0) {
          this.EmployeeEmergencyContact = data.EmployeeEmergencyContact[0];
        }
        this.certification = data.EmployeeCertificates;
        this.AcademicQualification = data.EmployeeAcademicQualification;
        this.dependents = data.EmployeeDependents;

        this.loadEmployeeImage();

        // this._spinnerService.hideSpinner();
      },
      error:(error: any) => {
      // this._spinnerService.hideSpinner();
    }
    });
  }

  setupDependentGrid() {

    // Set default behaviors for ALL columns
    this.defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      tooltipValueGetter: (params) => params.value,
    };

    this.dependentColumnDefs = [
      {
        headerName: this.translate.instant('labels.Name'),
        field: 'Name',
        filter: 'agTextColumnFilter', // Add a text filter

      },
      {
        headerName: this.translate.instant('labels.Relation'),
        field: 'Relation',
        filter: 'agTextColumnFilter'
      },
      {
        headerName: this.translate.instant('labels.Gender'),
        field: 'Gender'
      },
      {
        headerName: this.translate.instant('labels.Qualification'),
        field: 'Qualifaction',

      },
      {
        headerName: this.translate.instant('labels.DateOfBirth'),
        field: 'DOB',
        filter: 'agDateColumnFilter' // Add a date filter
      }
    ];

    this.noRowsOverlay = this.translate.instant('labels.NoDependentsFound');
  }

}


// --- Data Models ---

class EmployeePerInformation {
  Designation: string = '';
  Name: string = '';
  FName: string = '';
  Phone: string = '';
  DateofBirth: string = '';
  Mobile: string = '';
  NICNew: string = '';
  Address: string = '';
  IdCardRemarks: string = '';
  Email: string = '';
  CNICExpiryDate: string = '';
  Nationality: string = '';
  Blood: string = '';
  Gender: string = '';
  Religion: string = '';
  PassportExpiryDate: string = '';
  Marital: string = '';
  SectId: string = '';
  MTId: string = '';
  NTN: string = '';
  FamilyCardNo: string = '';
  Identification: string = '';
  Relation: string = '';
}
class EmployeeEmergencyContact {
  ContactPerson: string = '';
  Phone: string = '';
  Mobile: string = '';
  Address: string = '';
  Relation: string = '';
}
class certification {
  Name: string = '';
  DateAchieved: string = '';
  ExpiryDate: string = '';
}
class AcademicQualification {
  Qulification: string = '';
  qlfid: string = '';
  Insid: string = '';
  institute: string = '';
  PassingYear: string = '';
  City: string = '';
}
class dependents {
  Name: string = '';
  Relation: string = '';
  Gender: string = '';
  Qualifaction: string = '';
  DOB: string = '';
}
