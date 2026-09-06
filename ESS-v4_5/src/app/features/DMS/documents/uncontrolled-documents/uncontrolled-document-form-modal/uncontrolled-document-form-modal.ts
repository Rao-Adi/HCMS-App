import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { UncontrolledDocumentService } from '@app/shared/services/uncontrolled-document.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { AppConfigService } from '@app/core/services/app-config';
import { resolveUploadUrl } from '@app/shared/utils/resolve-upload-url';

export interface UncontrolledDocumentFormModalData {
  mode: 'create' | 'review';
  record?: any;
}

@Component({
  selector: 'app-uncontrolled-document-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule],
  templateUrl: './uncontrolled-document-form-modal.html',
  styleUrl: './uncontrolled-document-form-modal.css',
})
export class UncontrolledDocumentFormModal implements OnInit {
  isCreateMode = true;

  documentName = '';
  reviewDate = '';
  reviewAuthorityEmpCode: string | null = null;
  selectedFile: File | null = null;
  currentDocumentUrl = '';

  submitting = false;

  // Populated from the same PeoplePartnersService.GetEmployeeList() call and CODE/NAME shape
  // used by ApprovalWorkflowPolicyManagement's employee dropdown -- app-employee-list wasn't
  // rendering any options here, so this plain nz-select (sends the employee CODE as the
  // authority, same as that reference screen) replaces it.
  employees: { CODE: string; NAME: string }[] = [];

  constructor(
    private modalRef: NzModalRef,
    private _uncontrolledDocumentService: UncontrolledDocumentService,
    private _peoplePartnerService: PeoplePartnersService,
    private _notificationToastService: NotificationToastService,
    private _config: AppConfigService,
    @Inject(NZ_MODAL_DATA) public modalData: UncontrolledDocumentFormModalData,
  ) {}

  ngOnInit(): void {
    this.isCreateMode = this.modalData.mode === 'create';

    if (!this.isCreateMode && this.modalData.record) {
      this.documentName = this.modalData.record.documentName;
      // record.reviewDate is pre-formatted for the grid ("Sep 11, 2026 00:00:00"), which
      // <input type="date"> can't parse -- use the raw value and format it as yyyy-MM-dd
      // ourselves (avoiding toISOString's UTC shift, since the raw value has no offset and
      // must be read in local time to land on the same calendar day).
      const raw = this.modalData.record.reviewDateRaw;
      if (raw) {
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) {
          const yyyy = parsed.getFullYear();
          const mm = (parsed.getMonth() + 1).toString().padStart(2, '0');
          const dd = parsed.getDate().toString().padStart(2, '0');
          this.reviewDate = `${yyyy}-${mm}-${dd}`;
        }
      }
      this.reviewAuthorityEmpCode = this.modalData.record.reviewAuthorityEmpCode;
      this.currentDocumentUrl = resolveUploadUrl(this.modalData.record.documentUrl, this._config.baseUrl);
    }

    if (this.isCreateMode) {
      this._peoplePartnerService.GetEmployeeList().subscribe((res: any) => {
        this.employees = (res?.Data ?? [])
          .map((d: any) => ({
            CODE: d.Code,
            NAME: '(' + d.Code + ') ' + d.Value,
            val: d.Value || '',
          }))
          .sort((a: any, b: any) => (a.val || '').localeCompare(b.val || ''));
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  get canSubmit(): boolean {
    if (!this.selectedFile || !this.reviewDate) return false;
    if (this.isCreateMode && (!this.documentName || !this.reviewAuthorityEmpCode)) return false;
    return true;
  }

  submit(): void {
    if (!this.canSubmit || this.submitting) return;

    this.submitting = true;
    const formData = new FormData();

    if (this.isCreateMode) {
      formData.append('DocumentName', this.documentName);
      formData.append('ReviewDate', this.reviewDate);
      formData.append('ReviewAuthorityEmpCode', this.reviewAuthorityEmpCode || '');
      formData.append('DocumentFile', this.selectedFile!, this.selectedFile!.name);

      this._uncontrolledDocumentService.create(formData).subscribe({
        next: (res: any) => {
          this.submitting = false;
          if (res?.Success) {
            this._notificationToastService.createNotification(
              'success',
              'Uncontrolled Document',
              'Document uploaded successfully.',
            );
            this.modalRef.close(true);
          }
        },
        error: () => {
          this.submitting = false;
          this._notificationToastService.createNotification('error', 'Error', 'Failed to upload document.');
        },
      });
    } else {
      formData.append('Id', this.modalData.record.id.toString());
      formData.append('NewReviewDate', this.reviewDate);
      formData.append('DocumentFile', this.selectedFile!, this.selectedFile!.name);

      this._uncontrolledDocumentService.review(formData).subscribe({
        next: (res: any) => {
          this.submitting = false;
          if (res?.Success) {
            this._notificationToastService.createNotification(
              'success',
              'Uncontrolled Document',
              'Document reviewed and updated successfully.',
            );
            this.modalRef.close(true);
          }
        },
        error: () => {
          this.submitting = false;
          this._notificationToastService.createNotification('error', 'Error', 'Failed to review document.');
        },
      });
    }
  }

  cancel(): void {
    this.modalRef.close(false);
  }
}