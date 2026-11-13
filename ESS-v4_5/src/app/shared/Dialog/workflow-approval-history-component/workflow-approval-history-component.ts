import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'; 
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { SpinnerComponent } from '@app/shared/spinner/spinner.component';
import { TableSort, nextSort, noSort, searchRows, sortIcon, sortRows } from '@app/shared/utils/table-sort';
import { statusBadgeClass, normalizeStatusLabel } from '@app/shared/utils/document-status';
import { DateTimeLinesPipe } from '@app/shared/utils/date-time-lines';

@Component({
  selector: 'app-workflow-approval-history-component',
  imports: [ReactiveFormsModule, CommonModule, SpinnerComponent, DateTimeLinesPipe],
  templateUrl: './workflow-approval-history-component.html',
  styleUrl: './workflow-approval-history-component.css',
})
export class WorkflowApprovalHistoryComponent {
  // Wording and colour for a decision, both from the one shared source so this modal can never
  // drift from the grids again.
  statusLabel(decision: unknown): string {
    return normalizeStatusLabel(decision) || 'Pending';
  }

  statusClass(decision: unknown): string {
    return statusBadgeClass(this.statusLabel(decision));
  }

  @Input() entityId!: number;
  @Input() entityType!: 'Document' | 'Request';

  workflowHistory: any[] = [];
  loading = false;

  constructor( 
    private _doumentRequestService: DocumentRequestService,
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) public modalData: any,
  ) {}

  ngOnInit(): void { 
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    const entityId = this.modalData.id;
    const entityType = this.modalData.entityType;
    // Segregates the returned steps by the tab (Pending/Approved/Rejected/Reworked) the caller
    // opened this modal from -- see each caller's openWorkflowDeatilsModal/openApprovalHistoryModal.
    const decision = this.modalData.decision;
    this._doumentRequestService.getWorkflowDeatils(entityId, entityType, decision).subscribe({
      next: (response) => {
        if (response && response.Data) { 
          this.workflowHistory = response.Data.map((item: any) => ({
            Id: item.id || item.Id,
            EntityId: item.EntityId ,
            EntityType: item.EntityType,
            StepOrder: item.StepOrder,
            StepType: item.StepType,
            AssignedUserId: item.AssignedUserId,
            EmployeeName: item.EmployeeName,
            EmployeeCode: item.EmployeeCode,
            Decision: item.Decision,
            Observation: item.Observation, 
            ReceivedOn: new CustomDateFormatPipe().transform(
              item.ReceivedOn || item.ReceivedOn || '',
            ),
            StatusUpdatedOn: new CustomDateFormatPipe().transform(
              item.StatusUpdatedOn || item.StatusUpdatedOn || '',
            ),
            IsActive: item.isActive || item.IsActive,
            // Raw time, only for the ordering below (the shown dates are already formatted text).
            _receivedAt: Date.parse(item.ReceivedOn || '') || null,
            _updatedAt: Date.parse(item.StatusUpdatedOn || '') || null,
          }));
          // Chronological: when a document is reverted and approved again a step appears more than once, and the rows used to
          // be grouped by step number (1, 1, 2, 2). The order they happened in is the history -- earliest first. A step that
          // has not been received yet has no time, so it goes last, in step order.
          this.workflowHistory = this.workflowHistory
            .map((row, index) => ({ row, index }))
            .sort((a, b) => {
              const ta = a.row._receivedAt;
              const tb = b.row._receivedAt;
              if (ta !== null && tb !== null && ta !== tb) return ta - tb;
              if ((ta === null) !== (tb === null)) return ta === null ? 1 : -1;
              const ua = a.row._updatedAt;
              const ub = b.row._updatedAt;
              if (ua !== null && ub !== null && ua !== ub) return ua - ub;
              return (a.row.StepOrder ?? 0) - (b.row.StepOrder ?? 0) || a.index - b.index;
            })
            .map((x) => x.row);
        } else {
          this.workflowHistory = [];
        }
        this.loading = false;
      },
      error: (err) => {
        // this._notificationToastService.createNotification(
        //   'error',
        //   'Error',
        //   err?.Message || 'Failed to fetch document details.',
        // );
        this.workflowHistory = [];
        this.loading = false;
      },
    });
  }

  // Click a heading to sort (same behaviour as the Distribution List modal); no sort = the chronological order above.
  sort: TableSort = noSort();

  sortBy(key: string): void {
    this.sort = nextSort(this.sort, key);
  }

  icon(key: string): string {
    return sortIcon(this.sort, key);
  }

  // The standard grid Search box (same look as every grid).
  searchText = '';

  get sortedHistory(): any[] {
    const found = searchRows(this.workflowHistory, this.searchText, (h) =>
      [h.StepOrder, h.EmployeeName, h.ReceivedOn, h.StatusUpdatedOn, this.statusLabel(h.Decision)].join(' '),
    );
    return sortRows(found, this.sort, (row, key) => {
      switch (key) {
        case 'step':
          return row.StepOrder;
        case 'emp':
          return row.EmployeeName;
        case 'received':
          return row._receivedAt;
        case 'updated':
          return row._updatedAt;
        case 'status':
          return this.statusLabel(row.Decision);
      }
      return '';
    });
  }

  close() {
    this.modalRef.close();
  }
}
