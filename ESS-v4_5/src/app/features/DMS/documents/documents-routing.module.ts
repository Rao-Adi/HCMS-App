import { Routes } from "@angular/router";
import { DocumentRequestManagement } from "./document-request-management/document-request-management";
import { MyApprovalDocument } from "./my-approval-document/my-approval-document";
import { SOPDocumentTraining } from "./sopdocument-training/sopdocument-training";
import { DocumentAuthorizationPostTraining } from "./document-authorization-post-training/document-authorization-post-training";

const routes: Routes = [
  { path: 'request', component: DocumentRequestManagement },
  { path: 'my-approvals-request', component: MyApprovalDocument },
  { path: 'create-update', component: DocumentRequestManagement },
  { path: 'my-approvals-documents', component: MyApprovalDocument },
  { path: 'sop-training', component: SOPDocumentTraining },
  { path: 'authorization-post-training', component: DocumentAuthorizationPostTraining }
];
