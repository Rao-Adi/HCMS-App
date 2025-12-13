import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard'; // Import the component

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '', // Default route for the dashboard feature
    component: DashboardComponent,
    // data: { title : 'Dashboard' } // You can still add data if needed
  }
];
