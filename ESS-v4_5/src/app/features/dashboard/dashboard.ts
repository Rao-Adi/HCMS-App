import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- 1. Import FormsModule
import { UtilitiesService } from '@app/core/services/utilities.service';
import { DashboardService } from '@app/shared/services/dashboard.service';
import { Router } from '@angular/router'; 
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

interface MetricCard {
  label: string;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  icon: string;
  value: () => number;
  go: () => void;
}
interface MetricGroup {
  title: string;
  visible: () => boolean;
  cards: MetricCard[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // <-- 2. Add FormsModule here
    NzModalModule,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  EmpName: string = '';
  welcomeMessage: string = '';

  loginEmpId: string = '';
  summary: any = {};
  documentDistribution: any[] = [];
  pendingTasks: any[] = [];
  recentActivities: any[] = [];
  documentsApproachingReview: any[] = [];
  isLoading: boolean = true;
  // The dashboard request failed (session expired, API unreachable, server error). Without this the
  // screen fell back to the same empty summary a user with no data sees, so a failed load looked like a
  // blank dashboard.
  loadError: boolean = false;
  isApprover: boolean = false;
  isInitiator: boolean = false;
  isAuthorizer: boolean = false;

  // One flag per summary group: shown only to a user who has the right to view the form the group stands for (the same
  // form ids the pages themselves check), so a user without access to a form does not see its group.
  canSeeMyRequests = false;
  canSeeMyRequestApprovals = false;
  canSeeMyDocuments = false;
  canSeeMyDocumentApprovals = false;
  canSeeAuthorization = false;
  canSeeSopTraining = false;

  constructor(
    private _utilityService: UtilitiesService,
    private _dashboardService: DashboardService,
    private router: Router,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.EmpName = this._utilityService.GetEmpName() || '';
    this.welcomeMessage = `Welcome back, ${this.EmpName}!`;
    this.GetLoginEmpId();
    this.checkUserRoles();
  }

  checkUserRoles(): void {
    this._utilityService.CanView('requestdocumentcreation').subscribe((res) => (this.canSeeMyRequests = !!res));
    this._utilityService.CanView('myapprovalrequest').subscribe((res) => (this.canSeeMyRequestApprovals = !!res));
    this._utilityService.CanView('uploadorcreate').subscribe((res) => (this.canSeeMyDocuments = !!res));
    this._utilityService.CanView('myapprovals').subscribe((res) => (this.canSeeMyDocumentApprovals = !!res));
    this._utilityService.CanView('trainingauthorization').subscribe((res) => (this.canSeeAuthorization = !!res));
    this._utilityService.CanView('trainingsop').subscribe((res) => (this.canSeeSopTraining = !!res));

    this._utilityService.CanView('myapprovalrequest').subscribe((res) => {
      this.isApprover = res;
    });
    this._utilityService.CanView('requestdocumentcreation').subscribe((res) => {
      this.isInitiator = res;
    });
    // Gates the "Pending Auth." card -- same formId as the Training Authorization page
    // (document-authorization-post-training.ts) it links to. Previously this card had no
    // role gate at all, so it showed the same company-wide number to every user regardless
    // of whether they have any authorization responsibility.
    this._utilityService.CanView('trainingauthorization').subscribe((res) => {
      this.isAuthorizer = res;
    });
  }

  GetLoginEmpId() {
    this.loginEmpId = localStorage.getItem('HRISEmpId') || '';
    this.GetDashbaordData();
  }

  GetDashbaordData() {
    this.isLoading = true;
    this.loadError = false;
    this._dashboardService.GetDashboardData().subscribe({
      next: (res: any) => {
        if (res?.Success && res?.Data) {
          this.summary = res.Data.Summary || {};
          this.documentDistribution = res.Data.DocumentTypeDistribution || [];
          this.pendingTasks = (res.Data.ImmediatePendingTasks || []).map((task: any) => ({
            ...task,
            TaskName: task.Title,
            DueDate: task.AssignedDate,
            EntityType : task.EntityType
          }));
          this.recentActivities = res.Data.RecentActivities || [];
          this.documentsApproachingReview = res.Data.DocumentsApproachingReview || [];
        } else {
          this.loadError = true;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard data:', err);
        this.loadError = true;
        this.isLoading = false;
      },
    });
  }

  // Gates the "Pending Auth." and "Total Approved Documents" cards below their existing
  // isAuthorizer/isInitiator permission checks -- those only confirm the user has *rights* to
  // those forms, not that they've actually created anything. An Approver who also happens to
  // hold Initiator/Authorizer rights but has never created a document or request would
  // otherwise see these creator-scoped cards sitting at a meaningless 0.
  get hasCreatedContent(): boolean {
    return (this.summary?.MyTotalDocuments || 0) > 0 || (this.summary?.MyTotalRequests || 0) > 0;
  }

  rowHasVisibleGroup(row: MetricGroup[]): boolean {
    return row.some((g) => g.visible());
  }

  // The summary cards, laid out as the dashboard design shows them: two groups per row.
  // Existing destinations are kept; only the grouping and the four-way split are new.
  get metricRows(): MetricGroup[][] {
    const s = () => this.summary || {};
    const n = (k: string) => () => s()[k] || 0;
    const to = (url: string, q?: any) => () => this.navigateTo(url, q);
    return [
      [
        {
          title: 'My Requests',
          visible: () => this.canSeeMyRequests,
          cards: [
            { label: 'Pending', color: 'blue', icon: 'bi-file-earmark-text', value: n('MyPendingRequests'), go: to('/documents/request-for-document-creation-update', { tab: 'MyRequestPendingApproval' }) },
            { label: 'Approved', color: 'green', icon: 'bi-check-circle', value: n('MyApprovedRequests'), go: () => this.navigateToWidget('approved-requests') },
            { label: 'Rejected', color: 'red', icon: 'bi-x-circle', value: n('MyRejectedRequests'), go: () => this.navigateToWidget('rejected-requests') },
            { label: 'Reverted', color: 'amber', icon: 'bi-arrow-repeat', value: n('MyRevertedRequests'), go: to('/documents/request-for-document-creation-update', { tab: 'DraftRequest' }) },
          ],
        },
        {
          title: 'My Requests (Approvals)',
          visible: () => this.canSeeMyRequestApprovals,
          cards: [
            { label: 'Pending for My Approval', color: 'blue', icon: 'bi-person', value: n('PendingRequestApprovals'), go: to('/documents/my-approvals-request') },
            { label: 'Approved by Me', color: 'green', icon: 'bi-check-circle', value: n('RequestsApprovedByMe'), go: to('/documents/my-approvals-request', { tab: 'Approved' }) },
            { label: 'Rejected by Me', color: 'red', icon: 'bi-x-circle', value: n('RequestsRejectedByMe'), go: to('/documents/my-approvals-request', { tab: 'Rejected' }) },
            { label: 'Reverted by Me', color: 'amber', icon: 'bi-arrow-repeat', value: n('RequestsRevertedByMe'), go: to('/documents/my-approvals-request', { tab: 'Rejected' }) },
          ],
        },
      ],
      [
        {
          title: 'My Documents',
          visible: () => this.canSeeMyDocuments,
          cards: [
            { label: 'Pending', color: 'blue', icon: 'bi-file-earmark-text', value: n('MyDocumentsPending'), go: to('/documents/create-update-document') },
            { label: 'Approved', color: 'green', icon: 'bi-check-circle', value: n('MyDocumentsApproved'), go: to('/reports/viewapproved') },
            { label: 'Rejected', color: 'red', icon: 'bi-x-circle', value: n('MyDocumentsRejected'), go: to('/documents/create-update-document') },
            { label: 'Reverted', color: 'amber', icon: 'bi-arrow-repeat', value: n('MyDocumentsReverted'), go: to('/documents/create-update-document') },
          ],
        },
        {
          title: 'My Documents (Approvals)',
          visible: () => this.canSeeMyDocumentApprovals,
          cards: [
            { label: 'Pending for My Approval', color: 'blue', icon: 'bi-person', value: n('PendingDocumentApprovals'), go: to('/documents/my-approvals-documents') },
            { label: 'Approved by Me', color: 'green', icon: 'bi-check-circle', value: n('DocumentsApprovedByMe'), go: to('/documents/my-approvals-documents', { tab: 'Approved' }) },
            { label: 'Rejected by Me', color: 'red', icon: 'bi-x-circle', value: n('DocumentsRejectedByMe'), go: to('/documents/my-approvals-documents', { tab: 'Rejected' }) },
            { label: 'Reverted by Me', color: 'amber', icon: 'bi-arrow-repeat', value: n('DocumentsRevertedByMe'), go: to('/documents/my-approvals-documents', { tab: 'Rejected' }) },
          ],
        },
      ],
      [
        {
          title: 'Authorization',
          visible: () => this.canSeeAuthorization,
          cards: [
            { label: 'Pending Authorized Documents', color: 'blue', icon: 'bi-shield', value: n('PendingAuthorizations'), go: to('/documents/trainingauthorization') },
            { label: 'Authorized Documents', color: 'green', icon: 'bi-shield-check', value: n('MyApprovedDocuments'), go: to('/reports/viewapproved') },
          ],
        },
        {
          title: 'Training for SOP Documents',
          visible: () => this.canSeeSopTraining,
          cards: [
            { label: 'Pending Approval for Training', color: 'purple', icon: 'bi-mortarboard', value: n('PendingTrainings'), go: to('/documents/sop-training') },
          ],
        },
      ],
    ];
  }

  calculatePercentage(count: number): number {
    const total = this.documentDistribution.reduce((sum, d) => sum + (d?.Count || 0), 0);
    if (!total) return 0;
    return (count / total) * 100;
  }

  // --- Hardcoded data for your presentation ---

  // Data for Widget 1: Leave Balances
  leaveBalances = [
    { type: 'Annual', days: 15.5, color: '#005f9e' },
    { type: 'Sick', days: 8, color: '#e67e22' },
    { type: 'Personal', days: 2, color: '#27ae60' },
  ];

  // Data for Widget 2: Action Items
  actionItems = [
    { id: 1, text: 'Approve timesheet for J. Smith', type: 'Approval' },
    { id: 2, text: 'Complete "New Security Policy" training', type: 'Training' },
    { id: 3, text: 'Sign your annual performance review', type: 'Task' },
  ];

  // Data for Widget 3: Quick Links
  quickLinks = [
    { name: 'View My Payslip', icon: '📄' }, // Using emojis for icons
    { name: 'Request Time Off', icon: '✈️' },
    { name: 'Update Personal Info', icon: '👤' },
    { name: 'My Benefits', icon: '❤️' },
  ];

  // --- Click Handlers (for demo) ---

  onActionClick(item: any) { 
    if (item === 'Request') {
      this.router.navigate(['documents/my-approvals-request']); // Adjust to your actual route path
    } else {
      this.router.navigate(['documents/my-approvals-documents']); // Adjust to your actual route path
    }
  }

  onLinkClick(linkName: string) {
    this.modal.info({
      nzTitle: 'Not Available',
      nzContent: 'This would navigate to the "' + linkName + '" page.',
    });
  }

  navigateTo(url: string, queryParams?: any): void {
    this.router.navigate([url], { queryParams: queryParams });
  }

  navigateToWidget(type: 'total-documents' | 'pending-approvals' | 'approved-requests' | 'rejected-requests' | 'approved-by-me' | 'rejected-by-me'): void {
    if (this.isApprover) {
      if (type === 'total-documents') {
        this.navigateTo('/documents/my-approvals-documents');
      } else if (type === 'pending-approvals') {
        this.navigateTo('/documents/my-approvals-request');
      } else if (type === 'approved-requests' || type === 'approved-by-me') {
        this.navigateTo('/documents/my-approvals-request', { tab: 'Approved' });
      } else if (type === 'rejected-requests' || type === 'rejected-by-me') {
        this.navigateTo('/documents/my-approvals-request', { tab: 'Rejected' });
      }
    } else {
      // Initiator redirection
      if (type === 'total-documents') {
        this.navigateTo('/reports/viewapproved');
      } else if (type === 'pending-approvals') {
        this.navigateTo('/documents/request-for-document-creation-update', { tab: 'MyRequestPendingApproval' });
      } else if (type === 'approved-requests' || type === 'approved-by-me') {
        this.navigateTo('/reports/viewapproved');
      } else if (type === 'rejected-requests' || type === 'rejected-by-me') {
        this.navigateTo('/documents/request-for-document-creation-update', { tab: 'DraftRequest' });
      }
    }
  }
}
