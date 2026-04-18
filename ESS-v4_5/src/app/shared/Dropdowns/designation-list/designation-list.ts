import { Component, Input, Output, EventEmitter, forwardRef, input } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { DesignationService } from '@app/shared/services/designation.service'; 
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';

@Component({
  selector: 'app-designation-list',
  imports: [CommonModule, FormsModule, NzSelectModule, NzIconModule],
  //templateUrl: './designation-list.html',
  template: `<nz-select
    nzMode="multiple"
    nzPlaceHolder="Select Designation"
    nzAllowClear
    nzShowSearch
    [nzFilterOption]="customFilter"
    [style.width]="width"
    [(ngModel)]="selectedUser"
    (ngModelChange)="onSelectionChange($event)"
  >
    <nz-option *ngFor="let item of data" [nzValue]="item.CODE" [nzLabel]="item.NAME"></nz-option>
     
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
      useExisting: forwardRef(() => DesignationList),
      multi: true,
    },
  ],
})
export class DesignationList implements ControlValueAccessor {
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
  selectedUser: string[] = [];

  constructor(private _designationServices: DesignationService,
    private _peoplePartnerService: PeoplePartnersService
  ) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.getAllDesignations();
  }

  writeValue(value: any): void {
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

  onSelectionChange(value: string[]): void {
    this.selectedUser = value;
    this.onChange(value); // VERY IMPORTANT
    this.onTouched();
  }

  customFilter = (input: string, option: any): boolean => {
    if (!option || !option.nzLabel) return false;
    return option.nzLabel.toLowerCase().indexOf(input.toLowerCase()) > -1;
  };

  // onSelectionChange(value: any): void {
  //   this.value = value;
  //   this.onChange(value);
  //   this.onTouched();
  //   this.valueChange.emit(value);
  // }

  getAllDesignations = () => {
    this._peoplePartnerService.GetAllDesignationList().subscribe((res) => {
      if (res?.Data) {
        this.data = (res.Data ?? []).map((d: any) => ({
          CODE: d.Id || d.id,
          NAME: d.Value || d.value,
        }));
      } else {
        this.data = [];
      }
      //this.cdr.detectChanges(); // force update
    });
    // this._designationServices.getDesignationList().subscribe((res) => {
    //   if (res?.Data) {
    //     this.data = (res.Data ?? []).map((d: any) => ({
    //       CODE: d.Code,
    //       NAME: d.Value,
    //     }));
    //   } else {
    //     this.data = [];
    //   }
    //   //this.cdr.detectChanges(); // force update
    // });
  };
}
