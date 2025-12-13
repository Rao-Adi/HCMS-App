import { Routes } from '@angular/router';
import { ApplicationLevelErrorComponent } from '@app/errors/application-level-error/application-level-error';
import { MainLayoutComponent } from '@app/layout/main-layout/main-layout';
import { authGuard } from '@app/core/guards/auth.guard';

export const routes: Routes = [
  // Public
  {
    path: '',
    loadChildren: () =>
      import('@app/features/securitymain/securitymain.routes').then(m => m.SECURITY_ROUTES)
  },
  { path: 'applicationlevelerror', component: ApplicationLevelErrorComponent },

  // Private (guarded)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { formId: 'IsLogin', authRequired: true },
    children: [
      // --- THIS IS THE FIX ---
      // You must lazy-load the dashboard routes here so the
      // router knows what to do with the '/dashboard' path.
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@app/features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      // --- ADD THIS NEW BLOCK ---
      {
        path: 'personnel', // This will be the URL: /personnel
        loadChildren: () =>
          import('@app/features/personnel/personnel.routes').then(m => m.PERSONNEL_ROUTES)
      },
      // ---------------------

      // This line is also correct. It makes '/dashboard' the default
      // page for the private (guarded) section.
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

       // ⬇️ Private 404 (no redirect; preserves original bad URL)
      {
        path: '**',
        loadComponent: () =>
          import('./features/notfound/notfound').then(m => m.Notfound)
      }
    ]
  },

  // Fallback to a public route to avoid loops
  { path: '**', redirectTo: 'applicationlevelerror' }
];
