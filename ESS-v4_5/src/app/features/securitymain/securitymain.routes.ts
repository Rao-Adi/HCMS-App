import { Routes } from '@angular/router';
// Import your standalone components
// NOTE: Make sure these components are converted to standalone: true
import { login } from './login/login';
//import { errorPage } from './Error/errorPage';
import { SecurityComponent } from './security/security.component';

// These are the routes from your old SecurityRoutingModule,
// now using standalone 'component' or 'loadComponent'
export const SECURITY_ROUTES: Routes = [
  {
    path: 'security',
    component: SecurityComponent, // or loadComponent: () => import('./security/Security').then(m => m.Security)    
  },
  {
    path: 'login/:variable',
    component: login // This is the component we've been working on
  }  
];
