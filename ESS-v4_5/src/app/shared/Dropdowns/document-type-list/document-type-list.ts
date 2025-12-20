import { Component, Input, Output, EventEmitter, forwardRef, input } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DivisionService } from '@app/shared/services/division.services';
import { SelectList } from '@app/shared/interfaces/interfaces';

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
export class DocumentTypeList implements ControlValueAccessor{
  @Input() valueKey!: string;
  @Input() labelKey!: string;
  @Input() placeholder = 'Select';
  @Input() width = '200px';
  @Input() allowClear = true;
  @Input() showSearch = true;

  data: SelectList[] = [];
  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled = false;

  constructor(private _divisionServices: DivisionService) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.getAllDivisions();
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

  getAllDivisions = () => {
    this._divisionServices.getDivisionList().subscribe((res) => {
      if (res?.Data) {
        this.data = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
      } else {
        this.data = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };
}
