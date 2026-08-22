import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { EmployeeList } from '@app/shared/Dropdowns/employee-list/employee-list';
import { UncontrolledDocumentService } from '@app/shared/services/uncontrolled-document.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';

export interface UncontrolledDocumentFormModalData {
  mode: 'create' | 'review';
  record?: any;
}

@Component({
  selector: 'app-uncontrolled-document-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeList],
  templateUrl: './uncontrolled-document-form-modal.html',
  styleUrl: './uncontrolled-document-form-modal.css',
})
export class UncontrolledDocumentFormModal implements OnInit {
  isCreateMode = true;

  documentName = '';
  reviewDate = '';
  reviewAuthorityEmpCode: string | null = null;
  selectedFile: File | null = null;

  submitting = false;

  constructor(
    private modalRef: NzModalRef,
    private _uncontrolledDocumentService: UncontrolledDocumentService,
    private _notificationToastService: NotificationToastService,
    @Inject(NZ_MODAL_DATA) public modalData: UncontrolledDocumentFormModalData,
  ) {}

  ngOnInit(): void {
    this.isCreateMode = this.modalData.mode === 'create';

    if (!this.isCreateMode && this.modalData.record) {
      this.documentName = this.modalData.record.documentName;
      this.reviewDate = this.modalData.record.reviewDate;
      this.reviewAuthorityEmpCode = this.modalData.record.reviewAuthorityEmpCode;
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