import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import 'quill-mention';
import 'quill-emoji';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import Quill from 'quill';
import '../AttachmentBlot/attachment.blot';

const BlockEmbed = Quill.import('blots/block/embed');
const icons = Quill.import('ui/icons') as any;
icons['attach'] = '📎';

@Component({
  selector: 'app-dmsrich-text-edit',
  imports: [FormsModule, CommonModule, QuillModule],
  templateUrl: './dmsrich-text-edit.html',
  styleUrl: './dmsrich-text-edit.css',
})
export class DMSRichTextEdit {
  @ViewChild('fileInput') fileInput!: any;
  editor!: QuillEditorComponent;
  hasFocus = false;
  subject: string = '';
  htmlText = '<p>Testing</p>';

  atValues = [
    { id: 1, value: 'Fredrik Sundqvist', link: 'https://google.com' },
    { id: 2, value: 'Patrik Sjölin' },
  ];
  hashValues = [
    { id: 3, value: 'Fredrik Sundqvist 2' },
    { id: 4, value: 'Patrik Sjölin 2' },
  ];

  // Import the Quill object if you're using Quill v1.x (common with ngx-quill)
  // const Quill: any = QuillNamespace;

  // Define your custom font size array (use 'false' for default/normal size)
  fontSizeArr = ['8px', '10px', '12px', '14px', '16px', '18px', '24px', '36px', '48px', false];
  fontFamilyArr = ['roboto', 'arial', 'serif', 'monospace'];

  quillConfig = {
    theme: 'snow',
    toolbar: {
      container: [
        [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
        // [{ size: this.fontSizeArr }],
        [{ font: this.fontFamilyArr }], // 👈 Add this line
        ['bold', 'italic', 'underline'], // toggled buttons
        // ['code-block'],
        // [{ header: 1 }, { header: 2 }], // custom button values
        [{ list: 'ordered' }, { list: 'bullet' }],
        //[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        //[{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        //[{ 'direction': 'rtl' }],                         // text direction

        //[{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        //[{ 'font': [] }],
        //[{ 'align': [] }],

        // ['clean'], // remove formatting button

        ['link'],
        //['link', 'image', 'video']
        ['attach'], // 👈 custom button
      ],
      handlers: {
        attach: () => this.openFilePicker(),
      },
    },

    mention: {
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      mentionDenotationChars: ['@', '#'],
      source: (searchTerm: any, renderList: any, mentionChar: any) => {
        let values;

        if (mentionChar === '@') {
          values = this.atValues;
        } else {
          values = this.hashValues;
        }

        if (searchTerm.length === 0) {
          renderList(values, searchTerm);
        } else {
          const matches = [];
          for (var i = 0; i < values.length; i++)
            if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase()))
              matches.push(values[i]);
          renderList(matches, searchTerm);
        }
      },
    },
    'emoji-toolbar': true,
    'emoji-textarea': false,
    'emoji-shortname': true,
    keyboard: {
      bindings: {
        // shiftEnter: {
        //   key: 13,
        //   shiftKey: true,
        //   handler: (range, context) => {
        //     // Handle shift+enter
        //     console.log("shift+enter")
        //   }
        // },
        enter: {
          key: 13,
          handler: (range: any, context: any) => {
            console.log('enter');
            return true;
          },
        },
      },
    },
  };

  constructor() {}

  test = (event: any) => {
    console.log(event.keyCode);
  };

  onSelectionChanged = (event: any) => {
    console.log('onSelectionChanged', event.html);
    if (event.oldRange == null) {
      this.onFocus();
    }
    if (event.range == null) {
      this.onBlur();
    }
  };

  onContentChanged = (event: any) => {
    console.log(event.html);
  };

  onFocus = () => {
    console.log('On Focus');
  };
  onBlur = () => {
    console.log('Blurred');
  };

  openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    // 🔴 TEST URL
    this.insertAttachment('https://cdn.company.com/files/abc123.pdf', file);

    event.target.value = ''; // reset input

    // this.uploadFile(file).subscribe((res) => {
    //   this.insertAttachment(res.url, file);
    // });
  }

  insertAttachment(url: string, file: File) {
    const quill = this.editor.quillEditor;
    const range = quill.getSelection(true);

    quill.insertEmbed(range.index, 'attachment', {
      url,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    });

    quill.insertText(range.index + 1, '\n');
  }
}


