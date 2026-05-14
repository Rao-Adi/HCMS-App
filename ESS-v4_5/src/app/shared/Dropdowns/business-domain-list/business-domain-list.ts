import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  input,
  SimpleChanges,
} from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { BusinessDomainService } from '@app/shared/services/businessDomain.service';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

@Component({
  selector: 'app-business-domain-list',
  imports: [CommonModule, FormsModule, NzSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BusinessDomainList),
      multi: true,
    },
  ],
  templateUrl: './business-domain-list.html',
  styleUrl: './business-domain-list.css',
})
export class BusinessDomainList implements ControlValueAccessor {
  @Input() subDepartment: string | undefined;
  @Input() valueKey!: string;
  @Input() labelKey!: string;
  @Input() placeholder = 'Select';
  @Input() width = '200px';
  @Input() allowClear = true;
  @Input() showSearch = true;

  totalDepartments = 0;
  domains: SelectList[] = [];
  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled = false;
  isLoading = false;

  constructor(
    private _businessDomainService: BusinessDomainService,
    private _masterCacheService: Mastercacheservice,
  ) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() { 
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['subDepartment']) {
      const dept = changes['subDepartment'].currentValue;
      if (dept) {
        this.isLoading = true;
        this.getAllBusinessDomainBySubDepartmentCode(dept);
      } else {
        this.domains = []; // Clear if no department selected
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

  getAllBusinessDomainBySubDepartmentCode = (subdepartmentCode: string) => {
    // Optional: early exit / guard clause
    if (!subdepartmentCode?.trim()) {
      this.domains = [];
      this.isLoading = false;
      return;
    }

    const cacheKey = MASTER_CACHE_KEYS.BUSINESS_DOMAIN;

    this._masterCacheService
      .getMasterData({
        // Using a division-specific cache key → prevents polluting the global departments cache
        cacheKey: cacheKey,

        // Get total count of departments in this division
        getCount$: () => this._businessDomainService.getBusinessDomainCount(),

        // Main domains fetch – assuming your service has (or will have) this method
        // If it doesn't exist yet → implement getDepartmentsBysubdepartmentCodeCached or similar
        getData$: () =>
          this._businessDomainService.GetAllBusinessDomains(
            '', 
            'ASC',
            'Name',
            true,
            1,
            1000, 
          ),

        // Same mapping logic as in GetAllDepartments
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          SubDepartment: item.SubDepartment || item.subDepartment || '',
          SubDepartmentCode: item.SubDepartmentCode || item.subDepartmentCode || '',
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedByName: item.CreateByName || item.createByName || item.CreatedByName || item.createdByName || '',
          CreatedAt: new CustomDateFormatPipe().transform(item.CreatedAt || item.createdAt || ''),
          LastModifiedBy: item.LastModifiedBy || item.lastModifiedBy || '',
          LastModifiedByName: item.LastModifiedByName || item.lastModifiedByName || '',
          LastModifiedAt: new CustomDateFormatPipe().transform(
            item.LastModifiedAt || item.lastModifiedAt || '',
          ),
        }),
      })
      .subscribe({
        next: (mappedData) => {
          // Filter only the departments that match the requested subdepartmentCode
          // (in case the backend returns more than expected or cache is shared)
          const filtered = (mappedData ?? []).filter(
            (d) => d.SubDepartmentCode?.toUpperCase() === subdepartmentCode.toUpperCase(),
          );

          this.domains = filtered.map((d) => ({
            CODE: d.Code,
            NAME: d.Name,
          }));

          this.totalDepartments = filtered.length; // optional – if you want to show count
          this.isLoading = false;

          // this.cdr.detectChanges(); // only if you're in OnPush change detection
        },
        error: (err) => {
          console.error('Failed to load departments by division', err);
          this.domains = [];
          this.isLoading = false;
        },
      });
  };
 
}
