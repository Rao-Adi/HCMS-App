import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { SubDepartmentService } from '@app/shared/services/subdepartment.service';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';

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
export class SubDepartmentList implements ControlValueAccessor, OnChanges {
  @Input() department: string | undefined;
  @Input() valueKey!: string;
  @Input() labelKey!: string;
  @Input() placeholder = 'Select';
  @Input() width = '200px';
  @Input() allowClear = true;
  @Input() showSearch = true;
  @Output() valueChange = new EventEmitter<any>();

  totalSubDepartments = 0;
  subDepartmentData: SelectList[] = [];
  departments: any[] = [];

  value: any;
  disabled = false;
  isLoading = false;

  constructor(
    private _subDepartmentServices: SubDepartmentService,
    private _masterCacheService: Mastercacheservice,
  ) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['department']) {
      const dept = changes['department'].currentValue;
      if (dept) {
        this.isLoading = true;
        this.getAllSubDepartmentByDepartmentCode(dept);
      } else {
        this.subDepartmentData = []; // Clear if no department selected
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

  getAllSubDepartmentByDepartmentCode = (divisionCode: string) => {
    // Optional: early exit / guard clause
    if (!divisionCode?.trim()) {
      this.subDepartmentData = [];
      this.isLoading = false;
      return;
    }

    const cacheKey = MASTER_CACHE_KEYS.SUB_DEPARTMENTS;

    this._masterCacheService
      .getMasterData({
        // Using a division-specific cache key → prevents polluting the global departments cache
        cacheKey: cacheKey,

        // Get total count of departments in this division
        getCount$: () => this._subDepartmentServices.getSubDepartmentCount(),

        // Main data fetch – assuming your service has (or will have) this method
        // If it doesn't exist yet → implement getDepartmentsByDivisionCodeCached or similar
        getData$: () =>
          this._subDepartmentServices.GetAllSubDepartments('', 'DESC', 'CreatedAt', true, 1, 1000),

        // Same mapping logic as in GetAllSubDepartment
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          Department: item.Department || item.department || '',
          DepartmentCode: item.DepartmentCode || item.departmentCode || '',
          IsActive: item.isActive || item.IsActive || false,
          IsDeleted: item.isDeleted || item.IsDeleted || false,
          CreatedBy: item.CreatedBy || item.createdBy || '',
          CreatedByName:
            item.CreateByName ||
            item.createByName ||
            item.CreatedByName ||
            item.createdByName ||
            '',
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
          // Filter only the departments that match the requested divisionCode
          // (in case the backend returns more than expected or cache is shared)
          const filtered = (mappedData ?? []).filter(
            (d) => d.DepartmentCode?.toUpperCase() === divisionCode.toUpperCase(),
          );

          this.subDepartmentData = filtered.map((d) => ({
            CODE: d.Code,
            NAME: d.Name,
          }));

          this.totalSubDepartments = filtered.length; // optional – if you want to show count
          this.isLoading = false;

          // this.cdr.detectChanges(); // only if you're in OnPush change detection
        },
        error: (err) => {
          console.error('Failed to load departments by division', err);
          this.subDepartmentData = [];
          this.isLoading = false;
        },
      });
  };
}
