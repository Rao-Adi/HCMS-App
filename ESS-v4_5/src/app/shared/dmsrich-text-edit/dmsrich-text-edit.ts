import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { Validators, toHTML, Editor, Toolbar, NgxEditorModule } from 'ngx-editor';
import { QuillEditorComponent } from 'ngx-quill';
import { Subject, takeUntil } from 'rxjs';

import { VERSION } from '@angular/core';
import { DmsAiService } from '@app/shared/services/dms-ai.service';

@Component({
  selector: 'app-dmsrich-text-edit',
  imports: [FormsModule, CommonModule, NgxEditorModule, ReactiveFormsModule, QuillEditorComponent],
  templateUrl: './dmsrich-text-edit.html',
  styleUrl: './dmsrich-text-edit.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DMSRichTextEdit),
      multi: true,
    },
  ],
})
export class DMSRichTextEdit implements OnInit {
  @Output() contentHtmlChange = new EventEmitter<string>();
  @Input() contentHtml: string = '';
  @Input() IsReadyOnly: boolean = false;
  @Input() editorStyle: any = {};

  @ViewChild('editor') editor!: QuillEditorComponent;

  name = 'Angular ' + VERSION.major;
  // @ViewChild('editor') editor: QuillEditorComponent;
  // editor!: QuillEditorComponent;
  contentChange: string = '';

  modules = {
    toolbar: {
      container: [
        [{ header: [] }],
        [
          {
            size: ['small', 'normal', 'large', 'huge'],
          },
        ],
        ['bold', 'italic', 'underline', 'strike', 'link'],
      ],
    },
  };

  modules2 = {
    toolbar: {
      container: [
        [{ header: [] }],
        [
          {
            size: ['small', 'normal', 'large', 'huge'],
          },
        ],
        ['bold', 'italic', 'underline', 'strike', 'link'],
      ],
      handlers: {
        link: function (value: any) {
          if (value) {
            var href = prompt('Enter the URL');
            // this.editor.quillEditor.format('link', href);
            // this.editor.format('link', href);
            return;
          } else {
            //this.editor.quillEditor.format('link', false);
          }
        },
      },
    },
  };

  constructor(
    private _dmsAi: DmsAiService,
    private _cdr: ChangeDetectorRef,
  ) {}

  // ── AI proofreading ───────────────────────────────────────────────────────
  // Whether the server has a model configured. Asked once per session by the service.
  aiEnabled = false;
  aiBusy = false;
  /** The corrected HTML waiting for the author to accept. null when there is nothing to apply. */
  aiSuggestion: string | null = null;
  aiMessage = '';
  aiIsError = false;

  ngOnInit() {
    this._dmsAi.isEnabled().subscribe((enabled) => {
      this.aiEnabled = enabled;
      // OnPush: this resolves after the first render, so the button would not appear without it.
      this._cdr.markForCheck();
    });
  }

  /**
   * Sends the current content for a spelling and grammar pass.
   *
   * The result is held, not written. On a controlled document the author has to see what changed
   * and accept it -- this is the same "generate-only" stance the rest of the DMS AI takes.
   */
  runProofread(): void {
    if (this.aiBusy) return;

    const current = this.editor?.quillEditor?.root?.innerHTML ?? this.contentHtml ?? '';
    // Quill leaves this behind for an empty editor; treating it as content would send a request
    // that can only come back "no issues found".
    const isEmpty = !current || current.replace(/<[^>]*>/g, '').trim().length === 0;
    if (isEmpty) {
      this.showAiMessage('There is no content to check yet.', true);
      return;
    }

    this.aiBusy = true;
    this.aiSuggestion = null;
    this.aiMessage = '';
    this._cdr.markForCheck();

    this._dmsAi.proofread(current).subscribe({
      next: (result) => {
        this.aiBusy = false;

        if (!result.success || !result.correctedHtml) {
          this.showAiMessage(result.message || 'The spell check could not be completed.', true);
          return;
        }

        if (!result.changed) {
          this.showAiMessage('No spelling or grammar issues were found.', false);
          return;
        }

        this.aiSuggestion = result.correctedHtml;
        this.aiIsError = false;
        this.aiMessage = result.notice || 'AI-generated correction. Review before applying.';
        this._cdr.markForCheck();
      },
      error: (err) => {
        this.aiBusy = false;
        // The server already phrases these ("the assistant is busy", "currently unavailable"),
        // so prefer its wording over a generic failure message.
        this.showAiMessage(
          err?.error?.Message || err?.error?.message || 'The spell check is unavailable right now.',
          true,
        );
      },
    });
  }

