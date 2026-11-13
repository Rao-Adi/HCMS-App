import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { UncontrolledDocumentService } from '@app/shared/services/uncontrolled-document.service';
import { AppConfigService } from '@app/core/services/app-config';
import { resolveUploadUrl } from '@app/shared/utils/resolve-upload-url';
import { TableSort, nextSort, noSort, searchRows, sortIcon, sortRows } from '@app/shared/utils/table-sort';
import { DateTimeLinesPipe } from '@app/shared/utils/date-time-lines';

export interface UncontrolledDocumentHistoryModalData {
  id: number;
}

@Component({
  selector: 'app-uncontrolled-document-history-modal',
  standalone: true,
  imports: [CommonModule, DateTimeLinesPipe],
  templateUrl: './uncontrolled-document-history-modal.html',
  styleUrl: './uncontrolled-document-history-modal.css',
})
export class UncontrolledDocumentHistoryModal implements OnInit {
  history: any[] = [];
  loading = true;

  // Click a heading to sort the rows (the file links are not sortable).
  sort: TableSort = noSort();
  // The standard grid Search box (same look as every grid).
  searchText = '';
  get sortedHistory(): any[] {
    const found = searchRows(this.history, this.searchText, (h) =>
      [h.reviewedByName, h.reviewedAt, h.previousReviewDate, h.newReviewDate].join(' '),
    );
    return sortRows(found, this.sort, (row, key) => row[key]);
  }
  sortBy(key: string): void {
    this.sort = nextSort(this.sort, key);
  }
  icon(key: string): string {
    return sortIcon(this.sort, key);
  }

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