import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectorRef,
} from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { DocumentTypeService } from '@app/shared/services/documentType.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { of } from 'rxjs';

@Component({
  selector: 'app-document-type-list',
  imports: [CommonModule, FormsModule, NzSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DocumentTypeList),
      multi: true,
    },
  ],
  templateUrl: './document-type-list.html',
  styleUrl: './document-type-list.css',
})
export class DocumentTypeList implements ControlValueAccessor {
  @Input() valueKey!: string;
  @Input() labelKey!: string;
  @Input() placeholder = 'Select';
  @Input() width = '200px';
  @Input() allowClear = true;
  @Input() showSearch = true;
  @Output() valueChange = new EventEmitter<any>();

  DocTypeData: SelectList[] = [];

  value: any;
  disabled = false;

  constructor(
    private _documentTypeService: DocumentTypeService,
    private _masterCacheService: Mastercacheservice,
    private cdr: ChangeDetectorRef,
  ) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.getDocumentTypeList();
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectionChange(value: any): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
  }

  getDocumentTypeList = () => {
    const cacheKey = (MASTER_CACHE_KEYS as any).DOCUMENT_TYPES || 'DOCUMENT_TYPES';

    this._masterCacheService
      .getMasterData({
        cacheKey: cacheKey,
        getCount$: () =>
          (this._documentTypeService as any).getDocumentTypeCount
            ? (this._documentTypeService as any).getDocumentTypeCount()
            : of(1000),
        getData$: () =>
          this._documentTypeService.GetAllDocumentTypes('', 'DESC', 'CreatedAt', true, 1, 1000),
        mapFn: (d: any) => ({
          Id: d.Id || d.id,
          Code: d.Code || d.code,
          Name: d.Name || d.name,
          IsActive: d.isActive || d.IsActive || false,
          IsDeleted: d.isDeleted || d.IsDeleted || false,
          CreatedBy: d.CreatedBy || d.createdBy || '',
          CreatedByName:
            d.CreateByName || d.createByName || d.CreatedByName || d.createdByName || '',
          CreatedAt: new CustomDateFormatPipe().transform(d.CreatedAt || d.createdAt || ''),
          LastModifiedBy: d.LastModifiedBy || d.lastModifiedBy || '',
          LastModifiedByName: d.LastModifiedByName || d.lastModifiedByName || '',
          LastModifiedAt: new CustomDateFormatPipe().transform(
            d.LastModifiedAt || d.lastModifiedAt || '',
          ),
        }),
      })
      .subscribe((data) => {
        this.DocTypeData = (data ?? []).map((d: any) => ({
          CODE: d.Code || d.code || d.CODE,
          NAME: d.Name || d.name || d.NAME,
        }));
        this.cdr.markForCheck();
      });
  };
}