  /** Writes the accepted correction into the editor and tells the parent, as a normal edit would. */
  applyProofread(): void {
    if (this.aiSuggestion === null) return;

    const corrected = this.aiSuggestion;
    this.aiSuggestion = null;

    let applied = corrected;
    if (this.editor?.quillEditor) {
      // Same call ngOnChanges uses to load content: on its own it replaces the whole document.
      // (Clearing first with setText('') leaves Quill's trailing newline behind as an extra
      // empty paragraph.)
      this.editor.quillEditor.clipboard.dangerouslyPasteHTML(corrected);

      // Read back what Quill actually holds rather than assuming it kept our markup verbatim --
      // it normalises as it parses. Emitting the normalised value is what the parent would have
      // received from a real edit, and it keeps ngOnChanges' 'incoming !== current' guard from
      // firing a redundant re-paste that would jump the cursor.
      applied = this.editor.quillEditor.root.innerHTML;
    }

    this.contentHtml = applied;
    this.contentHtmlChange.emit(applied);

    // The bar disappearing on its own reads as 'nothing happened'; say plainly that it did.
    this.aiMessage = 'Correction applied.';
    this.aiIsError = false;
    this._cdr.markForCheck();
  }

  dismissProofread(): void {
    this.aiSuggestion = null;
    this.aiMessage = '';
    this.aiIsError = false;
    this._cdr.markForCheck();
  }

