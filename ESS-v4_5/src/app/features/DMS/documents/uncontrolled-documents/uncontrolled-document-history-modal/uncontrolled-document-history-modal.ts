import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { UncontrolledDocumentService } from '@app/shared/services/uncontrolled-document.service';
import { AppConfigService } from '@app/core/services/app-config';
import { resolveUploadUrl } from '@app/shared/utils/resolve-upload-url';

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
    private _config: AppConfigService,
    @Inject(NZ_MODAL_DATA) public modalData: UncontrolledDocumentHistoryModalData,
  ) {}

  ngOnInit(): void {
    this._uncontrolledDocumentService.getHistory(this.modalData.id).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.Success) {
          this.history = (res.Data || []).map((h: any) => ({
            // Raw URLs from the API are relative paths served off the API host's root (not
            // under "/api") -- resolve them here or "View" opens against the Angular app's own
            // origin and 404s.
            previousDocumentURL: resolveUploadUrl(h.PreviousDocumentURL ?? h.previousDocumentURL, this._config.baseUrl),
            newDocumentURL: resolveUploadUrl(h.NewDocumentURL ?? h.newDocumentURL, this._config.baseUrl),
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