import { Component, Input, Output, EventEmitter, forwardRef, input } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { DesignationService } from '@app/shared/services/designation.service';

@Component({
  selector: 'app-designation-list',
  imports: [CommonModule, FormsModule, NzSelectModule],
  templateUrl: './designation-list.html',
  styleUrl: './designation-list.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DesignationList),
      multi: true,
    },
  ],
})
export class DesignationList  implements ControlValueAccessor {
  
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

  constructor(private _designationServices: DesignationService) {}

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
    this._designationServices.getDesignationList().subscribe((res) => {
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
