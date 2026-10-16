import { Component, Inject } from '@angular/core';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { AdHocApproverPanel, AdHocChoice } from '@app/shared/adhoc-approver-panel/adhoc-approver-panel';

export interface AdHocApproverModalData {
  executionId: number;
  documentName?: string;
  // What was chosen for this document the last time the modal was open, so reopening it shows it again.
  initial?: AdHocChoice[];
}

/**
 * "Ad-hoc Approver" link on a My Approvals row opens this. The approver picks who to add and where they
 * go in the remaining sequence; Save hands the choice back to the page, which sends it along when the
 * document is approved. Nothing is written to the workflow here -- closing without Save changes nothing.
 */
@Component({
  selector: 'app-adhoc-approver-modal',
  imports: [AdHocApproverPanel],
  templateUrl: './adhoc-approver-modal.html',
  styleUrl: './adhoc-approver-modal.css',
})
export class AdHocApproverModal {
  executionId: number;
  documentName: string;
  initial: AdHocChoice[];
  choices: AdHocChoice[];
  // Whether this approver may add one (known once the panel has loaded). Without it the modal is a read-only view.
  canAdd = false;

  constructor(
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) data: AdHocApproverModalData,
  ) {
    this.executionId = data.executionId;
    this.documentName = data.documentName || '';
    this.initial = data.initial || [];
    this.choices = [...this.initial];
  }

  save(): void {
    this.modalRef.close(this.choices);
  }

  cancel(): void {
    this.modalRef.close(undefined);
  }

  close(): void {
    this.modalRef.close(undefined);
  }
}
