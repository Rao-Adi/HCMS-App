import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

import { Observable, Observer } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzColor, NzColorPickerModule } from 'ng-zorro-antd/color-picker';
import SignaturePad from 'signature_pad';
import { HttpClient } from '@angular/common/http';
import { UtilitiesService } from '@app/core/services/utilities.service';
import { ESignatureService } from '@app/shared/services/esignature.service';
import { AppConfigService } from '@app/core/services/app-config';

@Component({
  selector: 'app-esignature',
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    NzIconModule,
    NzModalModule,
    NzUploadModule,
    NzColorPickerModule,
  ],
  templateUrl: './esignature.html',
  styleUrl: './esignature.css',
  host: {
    '(keyup.ctrl.k)': 'clear()',
  },
})
export class ESignature implements AfterViewInit {
  selectedTab: string = 'TrainingPoliciy';

  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'esignature';

  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';
  loading = false;
  avatarUrl?: string;

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  sig!: SignaturePad;

  penColor = '#000000';

  // Id of the signature already saved for the current user, if any (fetched in
  // loadMySignature()). Drives whether the next Save is a create or an update.
  signatureId: number | null = null;
  loadingSignature = false;

  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor(
    private http: HttpClient,
    private messageService: NzMessageService,
    private _utilities: UtilitiesService,
    private _esignatureService : ESignatureService,
    private _config: AppConfigService
  ) {}

  ngOnInit() {
    this.checkPermissions();
    //this.sig = new SignaturePad(this.canvas.nativeElement);
  }

  private checkPermissions(): void {
    this._utilities.CanInsert(this.formId).subscribe((res) => (this.canAdd = res));
    this._utilities.CanEdit(this.formId).subscribe((res) => (this.canEdit = res));
    this._utilities.CanDelete(this.formId).subscribe((res) => (this.canDelete = res));
  }

  ngAfterViewInit(): void {
    this.initSignaturePad();
    this.loadMySignature();
  }

