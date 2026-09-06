import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- 1. Import FormsModule
import { UtilitiesService } from '@app/core/services/utilities.service';
import { DashboardService } from '@app/shared/services/dashboard.service';
import { Router } from '@angular/router'; 
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

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
  isApprover: boolean = false;
  isInitiator: boolean = false;
  isAuthorizer: boolean = false;

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
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard data:', err);
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
