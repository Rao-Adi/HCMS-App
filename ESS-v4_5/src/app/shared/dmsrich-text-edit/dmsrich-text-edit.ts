import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
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
  ReactiveFormsModule,
} from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
// import 'quill-mention';
// import 'quill-emoji';
// import { QuillEditorComponent, QuillModule } from 'ngx-quill';
// import Quill from 'quill';
// import '../AttachmentBlot/attachment.blot';

// const BlockEmbed = Quill.import('blots/block/embed');
// const icons = Quill.import('ui/icons') as any;
// icons['attach'] = '📎';

import { Validators, toHTML, Editor, Toolbar, NgxEditorModule } from 'ngx-editor';
import { QuillModule } from 'ngx-quill';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dmsrich-text-edit',
  imports: [FormsModule, CommonModule, NgxEditorModule, ReactiveFormsModule],
  templateUrl: './dmsrich-text-edit.html',
  styleUrl: './dmsrich-text-edit.css',
  encapsulation: ViewEncapsulation.None,
})
export class DMSRichTextEdit implements OnInit, OnDestroy, OnChanges {
  @Output() contentHtmlChange = new EventEmitter<string>();
  // @Input() contentHtml: string = '';

  private _contentHtml = '';
  @Input()
  set contentHtml(value: string | null | undefined) {
    this._contentHtml = value ?? '';

    this.form.get('editorContent')?.setValue(this._contentHtml, { emitEvent: false });
  }

  get contentHtml() {
    return this._contentHtml;
  }

  @Input() editorStyle: any = {};

  editordoc = 'jsonDoc';
  jsonDoc: string = '';
  editor: Editor = new Editor();
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  form = new FormGroup({
    editorContent: new FormControl({ value: this.jsonDoc, disabled: false }, Validators.required()),
  });

  private destroy$ = new Subject<void>();

  get doc(): any {
    return this.form.get('editorContent');
  }

  ngOnInit() {
    this.editor = new Editor();
    this.form
      .get('editorContent')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (!value) return;
        this.contentHtmlChange.emit(value);
      });
    // this.form.get('editorContent')!.valueChanges.subscribe((value: any) => {
    //   if (!value) return;

    //   //const html = toHTML(value);
    //   this.contentHtmlChange.emit(value);
    // });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.editor.destroy();
  }

  ngOnChanges(changes: SimpleChanges) { 
    if (changes['contentHtml']) {
      const value = changes['contentHtml'].currentValue ?? '';

      this.form.patchValue({ editorContent: value }, { emitEvent: false });
    }
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
}