  // Loads whatever signature the current user already saved (if any) into the pad, so landing
  // on this page shows their existing signature instead of a blank canvas. Silently leaves the
  // pad blank if they haven't saved one yet -- that's the normal first-time state, not an error.
  private loadMySignature(): void {
    this.loadingSignature = true;
    this._esignatureService.getMySignature().subscribe({
      next: (res: any) => {
        this.loadingSignature = false;
        const data = res?.Data ?? res?.data;
        if (!data) return;

        this.signatureId = data.Id ?? data.id;

        const relativeUrl = data.SignatureURL ?? data.signatureURL ?? data.signatureUrl;
        if (!relativeUrl) return;

        let fileUrl = relativeUrl as string;
        if (!fileUrl.startsWith('http')) {
          // SignatureURL is a static file path served from the API host's root, not under
          // the "/api" prefix used for REST calls -- strip it before appending, same as the
          // SignalR hub URL in main-layout.ts.
          let baseUrl = this._config.baseUrl ? this._config.baseUrl.replace(/\/$/, '') : '';
          if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.substring(0, baseUrl.length - 4);
          }
          fileUrl = baseUrl + (fileUrl.startsWith('/') ? '' : '/') + fileUrl;
        }

        this.restore(fileUrl);
        this.undoStack = [];
        this.redoStack = [];
      },
      error: (err) => {
        this.loadingSignature = false;
        console.error('Failed to load existing signature:', err);
      },
    });
  }

  private initSignaturePad(): void {
    const canvas = this.canvas.nativeElement;

    // Fix blurry canvas
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')!.scale(ratio, ratio);

    this.sig = new SignaturePad(canvas, {
      penColor: this.penColor,
      minWidth: 1,
      maxWidth: 2,
    });

    this.sig.onEnd = () => this.saveState();
  }

  // 🔥 COLOR FIX
  onColorChange(color: any): void {
    let hex = '#000000';

    // Safely extract the hex string regardless of what ng-zorro emits
    if (typeof color === 'string') {
      hex = color;
    } else if (typeof color?.toHexString === 'function') {
      hex = color.toHexString();
    } else if (typeof color?.color?.toHexString === 'function') {
      hex = color.color.toHexString();
    } else if (color?.hex) {
      hex = color.hex;
    }

    this.penColor = hex;

    if (this.sig) {
      this.sig.penColor = hex;
    }
  }

  // =====================
  // UNDO / REDO
  // =====================

  private saveState(): void {
    this.undoStack.push(this.sig.toDataURL());
    this.redoStack = [];
  }

  undo(): void {
    if (this.undoStack.length > 0) {
      this.redoStack.push(this.undoStack.pop()!);
      this.restore(this.undoStack[this.undoStack.length - 1]);
    }
  }

  redo(): void {
    if (this.redoStack.length) {
      const state = this.redoStack.pop()!;
      this.undoStack.push(state);
      this.restore(state);
    }
  }

  private restore(dataUrl: string): void {
    this.sig.clear();
    this.sig.fromDataURL(dataUrl);
  }

  // =====================
  // SAVE / LOAD
  // =====================
  save(): void {
    const base64 = this.sig.toDataURL('image/png');
    //console.log('BASE64:', base64);

    this.upload(base64);
  }

  upload(base64: string): void {
    // A signature already loaded (loadMySignature) means this user has one on file -- Create
    // rejects that with a 409 ("use update instead"), so route there directly instead of
    // round-tripping through an error.
    if (this.signatureId) {
      const payload = {
        Id: this.signatureId,
        SignatureBase64: base64,
        IsActive: true,
      };

      this._esignatureService.update(payload).subscribe({
        next: () => {
          this.messageService.success('Signature updated successfully!');
        },
        error: (err) => {
          console.error('Failed to update signature:', err);
          this.messageService.error(err?.error?.Message || 'Something went wrong. Please try again.');
        },
      });
      return;
    }

    const payload = {
      SignatureBase64: base64,
      IsActive: true,
    };

    this._esignatureService.create(payload).subscribe({
      next: (res: any) => {
        const data = res?.Data ?? res?.data;
        this.signatureId = data?.Id ?? data?.id ?? this.signatureId;
        this.messageService.success('Signature saved successfully!');
      },
      error: (err) => {
        console.error('Failed to save signature:', err);
        this.messageService.error(err?.error?.Message || 'Something went wrong. Please try again.');
      },
    });
  }

  load(base64: string): void {
    this.restore(base64);
  }

  clear(): void {
    this.sig.clear();
    this.undoStack = [];
    this.redoStack = [];
  }

  isEmpty(): boolean {
    return this.sig.isEmpty();
  }

  loadSignatureFromFile(file: File): void {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;

      // Clear existing drawing
      this.sig.clear();

      // Load image into SignaturePad
      this.sig.fromDataURL(dataUrl, {
        ratio: Math.max(window.devicePixelRatio || 1, 1),
        width: this.canvas.nativeElement.offsetWidth,
        height: this.canvas.nativeElement.offsetHeight,
      });

      // Save state for undo
      this.saveState();
    };

    reader.readAsDataURL(file);
  }

  onSignatureUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const file = input.files[0];

    if (file.type !== 'image/png') {
      this.messageService.error('Only PNG files allowed');
      return;
    }

    this.loadSignatureFromFile(file);
    input.value = '';
  }

  previewImage: string | undefined = '';
  previewVisible = false;

  beforeUpload = (file: NzUploadFile, _fileList: NzUploadFile[]): Observable<boolean> =>
    new Observable((observer: Observer<boolean>) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        this.messageService.error('You can only upload JPG file!');
        observer.complete();
        return;
      }
      const isLt2M = file.size! / 1024 / 1024 < 2;
      if (!isLt2M) {
        this.messageService.error('Image must smaller than 2MB!');
        observer.complete();
        return;
      }
      observer.next(isJpgOrPng && isLt2M);
      observer.complete();
    });

  private getBase64(img: File, callback: (img: string) => void): void {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result!.toString()));
    reader.readAsDataURL(img);
  }

  handleChange(info: { file: NzUploadFile }): void {
    switch (info.file.status) {
      case 'uploading':
        this.loading = true;
        break;
      case 'done':
        // Get this url from response in real world.
        this.getBase64(info.file!.originFileObj!, (img: string) => {
          this.loading = false;
          this.avatarUrl = img;
        });
        break;
      case 'error':
        this.messageService.error('Network error');
        this.loading = false;
        break;
    }
  }
}
