import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, catchError, debounceTime, switchMap } from 'rxjs';
import { DocumentService } from './document.service';
import { DocumentRequestService } from './document-request.service';
import { ResponsibilityTransferService } from './responsibility-transfer.service';

export interface InboxCounts {
  pending: number;
  approved: number;
  rejectedOrReverted: number;
}

const EMPTY_INBOX_COUNTS: InboxCounts = { pending: 0, approved: 0, rejectedOrReverted: 0 };

export interface TrainingPendingCounts {
  classroom: number;
  online: number;
  total: number;
}

const EMPTY_TRAINING_PENDING_COUNTS: TrainingPendingCounts = { classroom: 0, online: 0, total: 0 };

/** How long refresh requests are gathered before one round of fetches goes out. See pipeline(). */
const COALESCE_WINDOW_MS = 250;

/**
 * Single source of truth for every sidebar-menu badge count.
 *
 * Previously each of main-layout.ts, my-approval-request.ts and my-approval-document.ts
 * independently called the same backend count endpoints. Two independent calls hitting
 * the same menu item (e.g. after an approve/reject action) could resolve out of order and
 * leave the sidebar badge showing a stale count. Routing every fetch through here means
 * there is exactly one in-flight request per count and exactly one place that owns the
 * result, so every subscriber (sidebar menu, page tab badges) always agrees.
 *
 * Two things make that guarantee hold rather than just being the intention:
 *
 *   * Each count has its own pipeline built on switchMap, so a newer refresh CANCELS the
 *     request still in flight for that same count. Without it, "one place owns the result"
 *     still allowed an older response to land last and overwrite a newer one -- exactly the
 *     staleness this class was created to stop.
 *   * The error handler sits INSIDE the inner observable. An error on the outer stream would
 *     complete the pipeline permanently, so one failed count request would silently stop that
 *     badge from ever updating again for the rest of the session.
 *
 * The subscriptions below are never torn down. That is correct here and not a leak: the service
 * is providedIn 'root', so it lives exactly as long as the application does.
 *
 * WHAT DOES NOT BELONG HERE
 *
 * Every count fetched here is unfiltered and company-wide, because that is what a sidebar badge
 * means. Two screens count the same records under THEIR OWN cabinet/document-type filters, and
 * those deliberately stay on the page:
 *
 *   * sopdocument-training.ts — Class Room / Online tab badges
 *   * document-authorization-post-training.ts — Pending / Authorized / Rejected tab badges
 *
 * They were centralised here once and it produced the mismatch users actually reported: with the
 * SOP document type selected, the badge read 5 (every pending document, all types) while the grid
 * below it read "1 to 3 of 3". The badge was not wrong about the system — it was answering a
 * different question than the grid beside it. A badge that counts something the user cannot see on
 * screen is worse than one that is a moment out of date, so a filtered count stays with the filter
 * that produced it.
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

  // "Training for SOP Documents" menu badge + sopdocument-training.ts's Classroom/Online tab badges
  private _documentsPendingTrainingCounts$ = new BehaviorSubject<TrainingPendingCounts>(
    EMPTY_TRAINING_PENDING_COUNTS,
  );
  readonly documentsPendingTrainingCounts$ = this._documentsPendingTrainingCounts$.asObservable();

  // "Responsibilities Transfer" menu badge + responsibility-transfer-form.ts's
  // "Requests pending My Approval" tab badge. Deliberately scoped to ApproverId only -- a user's
  // own submitted requests are a separate concern (see responsibility-transfer-form.ts, which
  // fetches that count directly since there's no corresponding sidebar item for it).
  private _responsibilityTransferApprovalCounts$ = new BehaviorSubject<InboxCounts>(EMPTY_INBOX_COUNTS);
  readonly responsibilityTransferApprovalCounts$ =
    this._responsibilityTransferApprovalCounts$.asObservable();

  // ---------------------------------------------------------------------------------------
  // Page tab badges. These have no sidebar menu item of their own, but they count the same
  // work and go stale in the same way, so they are fetched here too rather than by each page.
  // ---------------------------------------------------------------------------------------

  // create-update-document.ts — "My Documents" tab badge
  private _myDocumentsTotalCount$ = new BehaviorSubject<number>(0);
  readonly myDocumentsTotalCount$ = this._myDocumentsTotalCount$.asObservable();

  // create-update-document.ts — "Document Draft" tab badge
  private _myDraftDocumentsCount$ = new BehaviorSubject<number>(0);
  readonly myDraftDocumentsCount$ = this._myDraftDocumentsCount$.asObservable();

  // document-request-management.ts — "Draft/Reverted Requests" tab badge
  private _draftRequestCount$ = new BehaviorSubject<number>(0);
  readonly draftRequestCount$ = this._draftRequestCount$.asObservable();

  // document-request-management.ts — "My Requests" tab badge
  private _myTotalRequestCount$ = new BehaviorSubject<number>(0);
  readonly myTotalRequestCount$ = this._myTotalRequestCount$.asObservable();

  // responsibility-transfer-form.ts — "My Submitted Requests" tab badge
  private _mySubmittedTransferCount$ = new BehaviorSubject<number>(0);
  readonly mySubmittedTransferCount$ = this._mySubmittedTransferCount$.asObservable();

  /** Named in console errors so a badge that failed to refresh can be traced to what caused it. */
  private _lastAction = 'startup';

  // One trigger per count. Pushing into these is what starts a fetch; see refreshAll below.
  private readonly _documentCreationRequestTrigger: Subject<void>;
  private readonly _myDocumentApprovalTrigger: Subject<void>;
  private readonly _myRequestApprovalTrigger: Subject<void>;
  private readonly _trainingAuthorizationTrigger: Subject<void>;
  private readonly _documentsPendingTrainingTrigger: Subject<void>;
  private readonly _responsibilityTransferApprovalTrigger: Subject<void>;
  private readonly _myDocumentsTotalTrigger: Subject<void>;
  private readonly _myDraftDocumentsTrigger: Subject<void>;
  private readonly _draftRequestTrigger: Subject<void>;
  private readonly _myTotalRequestTrigger: Subject<void>;
  private readonly _mySubmittedTransferTrigger: Subject<void>;

  constructor(
    private _documentService: DocumentService,
    private _documentRequestService: DocumentRequestService,
    private _responsibilityTransferService: ResponsibilityTransferService,
  ) {
    this._documentCreationRequestTrigger = this.pipeline(
      'request approval count',
      () => this._documentRequestService.getMyDocumentRequestForApprovalCount(),
      (response) => {
        if (!response?.Data) return undefined;
        return (response.Data.count ?? response.Data.Count) ?? 0;
      },
      this._documentCreationRequestCount$,
    );

    this._myDocumentApprovalTrigger = this.pipeline(
      'document counts',
      () => this._documentService.GetMyDocumentCounts(),
      (response) => this.toInboxCounts(response?.Data?.MyInbox),
      this._myDocumentApprovalCounts$,
    );

    this._myRequestApprovalTrigger = this.pipeline(
      'request counts',
      () => this._documentRequestService.GetMyRequestCounts(),
      (response) => this.toInboxCounts(response?.Data?.MyInbox),
      this._myRequestApprovalCounts$,
    );

    this._trainingAuthorizationTrigger = this.pipeline(
      'training authorization counts',
      () =>
        this._documentService.GetPendingAuthorizationCount({
          divisionCode: null,
          departmentCode: null,
          subDepartmentCode: null,
          businessDomainCode: null,
          documentTypeCode: null,
          documentcategoryfilter: 1,
          searchText: '',
          isActive: true,
        }),
      (response) => {
        if (!response?.Data) return undefined;
        return (response.Data.PendingCount ?? response.Data.pendingCount) ?? 0;
      },
      this._trainingAuthorizationCount$,
    );

    this._documentsPendingTrainingTrigger = this.pipeline(
      'documents pending training count',
      // Uses the combined-counts endpoint (not GetDocumentsPendingTrainingCount, which requires a
      // Classroom/Online Requeststatus to mean anything) so one fetch covers both modes -- the
      // sidebar badge uses .total, sopdocument-training.ts's own tab badges use .classroom/.online.
      () => this._documentService.GetDocumentsPendingTrainingCounts({}),
      (response) => {
        if (!response?.Success || !response.Data) return undefined;
        const data = response.Data;
        return {
          classroom: Number(data.ClassroomCount ?? data.classroomCount) || 0,
          online: Number(data.OnlineCount ?? data.onlineCount) || 0,
          total: Number(data.TotalCount ?? data.totalCount) || 0,
        };
      },
      this._documentsPendingTrainingCounts$,
    );

    this._responsibilityTransferApprovalTrigger = this.pipeline(
      'responsibility transfer approval counts',
      () => this._responsibilityTransferService.GetMyResponsibilityTransfersApprovalsCount(),
      (response) => {
        if (!response?.Success || !response.Data) return undefined;
        const data = response.Data;
        const rejected = Number(data.RejectedCount ?? data.rejectedCount) || 0;
        const reverted = Number(data.RevertedCount ?? data.revertedCount) || 0;
        return {
          pending: Number(data.PendingCount ?? data.pendingCount) || 0,
          approved: Number(data.ApprovedCount ?? data.approvedCount) || 0,
          rejectedOrReverted: rejected + reverted,
        };
      },
      this._responsibilityTransferApprovalCounts$,
    );

    this._myDocumentsTotalTrigger = this.pipeline(
      'my documents count',
      () => this._documentService.getMyDocumentsTotalCount(),
      (response) => (response?.Success ? (response.Data ?? 0) : undefined),
      this._myDocumentsTotalCount$,
    );

    this._myDraftDocumentsTrigger = this.pipeline(
      'my draft documents count',
      () => this._documentService.getMyDraftDocumentsCount(),
      (response) => (response?.Success ? (response.Data ?? 0) : undefined),
      this._myDraftDocumentsCount$,
    );

    this._draftRequestTrigger = this.pipeline(
      'draft request count',
      () => this._documentRequestService.getDraftDocumentCount(),
      (response) => (response?.Data ? (response.Data.count ?? 0) : undefined),
      this._draftRequestCount$,
    );

    this._myTotalRequestTrigger = this.pipeline(
      'my total request count',
      () => this._documentRequestService.getMyTotalRequestCount(),
      (response) => (response?.Success ? (response.Data ?? 0) : undefined),
      this._myTotalRequestCount$,
    );

    this._mySubmittedTransferTrigger = this.pipeline(
      'my submitted transfer count',
      () => this._responsibilityTransferService.GetMySubmittedResponsibilityTransfersCount(),
      (response) => {
        if (!response?.Success || !response.Data) return undefined;
        return Number(response.Data.PendingCount ?? response.Data.pendingCount) || 0;
      },
      this._mySubmittedTransferCount$,
    );
  }

  /**
   * The one call every DMS action makes when it succeeds.
   *
   * Create, Submit, Save as Draft, Approve, Reject, Revert, Authorize, Acknowledge — any of them
   * can move a document between the lists the badges count, and often between lists on screens the
   * user is not looking at. Approving a document, for instance, can empty one approval inbox and
   * fill a training queue at the same time. Refreshing only the count belonging to the screen that
   * performed the action is what left the other badges stale until the next navigation, so this
   * deliberately refreshes all of them rather than trying to work out which ones moved: guessing
   * the blast radius of a workflow transition in the UI would mean re-implementing the workflow.
   *
   * Safe to call on every action. Six small count requests cost far less than a wrong badge, and a
   * second call landing on top of the first cancels it rather than racing it.
   *
   * @param action What just happened, e.g. 'Document Approved'. Only used to name the action in the
   *               console if one of the refreshes fails.
   */
  refreshAfterAction(action: string): void {
    this._lastAction = action || 'action';
    this.refreshAll();
  }

  /** Refreshes every count. Used on app init and on route/menu navigation. */
  refreshAll(): void {
    this.refreshDocumentCreationRequestCount();
    this.refreshMyDocumentApprovalCounts();
    this.refreshMyRequestApprovalCounts();
    this.refreshTrainingAuthorizationCount();
    this.refreshDocumentsPendingTrainingCounts();
    this.refreshResponsibilityTransferApprovalCounts();
    this.refreshMyDocumentsTotalCount();
    this.refreshMyDraftDocumentsCount();
    this.refreshDraftRequestCount();
    this.refreshMyTotalRequestCount();
    this.refreshMySubmittedTransferCount();
  }

  refreshDocumentCreationRequestCount(): void {
    this._documentCreationRequestTrigger.next();
  }

  refreshMyDocumentApprovalCounts(): void {
    this._myDocumentApprovalTrigger.next();
  }

  refreshMyRequestApprovalCounts(): void {
    this._myRequestApprovalTrigger.next();
  }

  refreshTrainingAuthorizationCount(): void {
    this._trainingAuthorizationTrigger.next();
  }

  refreshDocumentsPendingTrainingCounts(): void {
    this._documentsPendingTrainingTrigger.next();
  }

  refreshResponsibilityTransferApprovalCounts(): void {
    this._responsibilityTransferApprovalTrigger.next();
  }

  refreshMyDocumentsTotalCount(): void {
    this._myDocumentsTotalTrigger.next();
  }

  refreshMyDraftDocumentsCount(): void {
    this._myDraftDocumentsTrigger.next();
  }

  refreshDraftRequestCount(): void {
    this._draftRequestTrigger.next();
  }

  refreshMyTotalRequestCount(): void {
    this._myTotalRequestTrigger.next();
  }

  refreshMySubmittedTransferCount(): void {
    this._mySubmittedTransferTrigger.next();
  }

  /**
   * Builds one count's fetch pipeline.
   *
   * `read` returning undefined means "the response did not carry this count" — the previous value
   * is kept rather than being overwritten with a zero, so a malformed or partial response never
   * blanks a badge that was showing the right number a moment ago.
   */
  private pipeline<T>(
    label: string,
    fetch: () => Observable<any>,
    read: (response: any) => T | undefined,
    target: BehaviorSubject<T>,
  ): Subject<void> {
    const trigger = new Subject<void>();

    trigger
      .pipe(
        // Collapses refreshes that arrive together into one round of requests.
        //
        // Several things legitimately ask for the same refresh at almost the same moment: the
        // action itself, main-layout's refreshCounts$ subscription, and the SignalR notification
        // the server sends for that same action. Without this, each one started its own six
        // requests and switchMap cancelled the previous batch mid-flight -- correct counts, but
        // twelve requests per action and a wall of red cancelled rows in the network tab.
        //
        // 250ms is long enough to absorb those (they land within a tick or two of each other) and
        // short enough that nobody perceives the badge updating late.
        debounceTime(COALESCE_WINDOW_MS),
        switchMap(() =>
          fetch().pipe(
            // Inside, not outside: an error reaching the outer stream would complete this
            // pipeline for good and freeze the badge for the rest of the session.
            catchError((err) => {
              console.error(`Failed to refresh ${label} after ${this._lastAction}`, err);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe((response) => {
        const value = read(response);
        if (value !== undefined) {
          target.next(value);
        }
      });

    return trigger;
  }

  private toInboxCounts(myInbox: any): InboxCounts | undefined {
    if (!myInbox) return undefined;
    return {
      pending: myInbox.pending ?? myInbox.Pending ?? 0,
      approved: myInbox.approved ?? myInbox.Approved ?? 0,
      rejectedOrReverted: myInbox.rejectedorreverted ?? myInbox.RejectedOrReverted ?? 0,
    };
  }
}
