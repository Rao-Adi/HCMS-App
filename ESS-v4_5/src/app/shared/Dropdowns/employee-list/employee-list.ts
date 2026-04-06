import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'; 
import { PeoplePartnersService } from '@app/shared/services/people-partners.service'; 
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, FormsModule, NzSelectModule, NzIconModule],
  // templateUrl: './employee-list.html',
  // styleUrl: './employee-list.css'
  template: `<nz-select
    nzMode="multiple"
    [nzPlaceHolder]="placeholder"
    nzAllowClear
    nzShowSearch
    [nzDisabled]="disabled"
    [style.width]="width"
    [(ngModel)]="selectedUser"
    (ngModelChange)="onSelectionChange($event)"
    nzVirtualHeight="300px"
    nzVirtualItemSize="32"
    [nzOptions]="options"
  >
  </nz-select>`,
  styles: [
    `
      nz-select {
        width: 100%;
      }

      .loading-icon {
        margin-right: 8px;
      }
    `,
  ],
  //styleUrl: './designation-list.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmployeeList),
      multi: true,
    },
  ],
})
export class EmployeeList {
  @Input() valueKey!: string;
  @Input() labelKey!: string;
  @Input() placeholder = 'Select';
  @Input() width = '200px';
  @Input() allowClear = true;
  @Input() showSearch = true;

  options: Array<{ label: string; value: string }> = [];
  
  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled = false;

  selectedUser: string[] = [];

  constructor(private _peoplePartnerService: PeoplePartnersService) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.getAllUsersList();
  }

  onSelectionChange(value: string[]): void {
    this.selectedUser = value;
    this.onChange(value); // VERY IMPORTANT
    this.onTouched();
  }

  writeValue(value: string[]): void {
    this.selectedUser = value || [];
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

  // onSelectionChange(value: any): void {
  //   this.value = value;
  //   this.onChange(value);
  //   this.onTouched();
  //   this.valueChange.emit(value);
  // }

  getAllUsersList = () => { 
    this._peoplePartnerService.GetEmployeeList().subscribe((res) => {
      if (res?.Data) {
        this.options = (res.Data ?? []).map((d: any) => ({
          value: d.Code,
          label: d.Value,
        }));
      } else {
        this.options = [];
      }
    });
  };
}
