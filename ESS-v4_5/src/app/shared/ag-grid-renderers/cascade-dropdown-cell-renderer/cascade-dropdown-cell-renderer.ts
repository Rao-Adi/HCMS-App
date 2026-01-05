import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { Subscription } from 'rxjs';
import { NzSelectModule } from 'ng-zorro-antd/select';
@Component({
  standalone: true,
  selector: 'app-cascade-dropdown-cell',
  imports: [CommonModule, FormsModule, NzSelectModule],
  template: `
    <nz-select
      class="ag-input"
      style="width: 200px;"
      nzShowSearch
      nzAllowClear
      nzPlaceHolder="-- Select --"
      [nzDisabled]="disabled"
      [(ngModel)]="value"
      (ngModelChange)="onChange($event)"
    >
      <nz-option
        *ngFor="let option of options"
        [nzValue]="option.id"
        [nzLabel]="option.text"
      ></nz-option>
    </nz-select>
  `,
})
export class CascadeDropdownCellRenderer implements ICellRendererAngularComp {
  selectedValue = null;

  params!: any;
  value: any = null;
  options: any[] = [];
  disabled = false;

  agInit(params: any): void {
    this.params = params;

    // console.group('🔽 CASCADE DROPDOWN INIT');
    // console.log('FIELD:', params.colDef.field);
    // console.log('DEPENDS ON:', params.dependsOn);
    // console.log('FILTER KEY:', params.filterKey);
    // console.log('ROW DATA:', params.data);

    // ✅ ALWAYS read value from rowData (important for pinned rows)
    this.value = params.data?.[params.colDef.field] ?? null;
    //console.log('SELECTED VALUE:', this.value);

    // 🔹 CASE 1: ROOT DROPDOWN (Document Type)
    if (!params.dependsOn) {
      //console.log('ROOT DROPDOWN');

      this.options = params.options || [];
      this.disabled = false;

      //console.log('OPTIONS:', this.options);
      //console.groupEnd();
      return;
    }

    // 🔹 CASE 2: CASCADE DROPDOWN
    const parentField = params.dependsOn;
    const parentValue = params.data?.[parentField];

    // console.log('PARENT FIELD:', parentField);
    // console.log('PARENT VALUE:', parentValue);

    if (!parentValue) {
      //console.log('⛔ Parent not selected → disabling dropdown');
      this.disabled = true;
      this.options = [];
      //console.groupEnd();
      return;
    }

    const source = params.context?.[params.dataSourceKey] || [];
    //console.log('SOURCE DATA:', source);

    this.options = source.filter(
      (item: any) => String(item[params.filterKey]) === String(parentValue)
    );

    //console.log('FILTERED OPTIONS:', this.options);

    this.disabled = this.options.length === 0;

    //console.groupEnd();
  }

  onChange(value: any): void {
    //console.log('✅ DROPDOWN CHANGE', {
    //  field: this.params.colDef.field,
    //  value,
    //});

    this.value = value;

    this.params.onValueChange(value, this.params.data);
  }

  refresh(): boolean {
    return false;
  }
}
