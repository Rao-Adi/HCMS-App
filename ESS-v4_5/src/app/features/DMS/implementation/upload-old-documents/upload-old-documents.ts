import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { UploadDocuments } from '../upload-documents/upload-documents';
import { UploadedDocuments } from '../uploaded-documents/uploaded-documents';
import { DocumentService } from '../../../../shared/services/document.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-upload-old-documents',
  imports: [CommonModule, UploadDocuments, UploadedDocuments, NzModalModule],
  templateUrl: './upload-old-documents.html',
  styleUrl: './upload-old-documents.css',
})
export class UploadOldDocuments {
  selectedTab: string = 'Upload';

  // Bulk Upload Properties
  excelFile: File | null = null;
  bulkDocuments: File[] = [];
  isUploadingMetadata: boolean = false;
  isUploadingDocuments: boolean = false;

  @ViewChild('excelFileInput') excelFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('documentsInput') documentsInput!: ElementRef<HTMLInputElement>;

  constructor(
    private documentService: DocumentService,
    private _notificationToastService: NotificationToastService,
    private modalService: NzModalService,
  ) {}

  downloadTemplate() {
    this.documentService.DownloadBulkMetadataTemplate().subscribe({
      next: (response: any) => {
        const blob = response.body;
        if (!blob) {
          alert('Failed to download template: Empty response body.');
          return;
        }

        let filename = 'Bulk_Document_Import_Template.xlsx';
        const contentDisposition =
          response.headers?.get('content-disposition') ||
          response.headers?.get('Content-Disposition');
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading template:', err);
        alert('Failed to download template. Please check with your administrator.');
      },
    });
  }

  onExcelFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.excelFile = file;
      console.log('Excel file selected:', file.name);
    }
  }

  onBulkDocumentsSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.bulkDocuments = Array.from(files);
      console.log(`${this.bulkDocuments.length} documents selected.`);
    }
  }

  clearExcelFile() {
    this.excelFile = null;
    // Clear out input value so selecting the exact same file again triggers (change)
    if (this.excelFileInput && this.excelFileInput.nativeElement) {
      this.excelFileInput.nativeElement.value = '';
    }
  }

  clearBulkDocuments() {
    this.bulkDocuments = [];
    if (this.documentsInput && this.documentsInput.nativeElement) {
      this.documentsInput.nativeElement.value = '';
    }
  }

  submitBulkUpload() {
    if (!this.excelFile && this.bulkDocuments.length === 0) {
      return;
    }

    if (this.excelFile) {
      this.isUploadingMetadata = true;
      // Only Excel template selected: Upload Metadata Only
      this.documentService.bulkImportDocumentMetadata(this.excelFile).subscribe({
        next: (metadataResponse: any) => {
          // console.log('Metadata imported successfully:', metadataResponse);
          this._notificationToastService.createNotification(
            'success',
            'Success',
            'Excel metadata imported successfully!',
          );
          this.clearExcelFile();
          this.isUploadingMetadata = false;
        },
        error: (err) => {
          // console.error('Error importing metadata:', err);
          if (err?.error?.Data && Array.isArray(err.error.Data) && err.error.Data.length > 0) {
            this.showSkippedRowsModal(err.error.Data);
          } else {
            this._notificationToastService.createNotification(
              'error',
              'Error',
              'Failed to import Excel metadata. Please check the file and try again.',
            );
          }
          this.isUploadingMetadata = false;
        },
      });
    } else if (this.bulkDocuments.length > 0) {
      this.isUploadingDocuments = true;
      // Only Documents selected: Upload Files Only
      this.documentService.bulkUploadDocumentFiles(this.bulkDocuments).subscribe({
        next: (filesResponse) => {
          this._notificationToastService.createNotification(
            'success',
            'Success',
            'File(s) saved successfully.',
          );
          this.clearBulkDocuments();
          this.isUploadingDocuments = false;
        },
        error: (err) => {
          console.error('Error uploading document files:', err);
          this._notificationToastService.createNotification(
            'error',
            'Error',
            'Failed to upload document files. Please try again.',
          );
          this.isUploadingDocuments = false;
        },
      });
    }
  }

  showSkippedRowsModal(skippedRows: string[]) {
    const listHtml = skippedRows
      .map((row) => `<li style="margin-bottom: 6px; font-weight: 500; color: #d9534f;">${row}</li>`)
      .join('');

    this.modalService.warning({
      nzTitle: 'Bulk Import Notice - Skipped Rows',
      nzContent: `
        <div style="font-size: 14px; line-height: 1.5;">
          <p>The import process completed, but the following rows were skipped because the referenced document type or attributes were not found:</p>
          <ul style="max-height: 250px; overflow-y: auto; padding-left: 20px; margin-top: 10px; margin-bottom: 10px; border: 1px solid #f2dede; background-color: #fdf7f7; border-radius: 4px; padding: 12px 12px 12px 28px;">
            ${listHtml}
          </ul>
          <p style="font-weight: 600; color: #555;">Please review these rows in your Excel file, make sure the values match the system values, and upload again.</p>
        </div>
      `,
      nzOkText: 'OK',
      nzMaskClosable: true,
      nzWidth: 520,
    });
  }
}
