import { Component, Input, Output, EventEmitter, forwardRef, input, OnChanges, SimpleChanges } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { SubDepartmentService } from '@app/shared/services/subdepartment.service';

@Component({
  selector: 'app-sub-department-list',
  imports: [CommonModule, FormsModule, NzSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SubDepartmentList),
      multi: true,
    },
  ],
  templateUrl: './sub-department-list.html',
  styleUrl: './sub-department-list.css',
})
export class SubDepartmentList implements ControlValueAccessor, OnChanges  {
  @Input() department: string | undefined;
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
  isLoading = false;

  constructor(private _subDeparmentServices: SubDepartmentService) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

   ngOnChanges(changes: SimpleChanges) {
    if (changes['department']) {
      const dept = changes['department'].currentValue;
      if (dept) {
        this.isLoading = true;
        this.getAllSubDepartments(dept);
      } else {
        this.data = [];  // Clear if no department selected
      }
    }
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

  getAllSubDepartments = (departmentCode:string) => {
    if (!departmentCode) {
      this.data = [];
      return;
    }
    this._subDeparmentServices.getSubDepartmentsByDivisionCode(departmentCode).subscribe((res) => {
      if (res?.Data) {
        this.data = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Name,
        }));
        this.isLoading = false;
      } else {
        this.data = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };
}
