import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { UploadDocuments } from '../upload-documents/upload-documents';
import { UploadedDocuments } from '../uploaded-documents/uploaded-documents';
import { DocumentService } from '../../../../shared/services/document.service';

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

  @ViewChild('excelFileInput') excelFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('documentsInput') documentsInput!: ElementRef<HTMLInputElement>;

  constructor(private documentService: DocumentService) {}

  downloadTemplate() {
    // TODO: Implement actual template download API logic
    console.log('Downloading Excel template...');
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
    if (!this.excelFile || this.bulkDocuments.length === 0) {
      return;
    }

    this.isUploading = true;

    // 1. Upload Metadata File First
    this.documentService.bulkImportDocumentMetadata(this.excelFile).subscribe({
      next: (metadataResponse) => {
        console.log('Metadata imported successfully:', metadataResponse);

        // 2. Upload Document Files Second
        this.documentService.bulkUploadDocumentFiles(this.bulkDocuments).subscribe({
          next: (filesResponse) => {
            console.log('Files uploaded successfully:', filesResponse);
            alert('Bulk upload completed successfully!');
            this.clearExcelFile();
            this.clearBulkDocuments();
            this.isUploading = false;
          },
          error: (err) => {
            console.error('Error uploading document files:', err);
            alert('Failed to upload document files. Please try again.');
            this.isUploading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error importing metadata:', err);
        alert('Failed to import Excel metadata. Please check the file and try again.');
        this.isUploading = false;
      }
    });
  }
}
 