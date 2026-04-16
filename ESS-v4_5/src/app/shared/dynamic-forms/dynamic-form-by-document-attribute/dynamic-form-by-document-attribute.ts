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
  @Input() documentContentHTML: string = '';
  @Input() documentTypeCode?: string = '';
  @Output() formReady = new EventEmitter<FormGroup>();

  @Input() mode: 'create' | 'view' = 'create';
  @Input() attributeValues: any[] = []; // values from API

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
    // const attributesExist = this.attributes?.length;
    // const valuesExist = this.attributeValues?.length;

    const attributesChanged = changes['attributes'];
    const valuesChanged = changes['attributeValues'];

    // 1️⃣ If attributes changed → rebuild form
    if (attributesChanged && this.attributes?.length) {
      this.prepareAttributes();
      this.buildDynamicForm(this.attributes);

      // Patch immediately if in view mode
      if (this.mode === 'view' && this.attributeValues?.length) {
        this.patchValues();
      }
    }

    // 2️⃣ If only values changed → patch existing form
    if (valuesChanged && this.mode === 'view' && this.form && this.attributeValues?.length) {
      this.patchValues();
    }
  }

  private prepareAttributes() {
    this.attributes = this.attributes.map((attr) => ({
      ...attr,

      // ControlType: attr.ControlType.toLowerCase() as ControlTypes,

      options: attr.ListValues ? attr.ListValues.split(',').map((v) => v.trim()) : [],
    }));
  }

  buildDynamicForm(attributes: DocumentAttribute[]) {
    const group: any = {};

    attributes.forEach((attr) => {
      const controlName = 'ctrl_' + attr.Id;

      const validators = attr.IsMandatory && this.mode === 'create' ? [Validators.required] : [];

      const defaultValue = attr.ControlType === 'numeric' ? null : '';

      group[controlName] = [defaultValue, validators];
    });

    group['documentContent'] = [this.templateHtml || ''];

    this.form = this.fb.group(group);

    if (this.mode === 'create') {
      Promise.resolve().then(() => {
        this.formReady.emit(this.form);
      });
    }
  }

  private patchValues() {
    if (!this.form) return;

    this.attributeValues.forEach((val) => {
      const controlName = 'ctrl_' + val.DocumentAttributeId; // ⚠ make sure casing matches API

      const value = val.ValueText ?? val.ValueNumber ?? val.ValueDate ?? val.ValueBoolean;

      if (this.form.contains(controlName)) {
        this.form.get(controlName)?.setValue(value);
      }
    });

    this.form.disable();
  }

  GetDocumentTemplate() { 
    var _documentTypeCode = this.documentTypeCode ? this.documentTypeCode : '';
    if (_documentTypeCode === '') {
      console.warn('No document type code provided, skipping template fetch.');
      return;
    }
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
