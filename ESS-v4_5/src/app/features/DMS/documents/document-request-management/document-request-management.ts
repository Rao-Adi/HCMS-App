import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { PendingRequestForApproval } from './pending-request-for-approval/pending-request-for-approval';
import { DocumentRequestForm } from './document-request-form/document-request-form';
import { DraftRequestList } from './draft-request-list/draft-request-list';
import { DocumentRequestService } from '@app/shared/services/document-request.service';
@Component({
  selector: 'app-document-request-management',
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzIconModule,
    NzSwitchModule,
    NzRadioModule,
    NzButtonModule,
    NzInputModule,
    NzModalModule,
    PendingRequestForApproval,
    DocumentRequestForm,
    DraftRequestList,
  ],
  templateUrl: './document-request-management.html',
  styleUrl: './document-request-management.css',
})
export class DocumentRequestManagement implements OnInit {
  selectedTab: string = 'NewRequest';
  draftDocumentCounts: number = 0;
  myDocumentRequestPendingForApprovalCount: number = 0;

  
  constructor(
    private route: ActivatedRoute,
    private _documentRequestService: DocumentRequestService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
    });
    this.getDocumentRequestCounts();
    this.getMyDocumentRequestForApprovalCount();
  }

  getDocumentRequestCounts() {
    this._documentRequestService.getDraftDocumentCount().subscribe({
      next: (response) => {
        if (response && response.Data) {
          this.draftDocumentCounts = response.Data.count ?? 0;
        }
      },
      error: (err) => console.error('Failed to get request counts', err),
    });
  }

  getMyDocumentRequestForApprovalCount() {
    this._documentRequestService.getMyDocumentRequestForApprovalCount().subscribe({
      next: (response) => {
        if (response && response.Data) {
          this.myDocumentRequestPendingForApprovalCount = response.Data.count ?? 0;
        }
      },
      error: (err) => console.error('Failed to get request counts', err),
    });
  }
}
