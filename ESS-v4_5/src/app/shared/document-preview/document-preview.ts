import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { renderAsync } from 'docx-preview';
import { catchError, forkJoin, of } from 'rxjs';
import { DocumentService } from '@app/shared/services/document.service';

export interface DocumentPreviewData {
  documentId: number;
  // The version still being prepared (approver, authorizer, author) rather than the one in force -- the same meaning
  // as on the Download call.
  pending?: boolean;
  title?: string;
}

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Opens the Preview screen for a document: the downloadable document (the Document Type's template merged with the
 * document's metadata, exactly what Download gives) rendered in the browser, with the Document Users and the
 * Distribution List underneath.
 */
export function openDocumentPreview(modal: NzModalService, data: DocumentPreviewData): NzModalRef {
  return modal.create({
    nzTitle: data.title ? `Preview - ${data.title}` : 'Preview',
    nzContent: DocumentPreviewModal,
    nzData: data,
    nzFooter: null,
    nzWidth: 900,
    nzCentered: true,
    nzMaskClosable: false,
  });
}

@Component({
  selector: 'app-document-preview',
  templateUrl: './document-preview.html',
  styleUrl: './document-preview.css',
})
export class DocumentPreviewModal implements AfterViewInit, OnDestroy {
  @ViewChild('docHost', { static: true }) docHost!: ElementRef<HTMLElement>;

  loading = true;
  message = '';
  pdfUrl: SafeResourceUrl | null = null;

  distributionList: any[] = [];
  userList: any[] = [];
  listsLoaded = false;

  blob: Blob | null = null;
  private fileName = 'Document';
  private objectUrl: string | null = null;

  constructor(
    private modalRef: NzModalRef,
    private documentService: DocumentService,
    private sanitizer: DomSanitizer,
    @Inject(NZ_MODAL_DATA) private data: DocumentPreviewData,
  ) {}

  ngAfterViewInit(): void {
    // Deferred a tick so the host element exists in the modal before the renderer writes into it.
    setTimeout(() => this.load());
  }

  ngOnDestroy(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }

  private load(): void {
    const pending = !!this.data.pending;
    forkJoin({
      file: this.documentService.DownloadDocumentTemplate(this.data.documentId, pending),
      // The lists are an addition: if they cannot be read the document is still shown.
      lists: this.documentService
        .GetDocumentPreviewLists(this.data.documentId, pending)
        .pipe(catchError(() => of(null))),
    }).subscribe({
      next: async ({ file, lists }) => {
        const payload: any = (lists as any)?.Data ?? (lists as any)?.data ?? null;
        this.distributionList = payload?.DistributionList ?? payload?.distributionList ?? [];
        this.userList = payload?.UserList ?? payload?.userList ?? [];
        this.listsLoaded = !!payload;

        const body: any = (file as any)?.body ?? file;
        const blob: Blob | null = body instanceof Blob ? body : body instanceof ArrayBuffer ? new Blob([body]) : null;
        if (!blob) {
          this.fail('The document could not be loaded.');
          return;
        }

        if (blob.type === 'application/json' || blob.type === 'application/problem+json') {
          try {
            const res = JSON.parse(await blob.text());
            this.fail(res.Message || 'This document is not available for preview.');
          } catch {
            this.fail('This document is not available for preview.');
          }
          return;
        }

        this.blob = blob;
        const serverName = this.nameFrom((file as any)?.headers?.get?.('Content-Disposition'));
        this.fileName = this.downloadName(serverName, blob);

        try {
          if (blob.type === DOCX || /\.docx$/i.test(this.fileName)) {
            await renderAsync(blob, this.docHost.nativeElement, undefined, {
              className: 'docx',
              inWrapper: true,
              breakPages: true,
              ignoreWidth: false,
              ignoreHeight: true,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true,
            });
            // A Word document already carries the Distribution List and Document Users at its end (the server
            // puts them there, so Download has them too) -- the block below is only for other file types.
            this.listsLoaded = false;
          } else if (blob.type === 'application/pdf' || /\.pdf$/i.test(this.fileName)) {
            this.objectUrl = URL.createObjectURL(blob);
            this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
          } else {
            this.message = 'A preview is not available for this file type. Use Download to open it.';
          }
        } catch {
          this.message = 'The document could not be displayed here. Use Download to open it.';
        }
        this.loading = false;
      },
      error: async (err: any) => {
        // The server explains itself (e.g. "the file has not been uploaded yet"); with a blob response type that
        // explanation arrives as a Blob.
        let text = '';
        try {
          text = err?.error instanceof Blob ? await err.error.text() : '';
          text = text ? JSON.parse(text).Message || '' : '';
        } catch {
          text = '';
        }
        this.fail(text || 'The document could not be loaded.');
      },
    });
  }

  private fail(message: string): void {
    this.message = message;
    this.loading = false;
  }

  // The file is saved under the document's own title; only the extension comes from the file itself.
  private downloadName(serverName: string, blob: Blob): string {
    const title = (this.data.title || '').replace(/[\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title) return serverName || 'Document';
    const ext = /\.[A-Za-z0-9]{2,5}$/.exec(serverName)?.[0] || (blob.type === DOCX ? '.docx' : blob.type === 'application/pdf' ? '.pdf' : '');
    return title + ext;
  }

  private nameFrom(contentDisposition?: string | null): string {
    if (!contentDisposition) return '';
    const m = /filename\*?=(?:UTF-8'')?("?)([^";\n]*)\1/i.exec(contentDisposition);
    try {
      return m ? decodeURIComponent(m[2]) : '';
    } catch {
      return m ? m[2] : '';
    }
  }

  download(): void {
    if (!this.blob) return;
    const url = URL.createObjectURL(this.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  close(): void {
    this.modalRef.close();
  }

  // Property names may arrive in either case depending on the endpoint's serializer.
  val(row: any, ...keys: string[]): string {
    for (const k of keys) {
      const v = row?.[k];
      if (v !== null && v !== undefined && String(v).trim() !== '') return String(v);
    }
    return '';
  }
}
