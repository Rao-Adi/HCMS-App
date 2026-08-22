import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { UncontrolledDocumentService } from '@app/shared/services/uncontrolled-document.service';

export interface UncontrolledDocumentHistoryModalData {
  id: number;
}

@Component({
  selector: 'app-uncontrolled-document-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './uncontrolled-document-history-modal.html',
  styleUrl: './uncontrolled-document-history-modal.css',
})
export class UncontrolledDocumentHistoryModal implements OnInit {
  history: any[] = [];
  loading = true;

  constructor(
    private _uncontrolledDocumentService: UncontrolledDocumentService,
    @Inject(NZ_MODAL_DATA) public modalData: UncontrolledDocumentHistoryModalData,
  ) {}

  ngOnInit(): void {
    this._uncontrolledDocumentService.getHistory(this.modalData.id).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.Success) {
          this.history = (res.Data || []).map((h: any) => ({
            previousDocumentURL: h.PreviousDocumentURL ?? h.previousDocumentURL,
            newDocumentURL: h.NewDocumentURL ?? h.newDocumentURL,
            previousReviewDate: h.PreviousReviewDate ?? h.previousReviewDate,
            newReviewDate: h.NewReviewDate ?? h.newReviewDate,
            reviewedByName: h.ReviewedByName ?? h.reviewedByName,
            reviewedAt: h.ReviewedAt ?? h.reviewedAt,
          }));
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}