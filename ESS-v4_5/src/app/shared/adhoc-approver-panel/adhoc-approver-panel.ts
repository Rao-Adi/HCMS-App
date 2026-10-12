import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '@app/shared/services/document.service';
import { EmployeeList } from '@app/shared/Dropdowns/employee-list/employee-list';
import { NotificationToastService } from '@app/shared/notification/notification.service';

// One row of the remaining approval sequence shown when the approver may add an ad-hoc approver.
interface SequenceRow {
  key: string;
  stepId?: number; // existing step; absent for an ad-hoc approver added here
  employeeCode: string;
  name: string;
  designation: string;
  isCurrent: boolean; // the person approving -- always first, never moved
  isAdHoc: boolean; // an ad-hoc approver already on the workflow
  isNew: boolean; // added here -- the only rows that can be moved or removed
}

export interface AdHocPlacement {
  EmployeeCode: string;
  InsertAfterStepId: number;
}

/**
 * "Add an ad-hoc approver" for the approver the document is currently with. Renders nothing unless the
 * server says this person may (their step in the workflow carries "Can add ad-hoc approver"). The chosen
 * approvers are only emitted -- the parent sends them along with the Approve action.
 */
@Component({
  selector: 'app-adhoc-approver-panel',
  imports: [CommonModule, FormsModule, CdkDropList, CdkDrag, CdkDragHandle, EmployeeList],
  templateUrl: './adhoc-approver-panel.html',
  styleUrl: './adhoc-approver-panel.css',
})
export class AdHocApproverPanel {
  @ViewChild('adHocEmployeeList') adHocEmployeeListRef?: EmployeeList;
  @Output() placementsChange = new EventEmitter<AdHocPlacement[]>();

  private _executionId = 0;

  // 0 / unset means nothing is selected: the panel hides and forgets what was chosen.
  @Input() set executionId(value: number | null | undefined) {
    const next = Number(value) || 0;
    if (next === this._executionId) return;
    this._executionId = next;
    this.reset();
    if (next) this.loadOptions(next);
  }

  canAddAdHoc = false;
  loading = false;
  selectedAdHocEmployee = '';
  sequence: SequenceRow[] = [];

  constructor(
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
  ) {}

  private reset(): void {
    this.canAddAdHoc = false;
    this.sequence = [];
    this.selectedAdHocEmployee = '';
    this.emitPlacements();
  }

  private loadOptions(executionId: number): void {
    this.loading = true;
    this._documentService.getAdHocOptions(executionId).subscribe({
      next: (res: any) => {
        // A different document may have been selected while this was in flight.
        if (executionId !== this._executionId) return;
        this.loading = false;
        const data = res?.Data;
        if (!data?.CanAddAdHocApprover) return;

        this.canAddAdHoc = true;
        this.sequence = (data.Steps || []).map((s: any) => ({
          key: 'step-' + s.StepId,
          stepId: Number(s.StepId),
          employeeCode: (s.EmployeeCode || '').trim(),
          name: s.EmployeeName || s.EmployeeCode,
          designation: s.Designation || '',
          isCurrent: !!s.IsCurrent,
          isAdHoc: !!s.IsAdHoc,
          isNew: false,
        }));
      },
      // A failure here only means the option is not shown; approving itself is unaffected.
      error: (err: any) => {
        console.error('[AdHoc] get-adhoc-options failed', err);
        if (executionId === this._executionId) this.loading = false;
      },
    });
  }

  private zeroTrimmed(code: string): string {
    return (code || '').trim().replace(/^0+/, '');
  }

  addAdHoc(): void {
    const code = (this.selectedAdHocEmployee || '').toString().trim();
    if (!code) return;

    if (this.sequence.some((r) => this.zeroTrimmed(r.employeeCode) === this.zeroTrimmed(code))) {
      this._notificationToastService.createNotification(
        'warning',
        'Ad-hoc approver',
        'This person is already in the approval sequence.',
      );
      return;
    }

    // Labels are "Name (Code)" -- keep just the name for display.
    const opt = this.adHocEmployeeListRef?.options.find((o) => o.value === code);
    const name = opt?.label ? opt.label.replace(/\s*\([^)]*\)\s*$/, '') : code;

    // Default position: right after the person approving. They can move it.
    this.sequence.splice(1, 0, {
      key: 'new-' + code + '-' + Date.now(),
      employeeCode: code,
      name,
      designation: '',
      isCurrent: false,
      isAdHoc: true,
      isNew: true,
    });
    this.sequence = [...this.sequence];
    this.selectedAdHocEmployee = '';
    this.emitPlacements();
  }

  removeAdHoc(row: SequenceRow): void {
    if (!row.isNew) return;
    this.sequence = this.sequence.filter((r) => r !== row);
    this.emitPlacements();
  }

  moveToNext(row: SequenceRow): void {
    this.moveTo(row, 1);
  }

  moveToEnd(row: SequenceRow): void {
    this.moveTo(row, this.sequence.length - 1);
  }

  private moveTo(row: SequenceRow, index: number): void {
    const from = this.sequence.indexOf(row);
    if (!row.isNew || from < 1 || from === index) return;
    const next = [...this.sequence];
    moveItemInArray(next, from, Math.max(1, index));
    this.sequence = next;
    this.emitPlacements();
  }

  // Drag-and-drop: only new rows move, and nothing can go above the person approving.
  dropAdHoc(event: CdkDragDrop<SequenceRow[]>): void {
    const row = this.sequence[event.previousIndex];
    if (!row?.isNew) return;
    const target = Math.max(1, event.currentIndex);
    if (target === event.previousIndex) return;
    const next = [...this.sequence];
    moveItemInArray(next, event.previousIndex, target);
    this.sequence = next;
    this.emitPlacements();
  }

  // What the server needs: each new approver and the existing step it goes IMMEDIATELY AFTER (the nearest
  // preceding step that already exists on the workflow). Approvers that share an anchor keep the order they
  // appear in here.
  private buildPayload(): AdHocPlacement[] {
    const payload: AdHocPlacement[] = [];
    let anchor: number | undefined;
    for (const row of this.sequence) {
      if (!row.isNew) {
        anchor = row.stepId;
      } else if (anchor !== undefined) {
        payload.push({ EmployeeCode: row.employeeCode, InsertAfterStepId: anchor });
      }
    }
    return payload;
  }

  private emitPlacements(): void {
    this.placementsChange.emit(this.canAddAdHoc ? this.buildPayload() : []);
  }
}
