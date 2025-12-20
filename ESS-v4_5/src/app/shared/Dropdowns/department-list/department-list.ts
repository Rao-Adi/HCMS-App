import { DepartmentService } from '@app/shared/services/department.service';
import { Component, Input, Output, EventEmitter, forwardRef, input } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';

@Component({
  selector: 'app-department-list',
  imports: [CommonModule, FormsModule, NzSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DepartmentList),
      multi: true,
    },
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.css',
})
export class DepartmentList implements ControlValueAccessor {
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

  constructor(private _departmentServices: DepartmentService) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.getAllDepartment();
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

  getAllDepartment = () => {
    this._departmentServices.getDepartmentList().subscribe((res) => {
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
