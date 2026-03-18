import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { UserService } from '@app/shared/services/user-service';
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
    nzPlaceHolder="Select users"
    nzAllowClear
    nzShowSearch
    nzServerSearch
    [style.width]="width"
    [(ngModel)]="selectedUser"
    (nzOnSearch)="onSearch($event)"
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

  data: SelectList[] = [];
  
  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled = false;

  // randomUserUrl = 'https://api.randomuser.me/?results=5';
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser: string[] = [];
  loading = false;

  constructor(private _userService: UserService) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    // this.searchChange$
    //   .pipe(
    //     debounceTime(500),
    //     switchMap((name) => this.getRandomNameList(name))
    //   )
    //   .subscribe((data) => {
    //     this.optionList = data;
    //     this.loading = false;
    //   });

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

  onSearch(value: string): void {
    this.loading = true;
    this.searchChange$.next(value);
  }

  getAllUsersList = () => {
    this._userService.getUserList().subscribe((res) => {
      if (res?.Data) {
        this.data = (res.Data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Value,
        }));
      } else {
        this.data = [];
      }
    });
  };
}
