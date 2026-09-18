import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { AnswerSource, DmsAiService } from '@app/shared/services/dms-ai.service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: Date;
  /** Documents this answer drew on. Resolved by the server, so these are always real records. */
  sources?: AnswerSource[];
  /** What the answer could not take into account — a limit of the system, kept out of the answer. */
  notice?: string;
  isError?: boolean;
}

@Component({
  selector: 'app-aireport',
  imports: [CommonModule, FormsModule, SafeTranslatePipe],
  templateUrl: './aireport.html',
  styleUrl: './aireport.css',
})
export class AIReport implements OnInit, AfterViewChecked {
  // --- PERMISSION FLAGS ---
  canAdd = false;
  canEdit = false;
  canDelete = false;
  formId = 'aireport';

  @ViewChild('scrollBody') private scrollBody?: ElementRef<HTMLElement>;
  private pendingScroll = false;

  /** Whether the server has a model configured. Until this resolves, the composer stays disabled. */
  aiEnabled = false;
  aiChecked = false;

  messages: Message[] = [
    {
      role: 'assistant',
      content:
        'Hi! Ask me about any document you have access to — its due date, its current status, or what it contains.',
      time: new Date(),
    },
  ];

  /** Openers that show what this assistant is for; a blank box in a document system does not. */
  starters: string[] = [
    'When is SOP-001 due for review?',
    'Show me the content of the Quality Policy',
    'Which documents are pending my approval?',
    'List the documents that expire this month',
  ];

  input = '';
  loading = false;

  constructor(private _dmsAi: DmsAiService) {}

  ngOnInit(): void {
    // An installation with no model gets a plain notice instead of a composer that fails on send.
    this._dmsAi.isEnabled().subscribe((enabled) => {
      this.aiEnabled = enabled;
      this.aiChecked = true;
      if (!enabled) {
        this.messages = [
          {
            role: 'assistant',
            content:
              'The AI assistant is not available right now. Please try again later, or contact your administrator.',
            time: new Date(),
            isError: true,
          },
        ];
      }
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  useStarter(text: string): void {
    this.input = text;
    this.send();
  }

  /** Keeps the composer one line tall until the question actually needs more room. */
  autoGrow(el?: HTMLTextAreaElement): void {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  send(composer?: HTMLTextAreaElement): void {
    const question = this.input.trim();
    if (!question || this.loading || !this.aiEnabled) return;

    this.messages.push({ role: 'user', content: question, time: new Date() });

    this.input = '';
    if (composer) composer.style.height = 'auto';
    this.loading = true;
    this.pendingScroll = true;

    this._dmsAi.ask(question).subscribe({
      next: (result) => {
        this.loading = false;
        this.messages.push({
          role: 'assistant',
          content:
            result.success && result.answer
              ? result.answer
              : result.message || 'I could not answer that. Please try rephrasing your question.',
          time: new Date(),
          sources: result.sources,
          notice: result.notice,
          isError: !result.success || !result.answer,
        });
        this.pendingScroll = true;
      },
      error: (err) => {
        this.loading = false;
        // The server already phrases these ("the assistant is busy", "currently unavailable"),
        // so prefer its wording over a generic failure message.
        this.messages.push({
          role: 'assistant',
          content:
            err?.error?.Message ||
            err?.error?.message ||
            'The assistant is unavailable right now. Please try again in a moment.',
          time: new Date(),
          isError: true,
        });
        this.pendingScroll = true;
      },
    });
  }

  ngAfterViewChecked(): void {
    if (!this.pendingScroll) return;
    this.pendingScroll = false;
    const el = this.scrollBody?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
