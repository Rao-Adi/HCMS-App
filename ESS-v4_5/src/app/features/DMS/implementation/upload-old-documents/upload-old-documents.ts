import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { UploadDocuments } from '../upload-documents/upload-documents';
import { UploadedDocuments } from '../uploaded-documents/uploaded-documents';
import { DocumentService } from '../../../../shared/services/document.service';
import { NotificationToastService } from '@app/shared/notification/notification.service';

@Component({
  selector: 'app-upload-old-documents',
  imports: [CommonModule, UploadDocuments, UploadedDocuments],
  templateUrl: './upload-old-documents.html',
  styleUrl: './upload-old-documents.css',
})
export class UploadOldDocuments {
  selectedTab: string = 'Upload';
 
  // Bulk Upload Properties
  excelFile: File | null = null;
  bulkDocuments: File[] = [];
  isUploading: boolean = false;
  isUploadingMetadata: boolean = false;
  isUploadingDocuments: boolean = false;

  @ViewChild('excelFileInput') excelFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('documentsInput') documentsInput!: ElementRef<HTMLInputElement>;

  constructor(private documentService: DocumentService,
    private _notificationToastService: NotificationToastService
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
      }
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

    this.isUploading = true;

    if (this.excelFile && this.bulkDocuments.length > 0) {
      // Both selected: Upload Metadata First, then Files
      this.documentService.bulkImportDocumentMetadata(this.excelFile).subscribe({
        next: (metadataResponse) => {
          console.log('Metadata imported successfully:', metadataResponse);
          this.documentService.bulkUploadDocumentFiles(this.bulkDocuments).subscribe({
            next: (filesResponse) => {
              // console.log('Files uploaded successfully:', filesResponse);
              // alert('Bulk upload completed successfully!');
              this._notificationToastService.createNotification(
                'success',
                'Success',
                'File(s) saved successfully.',
              );

              this.clearExcelFile();
              this.clearBulkDocuments();
              this.isUploading = false;
            },
            error: (err) => {
              console.error('Error uploading document files:', err);
              this._notificationToastService.createNotification(
                'error',
                'Error',
                'Failed to upload document files. Please try again.'
              );
              this.isUploading = false;
            }
          });
        },
        error: (err) => {
          console.error('Error importing metadata:', err);
          this._notificationToastService.createNotification(
            'error',
            'Error',
            'Failed to import Excel metadata. Please check the file and try again.'
          );
          this.isUploading = false;
        }
      });
    } else if (this.excelFile) {
      // Only Excel template selected: Upload Metadata Only
      this.documentService.bulkImportDocumentMetadata(this.excelFile).subscribe({
        next: (metadataResponse) => {
          console.log('Metadata imported successfully:', metadataResponse);
          this._notificationToastService.createNotification(
            'success',
            'Success',
            'Excel metadata imported successfully!'
          );
          this.clearExcelFile();
          this.isUploading = false;
        },
        error: (err) => {
          console.error('Error importing metadata:', err);
          this._notificationToastService.createNotification(
            'error',
            'Error',
            'Failed to import Excel metadata. Please check the file and try again.'
          );
          this.isUploading = false;
        }
      });
    } else if (this.bulkDocuments.length > 0) {
      // Only Documents selected: Upload Files Only
      this.documentService.bulkUploadDocumentFiles(this.bulkDocuments).subscribe({
        next: (filesResponse) => {
          this._notificationToastService.createNotification(
                'success',
                'Success',
                'File(s) saved successfully.',
              );
          this.clearBulkDocuments();
          this.isUploading = false;
        },
        error: (err) => {
          console.error('Error uploading document files:', err);
          this._notificationToastService.createNotification(
            'error',
            'Error',
            'Failed to upload document files. Please try again.'
          );
          this.isUploading = false;
        }
      });
    }
  }
}
 