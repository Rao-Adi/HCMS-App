import { Component, Input, Output, EventEmitter, forwardRef, input } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DivisionService } from '@app/shared/services/division.services';
import { SelectList } from '@app/shared/interfaces/interfaces';
import { Mastercacheservice } from '@app/shared/localStorages/mastercacheservice';
import { MASTER_CACHE_KEYS } from '@app/shared/interfaces/const';
import { CustomDateFormatPipe } from '@app/shared/pipes/date-format-pipe';

@Component({
  selector: 'app-division-list',
  imports: [CommonModule, FormsModule, NzSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DivisionList),
      multi: true,
    },
  ],
  templateUrl: './division-list.html',
  styleUrl: './division-list.css',
})
export class DivisionList implements ControlValueAccessor {
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
  totalDivisions = 0;
  divisionData: SelectList[] = [];
  divisions: any[] = []; // for dropdowns

  constructor(
    private _divisionServices: DivisionService,
    private _masterCacheService: Mastercacheservice,
  ) {}

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.getAllDivisions({
      pageNumber: 1,
      pageSize: 1000,
      sortModel: [],
      filterModel: {},
    });
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

  getAllDivisions = (query: any) => {
    this._masterCacheService
      .getMasterData({
        cacheKey: MASTER_CACHE_KEYS.DIVISIONS,

        getCount$: () => this._divisionServices.getDivisionCount(),

        // ✅ RETURN RAW API RESPONSE
        getData$: () => this._divisionServices.GetAllDivisions('', 'ASC', 'Name', true, 1, 1000),
        mapFn: (item) => ({
          Id: item.Id || item.id,
          Code: item.code || item.Code,
          Name: item.name || item.Name,
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
      .subscribe((data) => {
 
        this.divisionData = (data ?? []).map((d: any) => ({
          CODE: d.Code,
          NAME: d.Name,
        }));
        this.totalDivisions = data.length;
      });
  };
}
