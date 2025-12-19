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
  // 🔹 API endpoints
  uploadApiUrl = '/api/documents/upload-grid';
  uploadedApiUrl = '/api/documents/uploaded-grid';
  loading = false;
  avatarUrl?: string;

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  sig!: SignaturePad;

  penColor = '#000000';

  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor(private http: HttpClient, private messageService: NzMessageService) {}

  ngAfterViewInit(): void {
    this.initSignaturePad();
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
  onColorChange(color: NzColor): void {
    const hex = color.toHexString();

    this.penColor = hex;

    if (this.sig) {
      this.sig.penColor = hex;
      (this.sig as any)._ctx.strokeStyle = hex; // 🔥 REQUIRED
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
    console.log('BASE64:', base64);

    this.upload(base64);
  }

  upload(base64: string): void {
    this.http
      .post('/api/signature/upload', {
        imageBase64: base64,
      })
      .subscribe();
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

  ngOnInit() {
    //this.sig = new SignaturePad(this.canvas.nativeElement);
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
