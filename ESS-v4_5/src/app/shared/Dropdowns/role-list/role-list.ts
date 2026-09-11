import { Component, Input, Output, EventEmitter, forwardRef, input, Pipe, PipeTransform } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList2 } from '@app/shared/interfaces/interfaces';  
import { PeoplePartnersService } from '@app/shared/services/people-partners.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlightSearch',
  standalone: true
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
  selector: 'app-role-list',
  imports: [CommonModule, FormsModule, NzSelectModule, HighlightSearchPipe],
  // templateUrl: './role-list.html',
  // styleUrl: './role-list.css',
  template: `<nz-select
    name="roleListInner"
    [nzMode]="nzMode"
    nzPlaceHolder="Select Roles"
    nzAllowClear
    nzShowSearch
    [nzFilterOption]="customFilter"
    [style.width]="width"
    [(ngModel)]="selectedUser"
    (ngModelChange)="onSelectionChange($event)"
    (nzOnSearch)="onSearch($event)"
  >
    <nz-option *ngFor="let item of data" [nzValue]="item.ID" [nzLabel]="item.NAME" nzCustomContent>
      <span [innerHTML]="item.NAME | highlightSearch:searchTerm"></span>
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
  @Input() isMultiSelect = true;

  data: SelectList2[] = [];
  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled = false;
  selectedUser: any = null;
  searchTerm = '';

  // Resolved once in ngOnInit (not bound in the template as `isMultiSelect ? 'multiple' :
  // 'default'`) -- nz-select's nzMode isn't designed to be re-evaluated as a reactive
  // expression on every change-detection cycle; every OTHER usage of this component in the app
  // relies on the default (multiple) and never hit this, but the one place that explicitly
  // passes isMultiSelect="false" (create-update-document.html's Trainers card) was intermittently
  // throwing NG01203 "No value accessor for form control" the moment this component's view was
  // freshly created -- consistent with nz-select's internal mode-dependent setup racing against
  // Angular's own NgModel value-accessor registration when nzMode is a live expression instead
  // of a value that's stable from first render onward.
  nzMode: 'multiple' | 'default' = 'multiple';

  constructor(private _peoplePartnerService: PeoplePartnersService
  ) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.nzMode = this.isMultiSelect ? 'multiple' : 'default';
    this.getAllRoles();
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

  onSelectionChange(value: any): void {
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

  customFilter = (input: string, option: any): boolean => {
    if (!option || !option.nzLabel) return false;
    return option.nzLabel.toLowerCase().indexOf(input.toLowerCase()) > -1;
  };

  onSearch(value: string): void {
    this.searchTerm = value;
  }

  getAllRoles = () => {
    this._peoplePartnerService.GetAllRoles().subscribe((res) => {
      if (res?.Data) {
        this.data = (res.Data ?? [])
          .map((d: any) => ({
            ID: d.Id || d.id,
            NAME: d.Value || d.value,
          }))
          .sort((a: any, b: any) => (a.NAME || '').localeCompare(b.NAME || ''));
      } else {
        this.data = [];
      }
      //this.cdr.detectChanges(); // force update
    });
  };
}
