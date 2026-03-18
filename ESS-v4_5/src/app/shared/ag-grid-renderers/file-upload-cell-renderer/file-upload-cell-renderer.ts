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
    <div *ngIf="isEditing" style="width: 100%;">
      <input
        type="file"
        [accept]="params?.accept || '*'"
        (change)="onFileSelected($event)"
        style="width: 100%; padding: 6px; border: 1px solid #d9d9d9; border-radius: 4px;"
      />
      <div *ngIf="fileInfo" style="margin-top: 8px; font-size: 12px; color: #52c41a;">
        ✓ {{ fileInfo.name }}
      </div>
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
