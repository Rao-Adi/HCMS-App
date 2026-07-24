import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Pipe({
  name: 'highlightSearch',
  standalone: true,
})
export class HighlightSearchPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string, search: string): SafeHtml | string {
    if (!search || !text) return text;
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const highlighted = text.replace(regex, '<mark class="highlight">$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, FormsModule, NzSelectModule, NzIconModule, HighlightSearchPipe],
  // templateUrl: './employee-list.html',
  // styleUrl: './employee-list.css'
  template: `<nz-select
    [nzMode]="isMultiSelect ? 'multiple' : 'default'"
    [nzPlaceHolder]="placeholder"
    nzAllowClear
    nzShowSearch
    [nzFilterOption]="customFilter"
    [nzDisabled]="disabled"
    [style.width]="width"
    [(ngModel)]="selectedUser"
    (ngModelChange)="onSelectionChange($event)"
    (nzOnSearch)="onSearch($event)"
    nzVirtualHeight="300px"
    nzVirtualItemSize="32"
  >
    <nz-option
      *ngFor="let opt of options"
      [nzValue]="opt.value"
      [nzLabel]="opt.label"
      nzCustomContent
    >
      <span [innerHTML]="opt.label | highlightSearch: searchTerm"></span>
    </nz-option>
  </nz-select>`,
  styles: [
    `
      nz-select {
        width: 100%;
      }

      .loading-icon {
        margin-right: 8px;
      }

      mark.highlight {
        background-color: #ffc107;
        padding: 0;
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
  @Input() isMultiSelect = true;

  options: Array<{ label: string; value: string }> = [];

  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled = false;

  selectedUser: any = null;
  searchTerm = '';

  constructor(private _peoplePartnerService: PeoplePartnersService) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.getAllUsersList();
  }

  onSelectionChange(value: any): void {
    this.selectedUser = value;
    this.onChange(value); // VERY IMPORTANT
    this.onTouched();
  }

  writeValue(value: any): void {
    this.selectedUser = value;
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

  customFilter = (input: string, option: any): boolean => {
    if (!option || !option.nzLabel) return false;
    return option.nzLabel.toLowerCase().indexOf(input.toLowerCase()) > -1;
  };

  onSearch(value: string): void {
    this.searchTerm = value;
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
        this.options = (res.Data ?? [])
          .map((d: any) => ({
            value: d.Code || d.code,
            label: (d.Value ? d.Value + ' (' + d.Code + ')' : d.value) || '',
          }))
          .sort((a: any, b: any) => (a.label || '').localeCompare(b.label || ''));
      } else {
        this.options = [];
      }
    });
  };
}
