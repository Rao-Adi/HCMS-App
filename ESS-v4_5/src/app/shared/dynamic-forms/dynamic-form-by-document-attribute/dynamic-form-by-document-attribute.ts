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
    const attributesChanged = changes['attributes'];
    const valuesChanged = changes['attributeValues'];
    const docTypeChanged = changes['documentTypeCode'];

    // If documentTypeCode changed, fetch the document template
    if (docTypeChanged && this.documentTypeCode) {
      this.GetDocumentTemplate();
    }

    // If attributes changed → rebuild the dynamic form
    if (attributesChanged) {
      this.prepareAttributes();
      this.buildDynamicForm(this.attributes || []);

      // Patch immediately if in view mode
      if (this.mode === 'view' && this.attributeValues?.length) {
        this.patchValues();
      }
    }

    // If only values changed → patch existing form
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
      if (!this.form.contains(controlName)) return;

      // The API always returns ValueText/ValueNumber/ValueDate/ValueBoolean together (unused
      // ones default to '' / 0 / '' / false rather than null), so picking the first non-null
      // via `??` doesn't work -- a numeric attribute's ValueNumber: 0 is non-null and wins over
      // a real ValueDate on other rows. Select the field by the attribute's own ControlType.
      const attr = this.attributes?.find((a) => a.Id === val.DocumentAttributeId);
      let value: any;
      switch (attr?.ControlType) {
        case 'date':
          value = val.ValueDate ? new Date(val.ValueDate) : null;
          break;
        case 'numeric':
          value = val.ValueNumber;
          break;
        case 'checkbox':
          value = val.ValueBoolean;
          break;
        default:
          value = val.ValueText;
      }

      this.form.get(controlName)?.setValue(value);
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
