import { Component, Inject } from '@angular/core';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { AdHocApproverPanel, AdHocChoice } from '@app/shared/adhoc-approver-panel/adhoc-approver-panel';

export interface AdHocApproverModalData {
  // The workflow run to show -- or, on a screen that only has the document, its id instead (the running / latest workflow is shown).
  executionId?: number;
  documentId?: number;
  // Only the chain, never the add-approver controls (screens that cannot carry the choice to an Approve action).
  readOnly?: boolean;
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
  documentId: number;
  readOnly: boolean;
  documentName: string;
  initial: AdHocChoice[];
  choices: AdHocChoice[];
  // Whether this approver may add one (known once the panel has loaded). Without it the modal is a read-only view.
  canAdd = false;

  constructor(
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) data: AdHocApproverModalData,
  ) {
    this.executionId = data.executionId || 0;
    this.documentId = data.documentId || 0;
    this.readOnly = !!data.readOnly;
    this.documentName = data.documentName || '';
    this.initial = data.initial || [];
    this.choices = [...this.initial];
  }

  save(): void {
    this.modalRef.close(this.choices);
  }

  close(): void {
    this.modalRef.close(undefined);
  }
}
