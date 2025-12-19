import { Routes } from '@angular/router';
import { ApplicationLevelErrorComponent } from '@app/errors/application-level-error/application-level-error';
import { MainLayoutComponent } from '@app/layout/main-layout/main-layout';
import { authGuard } from '@app/core/guards/auth.guard';

export const routes: Routes = [
  // Public
  {
    path: '',
    loadChildren: () =>
      import('@app/features/securitymain/securitymain.routes').then((m) => m.SECURITY_ROUTES),
  },
  { path: 'applicationlevelerror', component: ApplicationLevelErrorComponent },

  // Private (guarded)
  {
    path: '',
    component: MainLayoutComponent,
    //canActivate: [authGuard],
    data: { formId: 'IsLogin', authRequired: true },
    children: [
      // --- THIS IS THE FIX ---
      // You must lazy-load the dashboard routes here so the
      // router knows what to do with the '/dashboard' path.
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@app/features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      // --- ADD THIS NEW BLOCK ---
      {
        path: 'personnel', // This will be the URL: /personnel
        loadChildren: () =>
          import('@app/features/personnel/personnel.routes').then((m) => m.PERSONNEL_ROUTES),
      },
      // ---------------------

      // ---------- Documents ----------
      {
        path: 'documents',
        children: [
          {
            path: 'request',
            loadComponent: () =>
              import(
                '@app/features/DMS/documents/document-request-management/document-request-management'
              ).then((m) => m.DocumentRequestManagement),
          },
          {
            path: 'my-approvals-request',
            loadComponent: () =>
              import('@app/features/DMS/documents/my-approval-request/my-approval-request').then(
                (m) => m.MyApprovalRequest
              ),
          },
          {
            path: 'create-update',
            loadComponent: () =>
              import(
                '@app/features/DMS/documents/create-update-document/create-update-document'
              ).then((m) => m.CreateUpdateDocument),
          },
          {
            path: 'my-approvals-documents',
            loadComponent: () =>
              import('@app/features/DMS/documents/my-approval-document/my-approval-document').then(
                (m) => m.MyApprovalDocument
              ),
          },
          {
            path: 'sop-training',
            loadComponent: () =>
              import('@app/features/DMS/documents/sopdocument-training/sopdocument-training').then(
                (m) => m.SOPDocumentTraining
              ),
          },
          {
            path: 'authorization-post-training',
            loadComponent: () =>
              import(
                '@app/features/DMS/documents/document-authorization-post-training/document-authorization-post-training'
              ).then((m) => m.DocumentAuthorizationPostTraining),
          },
        ],
      },

      // ---------- Implementation ----------
      {
        path: 'implementation',
        children: [
          {
            path: 'upload-old-documents',
            loadComponent: () =>
              import(
                '@app/features/DMS/implementation/upload-old-documents/upload-old-documents'
              ).then((m) => m.UploadOldDocuments),
          },
        ],
      },

      // ---------- Reports ----------
      {
        path: 'reports',
        children: [
          {
            path: 'view-document',
            loadComponent: () =>
              import('@app/features/DMS/reports/approval-documents/approval-documents').then(
                (m) => m.ApprovalDocuments
              ),
          },
          {
            path: 'personalized-email-alerts',
            loadComponent: () =>
              import(
                '@app/features/DMS/reports/personalized-email-alerts/personalized-email-alerts'
              ).then((m) => m.PersonalizedEmailAlerts),
          },
          {
            path: 'ai-report',
            loadComponent: () =>
              import('@app/features/DMS/reports/aireport/aireport').then((m) => m.AIReport),
          },
          {
            path: 'pending-approval',
            loadComponent: () =>
              import(
                '@app/features/DMS/reports/view-document-pending-approval/view-document-pending-approval'
              ).then((m) => m.ViewDocumentPendingApproval),
          },
        ],
      },

      // ---------- Setups & Configurations ----------
      {
        path: 'setups-configurations',
        children: [
          {
            path: 'cabinet-structure',
            loadComponent: () =>
              import(
                '@app/features/DMS/setup-configuration/cabinet-structure/cabinet-structure'
              ).then((m) => m.CabinetStructure),
          },
          {
            path: 'document-attributes',
            loadComponent: () =>
              import(
                '@app/features/DMS/setup-configuration/document-attributes/document-attributes'
              ).then((m) => m.DocumentAttributes),
          },
          {
            path: 'document-template',
            loadComponent: () =>
              import(
                '@app/features/DMS/setup-configuration/document-template/document-template'
              ).then((m) => m.DocumentTemplate),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('@app/features//DMS/setup-configuration/users/users').then((m) => m.Users),
          },
          {
            path: 'approval-workflow-policy-management',
            loadComponent: () =>
              import(
                '@app/features/DMS/setup-configuration/approval-workflow-policy-management/approval-workflow-policy-management'
              ).then((m) => m.ApprovalWorkflowPolicyManagement),
          },
          {
            path: 'approval-workflow-policy-external-users',
            loadComponent: () =>
              import(
                '@app/features/DMS/setup-configuration/approval-workflow-policy-external-users/approval-workflow-policy-external-users'
              ).then((m) => m.ApprovalWorkflowPolicyExternalUsers),
          },
          {
            path: 'misc-policies',
            loadComponent: () =>
              import('@app/features/DMS/setup-configuration/misc-policies/misc-policies').then(
                (m) => m.MiscPolicies
              ),
          },
          {
            path: 'esignature',
            loadComponent: () =>
              import('@app/features/DMS/setup-configuration/esignature/esignature').then(
                (m) => m.ESignature
              ),
          },
        ],
      },

      // This line is also correct. It makes '/dashboard' the default
      // page for the private (guarded) section.
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // ⬇️ Private 404 (no redirect; preserves original bad URL)
      {
        path: '**',
        loadComponent: () => import('./features/notfound/notfound').then((m) => m.Notfound),
      },
    ],
  },

  // Fallback to a public route to avoid loops
  { path: '**', redirectTo: 'applicationlevelerror' },
];
