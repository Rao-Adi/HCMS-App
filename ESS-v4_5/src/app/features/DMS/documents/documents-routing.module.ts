import { Routes } from "@angular/router";
import { DocumentRequestManagement } from "./document-request-management/document-request-management";
import { MyApprovalDocument } from "./my-approval-document/my-approval-document";
import { MyApprovalRequest } from "./my-approval-request/my-approval-request";
import { SOPDocumentTraining } from "./sopdocument-training/sopdocument-training";
import { DocumentAuthorizationPostTraining } from "./document-authorization-post-training/document-authorization-post-training";
import { CreateUpdateDocument } from "./create-update-document/create-update-document";

const routes: Routes = [
  { path: 'request', component: DocumentRequestManagement },
  // MyApprovalRequest, not MyApprovalDocument: this path is the Request inbox ("My Approvals –
  // Request for Document Creation/Update") and notification emails link straight to it. The live
  // routing in app.routes.ts already maps it correctly; this legacy NgModule routing file, which
  // nothing imports, was left disagreeing with it and would reintroduce the bug if ever wired up.
  { path: 'my-approvals-request', component: MyApprovalRequest },
  { path: 'create-update-document', component: CreateUpdateDocument },
  { path: 'my-approvals-documents', component: MyApprovalDocument },
  { path: 'sop-training', component: SOPDocumentTraining },
  { path: 'trainingauthorization', component: DocumentAuthorizationPostTraining }
];
