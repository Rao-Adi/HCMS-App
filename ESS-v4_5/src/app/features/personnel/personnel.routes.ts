import { Routes } from '@angular/router';
import { EmpPerInformationComponent } from './emp-per-information/emp-per-information.component';
import { EmpJobInformationComponent } from './emp-job-information/emp-job-information.component';
import { MedicalReimbursement } from './medical-reimbursement/medical-reimbursement';
import { Empsalarylist } from './empsalarylist/empsalarylist';

export const PERSONNEL_ROUTES: Routes = [
  {
    path: 'employeepersonalinformation',
    component: EmpPerInformationComponent,
    data: {
      title: 'Employee Personal Information'
      // formId: 'YourFormId' 
    },
  },
  {
    path: 'employeejobinformation',
    component: EmpJobInformationComponent,
    data: {
      title: 'Employee Job Information'
    },
  },
  {
    path: 'medicalreimbursementrequest',
    component: MedicalReimbursement,
    data: {
      title: 'Medical Reimbursement'
      // formId: 'YourMedicalFormId'
    }
  },
  {
    path: 'employeesalarylist',
    component: Empsalarylist,
    data: {
      title: 'Employee Salary List'
      // formId: 'YourMedicalFormId'
    }
  }
  // --- Add your other personnel routes here ---
  /*
  {
    path: 'empjobinfo',
    component: EmpJobInfoComponent,
    data: {
      title: 'Employee Job Information'
      // formId: 'YourJobInfoFormId'
    }
  },
  {
    path: 'medicalrequest',
    component: MedicalRequestComponent,
    data: {
      title: 'Medical Request'
      // formId: 'YourMedicalFormId'
    }
  },
  */

  // --- We have removed the { path: '', redirectTo: ... } ---
  // Now, navigating to just /personnel will not load any of these components
  // by default. The user must go to the full path.
];
