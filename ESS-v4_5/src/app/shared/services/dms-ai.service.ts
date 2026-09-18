import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, catchError, map } from 'rxjs';
import { AppConfigService } from '@app/core/services/app-config';
import { ApiResponse } from '../interfaces/interfaces';

/** A document the assistant actually drew on. Resolved server-side, never named by the model. */
export interface AnswerSource {
  id: number;
  documentNumber: string;
  title: string;
  status: string;
  version: string;
}

/** An assistant reply, already normalised. */
export interface AssistantAnswer {
  answer: string;
  sources: AnswerSource[];
  /** What the answer could not take into account, if anything. */
  notice: string;
  message: string;
  success: boolean;
}

/** A proofreading result, already normalised — see the note on proofread() below. */
export interface ProofreadResult {
  correctedHtml: string;
  changed: boolean;
  notice: string;
  message: string;
  success: boolean;
}

/**
 * Client for the DMS AI endpoints (DMSAiController).
 *
 * The model runs on-premises, so nothing here routes through a third-party service — but the
 * feature can legitimately be switched off or the model can be down, which is why every screen
 * asks isEnabled() before offering an AI control rather than showing a button that fails when
 * pressed.
 */
@Injectable({ providedIn: 'root' })
export class DmsAiService {
  private enabled$?: Observable<boolean>;

  constructor(
    private http: HttpClient,
    private _config: AppConfigService,
  ) {}

  private get apiUrl(): string {
    return this._config.baseUrl;
  }

  /**
   * Whether the assistant is configured on the server. Cached for the session: it is deployment
   * configuration, not per-request state, and every editor instance on a page would otherwise ask
   * again. A failed check reports "off" so the UI degrades quietly instead of erroring.
   */
  isEnabled(): Observable<boolean> {
    if (!this.enabled$) {
      this.enabled$ = this.http.get<ApiResponse<any>>(`${this.apiUrl}/DMSAi/status`).pipe(
        map((res) => this.pick(res?.Data, 'Enabled') === true),
        catchError(() => of(false)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.enabled$;
  }

  /**
   * Returns a corrected copy of the content. Never writes anything server-side.
   *
   * The casing is normalised here rather than at the call site. The API serialises these payloads
   * with their C# property names (Data.CorrectedHtml), while most of the app reads camelCase — a
   * mismatch that silently reads as "no correction returned" instead of failing loudly. Keeping the
   * translation in one place means a screen consuming this only ever sees one shape.
   */
  proofread(html: string): Observable<ProofreadResult> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/DMSAi/proofread`, { html })
      .pipe(
        map((res) => {
          const data = res?.Data ?? (res as any)?.data;
          return {
            correctedHtml: this.pick(data, 'CorrectedHtml') ?? '',
            changed: this.pick(data, 'Changed') === true,
            notice: this.pick(data, 'Notice') ?? '',
            message: this.pick(res, 'Message') ?? '',
            success: this.pick(res, 'Success') !== false,
          } as ProofreadResult;
        }),
      );
  }

  /**
   * Asks the DMS assistant a question about documents.
   *
   * The server decides which documents the answer may draw on, from the caller's own access --
   * nothing about that scope is passed from here, and nothing sent from here can widen it.
   */
  ask(question: string): Observable<AssistantAnswer> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/DMSAi/ask`, { question })
      .pipe(
        map((res) => {
          const data = res?.Data ?? (res as any)?.data;
          const sources = this.pick(data, 'Sources') ?? [];
          return {
            answer: this.pick(data, 'Answer') ?? '',
            sources: (Array.isArray(sources) ? sources : []).map((s: any) => ({
              id: this.pick(s, 'Id') ?? 0,
              documentNumber: this.pick(s, 'DocumentNumber') ?? '',
              title: this.pick(s, 'Title') ?? '',
              status: this.pick(s, 'Status') ?? '',
              version: this.pick(s, 'Version') ?? '',
            })),
            notice: this.pick(data, 'Notice') ?? '',
            message: this.pick(res, 'Message') ?? '',
            success: this.pick(res, 'Success') !== false,
          } as AssistantAnswer;
        }),
      );
  }

  /** Reads a field whether the server sent it PascalCase or camelCase. */
  private pick(source: any, name: string): any {
    if (!source) return undefined;
    const lower = name.charAt(0).toLowerCase() + name.slice(1);
    return source[name] !== undefined ? source[name] : source[lower];
  }
}
