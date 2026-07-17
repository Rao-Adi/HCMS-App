import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-file-upload-cell-renderer',
  standalone: true,
  imports: [CommonModule, NzUploadModule, NzButtonModule, NzIconModule],
  template: `
    <div class="file-uploader-cell d-flex align-items-center justify-content-between w-100" style="padding: 2px 4px;">
      <!-- Hidden file input -->
      <input
        #fileInput
        type="file"
        [accept]="params?.accept || '*'"
        (change)="onFileSelected($event)"
        style="display: none;"
      />

      <!-- When editing (or on top pinned row) -->
      <ng-container *ngIf="isEditing">
        <!-- Not uploaded yet -->
        <button
          *ngIf="!fileInfo"
          type="button"
          class="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1"
          (click)="fileInput.click()"
          style="font-size: 11px; padding: 2px 8px; border-radius: 4px; line-height: 1.5;"
        >
          <i class="bi bi-upload text-primary"></i>
          <span>Choose File</span>
        </button>

        <!-- File uploaded / Selected -->
        <div *ngIf="fileInfo" class="d-flex align-items-center justify-content-between w-100 gap-1">
          <a
            href="javascript:void(0)"
            (click)="previewFile()"
            class="text-truncate text-success d-inline-block"
            [title]="fileInfo.name"
            style="font-size: 12px; max-width: 80%; text-decoration: none;"
          >
            <i class="bi bi-file-earmark-check-fill me-1"></i>
            {{ fileInfo.name }}
          </a>
          <button
            type="button"
            class="btn btn-xs btn-link text-danger p-0"
            (click)="removeFile()"
            title="Remove file"
            style="font-size: 12px; line-height: 1;"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </ng-container>

      <!-- When viewing (not editing) -->
      <ng-container *ngIf="!isEditing">
        <div *ngIf="fileInfo" class="d-flex align-items-center gap-1">
          <a
            href="javascript:void(0)"
            (click)="previewFile()"
            class="text-truncate text-primary d-inline-block"
            [title]="fileInfo.name"
            style="font-size: 12px; max-width: 150px; text-decoration: none;"
          >
            <i class="bi bi-file-earmark-text-fill me-1 text-info"></i>
            {{ fileInfo.name }}
          </a>
        </div>
        <span *ngIf="!fileInfo" class="text-muted" style="font-size: 11px; font-style: italic;">
          No File
        </span>
      </ng-container>
    </div>
  `,
})
export class FileUploadCellRenderer implements ICellRendererAngularComp {
  params: any;
  fileInfo: any = null;
  isEditing: boolean = false;

  constructor(private message: NzMessageService) {}

  agInit(params: any): void {
    this.params = params;
    this.isEditing = params.node?.rowPinned === 'top' || params.editingRowId === params.node?.id;

    if (params.value) {
      this.fileInfo = this.parseFileInfo(params.value);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // 1️⃣ UI preview ONLY
    this.fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // ✅ safe, no base64
    };

    // 2️⃣ 🔥 EMIT REAL FILE (THIS FIXES EVERYTHING)
    if (this.params?.onValueChange) {
      this.params.onValueChange(file, this.params.data);
    }
  }

  parseFileInfo(value: any): any {
    if (!value) return null;
    if (typeof value === 'string') {
      const fileName = value.split('/').pop() || value;
      return { name: fileName, url: value, size: 0 };
    }
    return value;
  }

  // Simple implementation with proper parameters
  beforeUpload = (file: any, fileList: any[]): boolean => {
    const maxSize = this.params?.maxSize || 5;
    if (file.size / 1024 / 1024 > maxSize) {
      this.message.error(`File must be smaller than ${maxSize}MB!`);
      return false;
    }
    return true;
  };

  handleUpload = (item: any): void => {
    const file = item.file;

    item.onProgress({ percent: 0 });

    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target.result,
        };

        if (this.params?.onValueChange) {
          this.params.onValueChange(this.fileInfo, this.params.data);
        }

        item.onSuccess({}, file, null);
        this.message.success(`${file.name} selected`);
      };

      reader.readAsDataURL(file);
    }, 300);
  };

  removeFile(): void {
    this.fileInfo = null;
    if (this.params?.onValueChange) {
      this.params.onValueChange(null, this.params.data);
    }
  }

  previewFile(): void {
    if (this.fileInfo?.url) {
      window.open(this.fileInfo.url, '_blank');
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  refresh(params: any): boolean {
    this.params = params;
    this.isEditing = params.node?.rowPinned === 'top' || params.editingRowId === params.node?.id;
    return true;
  }
}
