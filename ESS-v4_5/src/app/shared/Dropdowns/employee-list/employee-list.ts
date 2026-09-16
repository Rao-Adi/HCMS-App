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
    name="employeeListInner"
    [nzMode]="nzMode"
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
      *ngFor="let opt of visibleOptions; trackBy: trackByValue"
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

  // Every employee in the company -- the full list is kept in memory (it is one cheap fetch) but
  // deliberately NOT rendered.
  options: Array<{ label: string; value: string }> = [];

  // What the template actually renders. nz-option is an Angular COMPONENT, so *ngFor over the
  // full list instantiated one per employee -- 16,953 of them on this installation -- and every
  // change-detection pass anywhere on the page then had to walk all of them. Each also carried an
  // [innerHTML] binding, so Angular ran its HTML sanitizer that many times too. Measured with a
  // CPU profile of a single row click on Create/Update Document: 2.7s in the sanitizer
  // (getInertBodyElement) and 6.3s of AG Grid layout reads thrashing against that DOM churn,
  // which is what froze the page and made each later keystroke take seconds.
  //
  // nzVirtualHeight/nzVirtualItemSize do not help here: they virtualise the dropdown PANEL, not
  // the *ngFor that creates the option components in the first place.
  visibleOptions: Array<{ label: string; value: string }> = [];

  // Enough to fill the 300px virtual-scroll panel several times over while staying trivial to
  // render. Narrowing further is the search box's job.
  private static readonly MaxVisibleOptions = 50;

  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled = false;

  selectedUser: any = null;
  searchTerm = '';

  // Resolved once in ngOnInit, not bound in the template as a live `isMultiSelect ? 'multiple' :
  // 'default'` expression -- see RoleList's identical fix/comment for the full reasoning. This
  // component has the same pattern and is used with isMultiSelect="false" for the "Additional
  // Approver" picker on create-update-document.html, which was throwing the same NG01203 error.
  nzMode: 'multiple' | 'default' = 'multiple';

  constructor(private _peoplePartnerService: PeoplePartnersService) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.nzMode = this.isMultiSelect ? 'multiple' : 'default';
    this.getAllUsersList();
  }

  onSelectionChange(value: any): void {
    this.selectedUser = value;
    this.refreshVisibleOptions();
    this.onChange(value); // VERY IMPORTANT
    this.onTouched();
  }

  writeValue(value: any): void {
    this.selectedUser = value;
    this.refreshVisibleOptions();
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
    this.refreshVisibleOptions();
  }

  trackByValue = (_: number, opt: { value: string }) => opt.value;

  // Rebuilds the rendered window: everything currently selected (nz-select reads the selected
  // item's LABEL off its option, so dropping it would blank the chip), then the best matches for
  // the current search term, up to the cap. One pass over the in-memory array, no DOM work.
  private refreshVisibleOptions(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();
    const raw = this.selectedUser;
    const selected = new Set<string>(
      Array.isArray(raw) ? raw : raw !== null && raw !== undefined && raw !== '' ? [raw] : [],
    );

    const shown: Array<{ label: string; value: string }> = [];

    if (selected.size) {
      for (const opt of this.options) {
        if (selected.has(opt.value)) shown.push(opt);
      }
    }

    for (const opt of this.options) {
      if (shown.length >= EmployeeList.MaxVisibleOptions) break;
      if (selected.has(opt.value)) continue;
      if (term && !(opt.label || '').toLowerCase().includes(term)) continue;
      shown.push(opt);
    }

    this.visibleOptions = shown;
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
      this.refreshVisibleOptions();
    });
  };
}
