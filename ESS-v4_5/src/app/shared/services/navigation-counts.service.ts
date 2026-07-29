import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DocumentService } from './document.service';
import { DocumentRequestService } from './document-request.service';

export interface InboxCounts {
  pending: number;
  approved: number;
  rejectedOrReverted: number;
}

const EMPTY_INBOX_COUNTS: InboxCounts = { pending: 0, approved: 0, rejectedOrReverted: 0 };

/**
 * Single source of truth for every sidebar-menu badge count.
 *
 * Previously each of main-layout.ts, my-approval-request.ts and my-approval-document.ts
 * independently called the same backend count endpoints. Two independent calls hitting
 * the same menu item (e.g. after an approve/reject action) could resolve out of order and
 * leave the sidebar badge showing a stale count. Routing every fetch through here means
 * there is exactly one in-flight request per count and exactly one place that owns the
 * result, so every subscriber (sidebar menu, page tab badges) always agrees.
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationCountsService {
  // "Request for Document Creation/Update" menu badge
  private _documentCreationRequestCount$ = new BehaviorSubject<number>(0);
  readonly documentCreationRequestCount$ = this._documentCreationRequestCount$.asObservable();

  // "My Approvals - Documents" menu badge + my-approval-document.ts tab badges
  private _myDocumentApprovalCounts$ = new BehaviorSubject<InboxCounts>(EMPTY_INBOX_COUNTS);
  readonly myDocumentApprovalCounts$ = this._myDocumentApprovalCounts$.asObservable();

  // "My Approvals - Request" menu badge + my-approval-request.ts tab badges
  private _myRequestApprovalCounts$ = new BehaviorSubject<InboxCounts>(EMPTY_INBOX_COUNTS);
  readonly myRequestApprovalCounts$ = this._myRequestApprovalCounts$.asObservable();

  // "Training Authorization" menu badge
  private _trainingAuthorizationCount$ = new BehaviorSubject<number>(0);
  readonly trainingAuthorizationCount$ = this._trainingAuthorizationCount$.asObservable();

  constructor(
    private _documentService: DocumentService,
    private _documentRequestService: DocumentRequestService,
  ) {}

  /** Refreshes every count. Used on app init and on route/menu navigation. */
  refreshAll(): void {
    this.refreshDocumentCreationRequestCount();
    this.refreshMyDocumentApprovalCounts();
    this.refreshMyRequestApprovalCounts();
    this.refreshTrainingAuthorizationCount();
  }

  refreshDocumentCreationRequestCount(): void {
    this._documentRequestService.getMyDocumentRequestForApprovalCount().subscribe({
      next: (response) => {
        if (response?.Data) {
          const count = (response.Data.count ?? response.Data.Count) ?? 0;
          this._documentCreationRequestCount$.next(count);
        }
      },
      error: (err) => console.error('Failed to get request approval count', err),
    });
  }

  refreshMyDocumentApprovalCounts(): void {
    this._documentService.GetMyDocumentCounts().subscribe({
      next: (response) => {
        const myInbox = response?.Data?.MyInbox;
        if (myInbox) {
          this._myDocumentApprovalCounts$.next({
            pending: myInbox.pending ?? myInbox.Pending ?? 0,
            approved: myInbox.approved ?? myInbox.Approved ?? 0,
            rejectedOrReverted: myInbox.rejectedorreverted ?? myInbox.RejectedOrReverted ?? 0,
          });
        }
      },
      error: (err) => console.error('Failed to get document counts', err),
    });
  }

  refreshMyRequestApprovalCounts(): void {
    this._documentRequestService.GetMyRequestCounts().subscribe({
      next: (response) => {
        const myInbox = response?.Data?.MyInbox;
        if (myInbox) {
          this._myRequestApprovalCounts$.next({
            pending: myInbox.pending ?? myInbox.Pending ?? 0,
            approved: myInbox.approved ?? myInbox.Approved ?? 0,
            rejectedOrReverted: myInbox.rejectedorreverted ?? myInbox.RejectedOrReverted ?? 0,
          });
        }
      },
      error: (err) => console.error('Failed to get request counts', err),
    });
  }

  refreshTrainingAuthorizationCount(): void {
    const payload = {
      divisionCode: null,
      departmentCode: null,
      subDepartmentCode: null,
      businessDomainCode: null,
      documentTypeCode: null,
      documentcategoryfilter: 1,
      searchText: '',
      isActive: true,
    };

    this._documentService.GetPendingAuthorizationCount(payload).subscribe({
      next: (response) => {
        if (response?.Data) {
          const count = (response.Data.PendingCount ?? response.Data.pendingCount) ?? 0;
          this._trainingAuthorizationCount$.next(count);
        }
      },
      error: (err) => console.error('Failed to get training authorization counts', err),
    });
  }
}
