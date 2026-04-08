import { Component, Input, Output, EventEmitter, forwardRef, input } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList2 } from '@app/shared/interfaces/interfaces';
import { RoleService } from '@app/shared/services/role.service';
import { BehaviorSubject } from 'rxjs';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';

@Component({
  selector: 'app-role-list',
  imports: [CommonModule, FormsModule, NzSelectModule],
  // templateUrl: './role-list.html',
  // styleUrl: './role-list.css',
  template: `<nz-select
    nzMode="multiple"
    nzPlaceHolder="Select Roles"
    nzAllowClear
    nzShowSearch
    nzServerSearch
    [style.width]="width"
    [(ngModel)]="selectedUser"
    (nzOnSearch)="onSearch($event)"
    (ngModelChange)="onSelectionChange($event)"
  >
    <nz-option *ngFor="let item of data" [nzValue]="item.ID" [nzLabel]="item.NAME"></nz-option>
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
      useExisting: forwardRef(() => RoleList),
      multi: true,
    },
  ],
})
export class RoleList implements ControlValueAccessor {
  @Input() valueKey!: string;
  @Input() labelKey!: string;
  @Input() placeholder = 'Select';
  @Input() width = '200px';
  @Input() allowClear = true;
  @Input() showSearch = true;

  data: SelectList2[] = [];
  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled = false;
  selectedUser: string[] = [];
  loading = false;
  searchChange$ = new BehaviorSubject('');

  constructor(private _roleService: RoleService,
    private _peoplePartnerService: PeoplePartnersService
  ) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.getAllRoles();
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

  onSelectionChange(value: string[]): void {
    this.selectedUser = value;
    this.onChange(value); // VERY IMPORTANT
    this.onTouched();
  }
  // onSelectionChange(value: any): void {
  //   this.value = value;
  //   this.onChange(value);
  //   this.onTouched();
  //   this.valueChange.emit(value);
  // }

  onSearch(value: string): void {
    this.loading = true;
    this.searchChange$.next(value);
  }

  getAllRoles = () => {
    this._peoplePartnerService.GetAllRoles().subscribe((res) => {
      if (res?.Data) {
        this.data = (res.Data ?? []).map((d: any) => ({
          ID: d.Id,
          NAME: d.Value,
        }));
      } else {
        this.data = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };
}