  private showAiMessage(message: string, isError: boolean): void {
    this.aiSuggestion = null;
    this.aiMessage = message;
    this.aiIsError = isError;
    this._cdr.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['contentHtml'] && this.editor?.quillEditor) {
      // Guard against a feedback loop: every keystroke emits contentHtmlChange, the parent
      // writes it straight back into [contentHtml], which re-triggers this hook. Re-pasting
      // HTML the editor already has resets Quill's cursor to the start on every keystroke.
      // Only re-sync when the incoming value actually differs from what's already in the
      // editor — i.e. it came from outside (initial load, switching records, etc).
      // Must still run when the incoming value is empty (previously gated on `this.contentHtml`
      // being truthy) -- otherwise clearing contentHtml externally, e.g. removing an uploaded
      // file whose conversion had populated the editor, left the stale content on screen even
      // though the parent's own state was already cleared.
      const current = this.editor.quillEditor.root.innerHTML;
      const incoming = this.contentHtml || '';
      if (incoming !== current) {
        if (incoming) {
          this.editor.quillEditor.clipboard.dangerouslyPasteHTML(incoming);
        } else {
          this.editor.quillEditor.setText('');
        }
      }
    }
  }

  editorCreated(quill: any) {
  if (this.contentHtml) {
    quill.clipboard.dangerouslyPasteHTML(this.contentHtml);
  }
}
  // Initial Text Editors
  // editorCreated(quill: any) {
  //   quill.insertText(0, 'Hello world');
  // }

  clearText() {
    this.editor.quillEditor.setContents([]);
  }

  changeContent(quill: any) {
    // ngx-quill's ContentChange fires for BOTH genuine user edits and our own programmatic
    // changes (ngOnChanges' dangerouslyPasteHTML/setText calls above, e.g. when a parent clears
    // contentHtml externally). quill.source distinguishes them ('user' vs 'api'/'silent') --
    // without this check, our own clear re-emits contentHtmlChange back up to the parent
    // mid-change-detection-cycle, which is exactly what was throwing NG0100
    // (ExpressionChangedAfterItHasBeenCheckedError: '' -> '<p><br></p>') when a parent set
    // contentHtml = '' while this editor was already mid-render.
    if (quill.source && quill.source !== 'user') return;

    this.contentChange = quill.editor.root.innerHTML;
    this.contentHtmlChange.emit(this.contentChange);
  }

  addHandlers() {
    var toolbar = this.editor.quillEditor.getModule('toolbar');
    //toolbar.handlers.addHandlers('bold', false);
  }

  // // @Input() contentHtml: string = '';
  // private onChange = (value: any) => {};
  // private onTouched = () => {};

  // private _contentHtml = '';
  // // @Input()
  // // set contentHtml(value: string | null | undefined) {
  // //   this._contentHtml = value ?? '';

  // //   this.form.get('editorContent')?.setValue(this._contentHtml, { emitEvent: false });
  // // }

  // @Input()
  // set contentHtml(value: string | null | undefined) {
  //   const newValue = value ?? '';

  //   if (newValue === this.form.get('editorContent')?.value) {
  //     return; // 🚀 prevent reset loop
  //   }

  //   this._contentHtml = newValue;

  //   this.form.get('editorContent')?.setValue(newValue, { emitEvent: false });
  // }

  // get contentHtml() {
  //   return this._contentHtml;
  // }

  // @Input() editorStyle: any = {};

  // editordoc = 'jsonDoc';
  // jsonDoc: string = '';
  // editor: Editor = new Editor();
  // toolbar: Toolbar = [
  //   ['bold', 'italic'],
  //   ['underline', 'strike'],
  //   ['code', 'blockquote'],
  //   ['ordered_list', 'bullet_list'],
  //   [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
  //   ['link', 'image'],
  //   ['text_color', 'background_color'],
  //   ['align_left', 'align_center', 'align_right', 'align_justify'],
  // ];

  // form = new FormGroup({
  //   editorContent: new FormControl({ value: this.jsonDoc, disabled: false }, Validators.required()),
  // });

  // private destroy$ = new Subject<void>();

  // get doc(): any {
  //   return this.form.get('editorContent');
  // }

  // ngOnInit() {
  //   this.editor = new Editor();
  //   this.form
  //     .get('editorContent')!
  //     .valueChanges.pipe(takeUntil(this.destroy$))
  //     .subscribe((value) => {
  //       //if (!value) return;
  //       this._contentHtml = value ?? '';
  //       this.contentHtmlChange.emit(this._contentHtml);
  //     });
  //   // this.form.get('editorContent')!.valueChanges.subscribe((value: any) => {
  //   //   if (!value) return;

  //   //   //const html = toHTML(value);
  //   //   this.contentHtmlChange.emit(value);
  //   // });
  // }

  // ngOnDestroy() {
  //   this.destroy$.next();
  //   this.destroy$.complete();
  //   this.editor.destroy();
  // }

  // // ngOnChanges(changes: SimpleChanges) {
  // //   if (changes['contentHtml']) {
  // //     const value = changes['contentHtml'].currentValue ?? '';
  // //     this.form.patchValue({ editorContent: value }, { emitEvent: false });
  // //   }
  // // }

  // writeValue(value: string): void {
  //   if (value) {
  //     //this.setEditorContent(value); // your method
  //   }
  // }

  // registerOnChange(fn: any): void {
  //   this.onChange = fn;
  // }

  // registerOnTouched(fn: any): void {
  //   this.onTouched = fn;
  // }

  // // call this whenever editor content changes
  // handleEditorChange(html: string) {
  //   this.onChange(html);
  //   this.onTouched();
  // }
}

//   @Output() contentChange = new EventEmitter<string>();
//   @Input() quillStyle: any;
//   @ViewChild('fileInput') fileInput!: any;
//   @ViewChild(QuillEditorComponent, { static: true })
//   editor!: QuillEditorComponent;

//   hasFocus = false;
//   subject: string = '';
//   htmlText = '<p>Testing</p>';

//   atValues = [
//     { id: 1, value: 'Fredrik Sundqvist', link: 'https://google.com' },
//     { id: 2, value: 'Patrik Sjölin' },
//   ];
//   hashValues = [
//     { id: 3, value: 'Fredrik Sundqvist 2' },
//     { id: 4, value: 'Patrik Sjölin 2' },
//   ];

