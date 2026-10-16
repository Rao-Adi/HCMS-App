import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '@app/shared/services/document.service';
import { EmployeeList } from '@app/shared/Dropdowns/employee-list/employee-list';
import { NotificationToastService } from '@app/shared/notification/notification.service';

// One row of the approval chain shown when the approver may add an ad-hoc approver: steps already decided,
// the approver's own (current) step, the ones still to come, and any ad-hoc approver added here.
interface SequenceRow {
  key: string;
  stepId?: number; // existing step; absent for an ad-hoc approver added here
  employeeCode: string;
  name: string;
  designation: string;
  isCurrent: boolean; // the person approving -- new approvers can only go after this row
  isDecided?: boolean; // already acted on (approved ...) -- shown for the picture, never moved or inserted before
  decision?: string;
  isAdHoc: boolean; // an ad-hoc approver already on the workflow
  isNew: boolean; // added here -- the only rows that can be moved or removed
}

export interface AdHocPlacement {
  EmployeeCode: string;
  InsertAfterStepId: number;
}

/** A placement plus the name to show for it, so the choice can be redrawn when the modal is reopened. */
export interface AdHocChoice extends AdHocPlacement {
  EmployeeName?: string;
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
  @Output() placementsChange = new EventEmitter<AdHocChoice[]>();
  // Tells the host whether this approver may add one (known once the chain has loaded).
  @Output() canAddChange = new EventEmitter<boolean>();

  // Ad-hoc approvers chosen earlier for this same workflow run (the modal was opened before). They are put
  // back in the sequence once it has loaded; one whose position or person no longer fits is dropped.
  @Input() initialChoices: AdHocChoice[] = [];

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
  loaded = false; // the options request has come back (so "not allowed" can be told apart from "not asked yet")
  selectedAdHocEmployee = '';
  sequence: SequenceRow[] = [];

  constructor(
    private _documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
  ) {}

  private reset(): void {
    this.canAddAdHoc = false;
    this.loaded = false;
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
        this.loaded = true;
        const data = res?.Data;

        // Everyone sees the signing authorities; only the approver whose step allows it gets the controls to add one.
        this.canAddAdHoc = !!data?.CanAddAdHocApprover;
        this.canAddChange.emit(this.canAddAdHoc);
        this.sequence = (data?.Steps || []).map((s: any) => ({
          key: 'step-' + s.StepId,
          stepId: Number(s.StepId),
          employeeCode: (s.EmployeeCode || '').trim(),
          name: s.EmployeeName || s.EmployeeCode,
          designation: s.Designation || '',
          isCurrent: !!s.IsCurrent,
          isAdHoc: !!s.IsAdHoc,
          isDecided: !!s.IsDecided,
          decision: s.Decision || '',
          isNew: false,
        }));
        if (this.canAddAdHoc) {
          this.restoreInitialChoices();
          this.emitPlacements();
        }
      },
      // A failure here only means the option is not shown; approving itself is unaffected.
      error: (err: any) => {
        console.error('[AdHoc] get-adhoc-options failed', err);
        if (executionId === this._executionId) this.loading = false;
      },
    });
  }

  // Puts previously chosen approvers back, each straight after the existing step it was placed after (and
  // after any earlier choice sharing that step, so their order is kept).
  private restoreInitialChoices(): void {
    for (const choice of this.initialChoices || []) {
      const code = (choice.EmployeeCode || '').trim();
      if (!code || this.sequence.some((r) => this.zeroTrimmed(r.employeeCode) === this.zeroTrimmed(code)))
        continue;

      const anchorIndex = this.sequence.findIndex((r) => !r.isNew && r.stepId === choice.InsertAfterStepId);
      if (anchorIndex < 0) continue;

      let at = anchorIndex + 1;
      while (at < this.sequence.length && this.sequence[at].isNew) at++;

      const restored: SequenceRow = {
        key: 'new-' + code + '-' + Date.now() + '-' + at,
        employeeCode: code,
        name: choice.EmployeeName || code,
        designation: '',
        isCurrent: false,
        isAdHoc: true,
        isNew: true,
      };
      this.sequence.splice(at, 0, restored);
      this.fillDesignation(restored);
    }
    this.sequence = [...this.sequence];
  }

  // Where the person approving sits in the chain. Everything before it is already decided.
  private get currentIndex(): number {
    const i = this.sequence.findIndex((r) => r.isCurrent);
    return i < 0 ? 0 : i;
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

    // Default position: the very end of the approval chain, after everyone. They can move it up, but never
    // above the person approving.
    const newRow: SequenceRow = {
      key: 'new-' + code + '-' + Date.now(),
      employeeCode: code,
      name,
      designation: '',
      isCurrent: false,
      isAdHoc: true,
      isNew: true,
    };
    this.sequence = [...this.sequence, newRow];
    this.selectedAdHocEmployee = '';
    this.emitPlacements();
    this.fillDesignation(newRow);
  }

  // The employee list only carries names, so the designation is fetched for the picked person.
  private fillDesignation(row: SequenceRow): void {
    this._documentService.getAdHocApproverDesignation(row.employeeCode).subscribe({
      next: (res: any) => {
        row.designation = (res?.Data || '').toString();
        this.sequence = [...this.sequence];
      },
      error: () => {},
    });
  }

  removeAdHoc(row: SequenceRow): void {
    if (!row.isNew) return;
    this.sequence = this.sequence.filter((r) => r !== row);
    this.emitPlacements();
  }

  private moveTo(row: SequenceRow, index: number): void {
    const from = this.sequence.indexOf(row);
    const lowest = this.currentIndex + 1;
    if (!row.isNew || from < lowest || from === index) return;
    const next = [...this.sequence];
    moveItemInArray(next, from, Math.max(lowest, index));
    this.sequence = next;
    this.emitPlacements();
  }

  // Drag-and-drop: only new rows move, and nothing can go above the person approving.
  dropAdHoc(event: CdkDragDrop<SequenceRow[]>): void {
    const row = this.sequence[event.previousIndex];
    if (!row?.isNew) return;
    const target = Math.max(this.currentIndex + 1, event.currentIndex);
    if (target === event.previousIndex) return;
    const next = [...this.sequence];
    moveItemInArray(next, event.previousIndex, target);
    this.sequence = next;
    this.emitPlacements();
  }

  // What the server needs: each new approver and the existing step it goes IMMEDIATELY AFTER (the nearest
  // preceding step that already exists on the workflow). Approvers that share an anchor keep the order they
  // appear in here.
  private buildPayload(): AdHocChoice[] {
    const payload: AdHocChoice[] = [];
    let anchor: number | undefined;
    for (const row of this.sequence) {
      if (!row.isNew) {
        anchor = row.stepId;
      } else if (anchor !== undefined) {
        payload.push({ EmployeeCode: row.employeeCode, InsertAfterStepId: anchor, EmployeeName: row.name });
      }
    }
    return payload;
  }

  private emitPlacements(): void {
    this.placementsChange.emit(this.canAddAdHoc ? this.buildPayload() : []);
  }
}
