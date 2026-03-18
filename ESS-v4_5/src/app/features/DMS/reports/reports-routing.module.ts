import { Routes } from "@angular/router";
import { ViewDocumentPendingApproval } from "./view-document-pending-approval/view-document-pending-approval";
import { PersonalizedEmailAlerts } from "./personalized-email-alerts/personalized-email-alerts";
import { AIReport } from "./aireport/aireport";
import { ApprovalDocuments } from "./approval-documents/approval-documents";

const routes: Routes = [
  { path: 'view-document', component: ApprovalDocuments },
  { path: 'personalized-email-alerts', component: PersonalizedEmailAlerts },
  { path: 'ai-report', component: AIReport }, 
  { path: 'pending-approval', component: ViewDocumentPendingApproval }
];