//   // Import the Quill object if you're using Quill v1.x (common with ngx-quill)
//   // const Quill: any = QuillNamespace;

//   // Define your custom font size array (use 'false' for default/normal size)
//   fontSizeArr = ['8px', '10px', '12px', '14px', '16px', '18px', '24px', '36px', '48px', false];
//   fontFamilyArr = ['roboto', 'arial', 'serif', 'monospace'];

//   quillConfig = {
//     theme: 'snow',
//     toolbar: {
//       container: [
//         [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
//         // [{ size: this.fontSizeArr }],
//         [{ font: this.fontFamilyArr }], // 👈 Add this line
//         ['bold', 'italic', 'underline'], // toggled buttons
//         // ['code-block'],
//         // [{ header: 1 }, { header: 2 }], // custom button values
//         [{ list: 'ordered' }, { list: 'bullet' }],
//         //[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
//         //[{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
//         //[{ 'direction': 'rtl' }],                         // text direction

//         //[{ 'header': [1, 2, 3, 4, 5, 6, false] }],

//         //[{ 'font': [] }],
//         //[{ 'align': [] }],

//         // ['clean'], // remove formatting button

//         ['link'],
//         //['link', 'image', 'video']
//         ['attach'], // 👈 custom button
//       ],
//       handlers: {
//         attach: () => this.openFilePicker(),
//       },
//     },

//     mention: {
//       allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
//       mentionDenotationChars: ['@', '#'],
//       source: (searchTerm: any, renderList: any, mentionChar: any) => {
//         let values;

//         if (mentionChar === '@') {
//           values = this.atValues;
//         } else {
//           values = this.hashValues;
//         }

//         if (searchTerm.length === 0) {
//           renderList(values, searchTerm);
//         } else {
//           const matches = [];
//           for (var i = 0; i < values.length; i++)
//             if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase()))
//               matches.push(values[i]);
//           renderList(matches, searchTerm);
//         }
//       },
//     },
//     'emoji-toolbar': true,
//     'emoji-textarea': false,
//     'emoji-shortname': true,
//     keyboard: {
//       bindings: {
//         // shiftEnter: {
//         //   key: 13,
//         //   shiftKey: true,
//         //   handler: (range, context) => {
//         //     // Handle shift+enter
//         //     console.log("shift+enter")
//         //   }
//         // },
//         enter: {
//           key: 13,
//           handler: (range: any, context: any) => {
//             console.log('enter');
//             return true;
//           },
//         },
//       },
//     },
//   };

//   constructor() {}

//   onSelectionChanged = (event: any) => {
//     debugger;
//     console.log('onSelectionChanged', event.html);
//     if (event.oldRange == null) {
//       this.onFocus();
//     }
//     if (event.range == null) {
//       this.onBlur();
//     }
//   };

//   onModelChange(value: string) {
//   console.log('HTML:', value);
//   this.contentChange.emit(value);
// }

//   onContentChanged(event: any) {
//     debugger;
//     console.log('HTML:', event.html);
//     this.contentChange.emit(event.html);
//   }

//   onFocus = () => {
//     console.log('On Focus');
//   };
//   onBlur = () => {
//     console.log('Blurred');
//   };

//   openFilePicker() {
//     this.fileInput.nativeElement.click();
//   }

//   onFileSelected(event: any) {
//     const file: File = event.target.files[0];
//     if (!file) return;

//     // 🔴 TEST URL
//     this.insertAttachment('https://cdn.company.com/files/abc123.pdf', file);

//     event.target.value = ''; // reset input

//     // this.uploadFile(file).subscribe((res) => {
//     //   this.insertAttachment(res.url, file);
//     // });
//   }

//   insertAttachment(url: string, file: File) {
//     const quill = this.editor.quillEditor;
//     const range = quill.getSelection(true);

//     quill.insertEmbed(range.index, 'attachment', {
//       url,
//       name: file.name,
//       size: `${(file.size / 1024).toFixed(1)} KB`,
//     });

//     quill.insertText(range.index + 1, '\n');
//   }
