import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ControlTypes, DocumentAttribute } from '@app/shared/interfaces/interfaces';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { TemplateService } from '@app/shared/services/template.service';

@Component({
  selector: 'app-dynamic-form-by-document-attribute',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DMSRichTextEdit,
    SafeTranslatePipe,
    NzSelectModule,
    NzDatePickerModule,
  ],
  templateUrl: './dynamic-form-by-document-attribute.html',
  styleUrl: './dynamic-form-by-document-attribute.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormByDocumentAttribute {
  @Input() attributes!: DocumentAttribute[];
  @Input() documentContentHTML: string ='';
  @Input() documentTypeCode?: string = '';
  @Output() formReady = new EventEmitter<FormGroup>();

  options: string[] = [];
  form!: FormGroup;
  templateHtml: string = '';
  footerRender = (): string => 'extra footer';

  constructor(
    private fb: FormBuilder,
    private documentTemplateService: TemplateService,
  ) {}

  ngOnInit(): void {
    this.GetDocumentTemplate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attributes']?.currentValue?.length) {
      this.prepareAttributes();

      this.buildDynamicForm(this.attributes);
    }
  }

  private prepareAttributes() {
    this.attributes = this.attributes.map((attr) => ({
      ...attr,

      ControlType: attr.ControlType.toLowerCase() as ControlTypes,

      options: attr.ListValues ? attr.ListValues.split(',').map((v) => v.trim()) : [],
    }));
  }

  buildDynamicForm(attributes: DocumentAttribute[]) {
    const group: any = {};

    attributes.forEach((attr) => {
      const controlName = 'ctrl_' + attr.Id;

      const validators = attr.IsMandatory ? [Validators.required] : [];

      // ⭐ numeric starts with null
      const defaultValue = attr.ControlType === 'numeric' ? null : '';

      group[controlName] = [defaultValue, validators];
    });

    // ⭐ ADD RICH TEXT CONTROL
    group['documentContent'] = [this.templateHtml || ''];

    this.form = this.fb.group(group);

    // 🔥 SEND FORM TO PARENT
    Promise.resolve().then(() => {
      this.formReady.emit(this.form);
    });
  }

  GetDocumentTemplate() { 
    var _documentTypeCode = this.documentTypeCode ? this.documentTypeCode : '';
    this.documentTemplateService.getTemplateByDocumentTypeCode(_documentTypeCode).subscribe({
      next: (response) => {
        this.templateHtml = response.Data.TemplateContent;
        // Promise.resolve().then(() => {
        //   this.templateHtml = response.Data.TemplateContent;
        // });
      },
      error: (err) => console.error(err),
    });
  }
}
