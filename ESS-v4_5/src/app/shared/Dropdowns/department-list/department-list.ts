import { DepartmentService } from '@app/shared/services/department.service';
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
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

@Component({
  selector: 'app-department-list',
  imports: [CommonModule, FormsModule, NzSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DepartmentList),
      multi: true,
    },
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.css',
})
export class DepartmentList implements ControlValueAccessor {
  @Input() division: string | undefined;
  @Input() valueKey!: string;
  @Input() labelKey!: string;
  @Input() placeholder = 'Select';
  @Input() width = '200px';
  @Input() allowClear = true;
  @Input() showSearch = true;
  @Output() valueChange = new EventEmitter<any>();

  totalDepartments = 0;
  departmentData: SelectList[] = [];

  value: any;
  disabled = false;
  isLoading = false;

  constructor(
    private _departmentServices: DepartmentService,
    private _masterCacheService: Mastercacheservice,
  ) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['division']) {
      const dept = changes['division'].currentValue;
      if (dept) {
        this.isLoading = true;
        this.getAllDepartmentByDivisionCode(dept);
      } else {
        this.departmentData = []; // Clear if no department selected
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

  getAllDepartmentByDivisionCode = (divisionCode: string) => {
    // Optional: early exit / guard clause
    if (!divisionCode?.trim()) {
      this.departmentData = [];
      this.isLoading = false;
      return;
    }

    const cacheKey = `${MASTER_CACHE_KEYS.DEPARTMENTS}_${divisionCode}`;

    this._masterCacheService
      .getMasterData({
        // Using a division-specific cache key → prevents polluting the global departments cache
        cacheKey: cacheKey,

        // Get total count of departments in this division
        getCount$: () => this._departmentServices.getDepartmentCount(),

        // Main data fetch – assuming your service has (or will have) this method
        // If it doesn't exist yet → implement getDepartmentsByDivisionCodeCached or similar
        getData$: () =>
          this._departmentServices.GetAllDepartments(
            divisionCode, // filter parameter – adjust according to your real API
            'ASC',
            'Name',
            true,
            1,
            1000, // ← or use a higher limit / pagination if needed
          ),

        // Same mapping logic as in GetAllDepartments
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.Code || item.code,
          Name: item.Name || item.name,
          Division: item.Division || item.division || '',
          DivisionCode: item.DivisionCode || item.divisionCode || '',
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
          // Filter only the departments that match the requested divisionCode
          // (in case the backend returns more than expected or cache is shared)
          const filtered = (mappedData ?? []).filter(
            (d) => d.DivisionCode?.toUpperCase() === divisionCode.toUpperCase(),
          );

          this.departmentData = filtered.map((d) => ({
            CODE: d.Code,
            NAME: d.Name,
          }));

          this.totalDepartments = filtered.length; // optional – if you want to show count
          this.isLoading = false;

          // this.cdr.detectChanges(); // only if you're in OnPush change detection
        },
        error: (err) => {
          console.error('Failed to load departments by division', err);
          this.departmentData = [];
          this.isLoading = false;
        },
      });
  }; 
}
