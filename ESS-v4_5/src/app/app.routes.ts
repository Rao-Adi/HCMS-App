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
            path: 'request-for-document-creation-update',
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
            path: 'create-update-document',
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
            path: 'uncontrolled-documents',
            loadComponent: () =>
              import(
                '@app/features/DMS/documents/uncontrolled-documents/uncontrolled-documents'
              ).then((m) => m.UncontrolledDocuments),
          },
          {
            path: 'trainingauthorization',
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
          {
            path: 'aggridinlineediting',
            loadComponent: () =>
              import(
                '@app/features/DMS/implementation/aggrid-inline-editing-test/aggrid-inline-editing-test'
              ).then((m) => m.AGGridInlineEditingTest),
          },
          {
            path: 'upload-old-documents-edit',
            loadComponent: () =>
              import(
                '@app/features/DMS/implementation/editable-upload-document/editable-upload-document'
              ).then((m) => m.EditableUploadDocument),
          },
        ],
      },
      // ---------- Reports ----------
      {
        path: 'reports',
        children: [
          {
            path: 'viewapproved',
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
            path: 'pendingapproval',
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
            path: 'trainingpolicy',
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
          {
            path: 'responsibility-transfer-form',
            loadComponent: () =>
              import('@app/features/DMS/setup-configuration/responsibility-transfer-form/responsibility-transfer-form').then(
                (m) => m.ResponsibilityTransferForm
              ),
          },
          {
            path: 'responsibility-transfer-workflow',
            loadComponent: () =>
              import('@app/features/DMS/setup-configuration/responsibility-transfer-workflow/responsibility-transfer-workflow').then(
                (m) => m.ResponsibilityTransferWorkflow
              ),
          },
        ],
      },

      // This line is also correct. It makes '/dashboard' the default
      // page for the private (guarded) section.
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // DataService navigates to '/error' when an API call fails; no such page exists,
      // so send the user back to the dashboard instead of showing a 404.
      { path: 'error', redirectTo: 'dashboard', pathMatch: 'full' },

      // Any address this app has no page for goes to the dashboard instead of a 404.
      //
      // The usual way to land on one is the return address saved when a session ended (login.ts
      // navigates back to it after the next login): it can be a page of another application that
      // shares this browser's storage -- e.g. /lms/learner/course-module, which exists in the ESS
      // portal but not in this build -- as can a stale bookmark or an old notification link. Showing
      // "404 Page not found" straight after a successful login was the wrong answer to all of them.
      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // Fallback to a public route to avoid loops
  { path: '**', redirectTo: 'applicationlevelerror' },
];
