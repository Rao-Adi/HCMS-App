import { Component, Input, Output, EventEmitter, forwardRef, input } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { DesignationService } from '@app/shared/services/designation.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';

@Component({
  selector: 'app-designation-list',
  imports: [CommonModule, FormsModule, NzSelectModule, NzIconModule],
  //templateUrl: './designation-list.html',
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
 
  searchChange$ = new BehaviorSubject('');
  optionList: string[] = [];
  selectedUser: string[] = [];
  loading = false;

  constructor(private _designationServices: DesignationService,
    private _peoplePartnerService: PeoplePartnersService
  ) {}

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

    this.getAllDesignations();
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

  getAllDesignations = () => {
    this._peoplePartnerService.GetAllDesignationList().subscribe((res) => {
      if (res?.Data) {
        this.data = (res.Data ?? []).map((d: any) => ({
          CODE: d.Id,
          NAME: d.Value,
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

  onSearch(value: string): void {
    this.loading = true;
    this.searchChange$.next(value);
  }

  // getRandomNameList(name: string): Observable<string[]> {
  //   return this.http.get<{ results: MockUser[] }>(`${this.randomUserUrl}`).pipe(
  //     map((res) => res.results),
  //     catchError(() => of<MockUser[]>([])),
  //     map((list) => list.map((item) => `${item.name.first} ${name}`))
  //   );
  // }
}
