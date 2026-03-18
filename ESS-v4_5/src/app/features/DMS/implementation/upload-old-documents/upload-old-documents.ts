import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UploadDocuments } from '../upload-documents/upload-documents';
import { UploadedDocuments } from '../uploaded-documents/uploaded-documents';

@Component({
  selector: 'app-upload-old-documents',
  imports: [CommonModule, UploadDocuments, UploadedDocuments],
  templateUrl: './upload-old-documents.html',
  styleUrl: './upload-old-documents.css',
})
export class UploadOldDocuments {
  selectedTab: string = 'Upload';
 
}
 