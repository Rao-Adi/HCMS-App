import { Routes } from '@angular/router';
import { CabinetStructure } from './cabinet-structure/cabinet-structure';
import { DocumentAttributes } from './document-attributes/document-attributes';
import { DocumentTemplate } from './document-template/document-template';
import { Users } from './users/users';
import { ApprovalWorkflowPolicyManagement } from './approval-workflow-policy-management/approval-workflow-policy-management';
import { ApprovalWorkflowPolicyExternalUsers } from './approval-workflow-policy-external-users/approval-workflow-policy-external-users';
import { MiscPolicies } from './misc-policies/misc-policies';
import { ESignature } from './esignature/esignature';
import { ResponsibilityTransferForm } from './responsibility-transfer-form/responsibility-transfer-form';
import { ResponsibilityTransferWorkflow } from './responsibility-transfer-workflow/responsibility-transfer-workflow';
// const routes: Routes = [
//   {
//     path: '',
//     children: [
//       {
//         path: 'cabinet-structure',
//         loadChildren: () =>
//           import('./cabinet-structure/cabinet-structure')
//             .then(m => m.CabinetStructure)
//       },
//       {
//         path: 'document-attributes',
//         loadChildren: () =>
//           import('./document-attributes/document-attributes.module')
//             .then(m => m.DocumentAttributesModule)
//       }
//     ]
//   }
// ];

const routes: Routes = [
  { path: 'cabinet-structure', component: CabinetStructure },
  { path: 'document-attributes', component: DocumentAttributes },
  { path: 'document-template', component: DocumentTemplate },
  { path: 'users', component: Users },
  { path: 'approval-workflow-policy-management', component: ApprovalWorkflowPolicyManagement },
  {
    path: 'approval-workflow-policy-external-users',
    component: ApprovalWorkflowPolicyExternalUsers,
  },
  {
    path: 'misc-policies',
    component: MiscPolicies,
  },
  {
    path: 'esignature',
    component: ESignature,
  },
   {
    path: 'responsibility-transfer-form',
    component: ResponsibilityTransferForm,
  },
   {
    path: 'responsibility-transfer-workflow',
    component: ResponsibilityTransferWorkflow,
  },
];
