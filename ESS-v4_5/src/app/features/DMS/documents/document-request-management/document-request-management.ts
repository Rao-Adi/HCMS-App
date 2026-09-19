import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NavigationCountsService } from '@app/shared/services/navigation-counts.service';
import { ActivatedRoute } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { PendingRequestForApproval } from './pending-request-for-approval/pending-request-for-approval';
import { DocumentRequestForm } from './document-request-form/document-request-form';
import { DraftRequestList } from './draft-request-list/draft-request-list';
import { MyTotalRequests } from './my-total-requests/my-total-requests';
@Component({
  selector: 'app-document-request-management',
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    NzInputModule,
    NzModalModule,
    PendingRequestForApproval,
    DocumentRequestForm,
    DraftRequestList,
    MyTotalRequests,
  ],
  templateUrl: './document-request-management.html',
  styleUrl: './document-request-management.css',
})
export class DocumentRequestManagement implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  selectedTab: string = 'NewRequest';
  draftDocumentCounts: number = 0;
  myDocumentRequestPendingForApprovalCount: number = 0;
  myTotalRequestCount: number = 0;

  
  constructor(
    private route: ActivatedRoute,
    private _navigationCountsService: NavigationCountsService,
  ) {}

  ngOnInit() {
    // All three badges read the shared count state instead of fetching their own. The
    // approval count in particular is the same number the sidebar shows, so fetching it
    // twice was two answers to one question.
    this.subscriptions.push(
      this._navigationCountsService.draftRequestCount$.subscribe((count) => {
        this.draftDocumentCounts = count;
      }),
      this._navigationCountsService.documentCreationRequestCount$.subscribe((count) => {
        this.myDocumentRequestPendingForApprovalCount = count;
      }),
      this._navigationCountsService.myTotalRequestCount$.subscribe((count) => {
        this.myTotalRequestCount = count;
      }),
    );

    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
    });
    this.getDocumentRequestCounts();
    this.getMyDocumentRequestForApprovalCount();
    this.getMyTotalRequestCount();
  }

  getDocumentRequestCounts() {
    this._navigationCountsService.refreshDraftRequestCount();
  }

  getMyDocumentRequestForApprovalCount() {
    this._navigationCountsService.refreshDocumentCreationRequestCount();
  }

  getMyTotalRequestCount() {
    this._navigationCountsService.refreshMyTotalRequestCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onRequestCreated(): void {
    this.getDocumentRequestCounts();
    this.getMyDocumentRequestForApprovalCount();
    this.getMyTotalRequestCount();
  }

  // Keeps the pill-shaped tab badges from stretching wide for large counts.
  formatBadgeCount(count: number): string {
    return count > 999 ? '999+' : String(count);
  }
}
