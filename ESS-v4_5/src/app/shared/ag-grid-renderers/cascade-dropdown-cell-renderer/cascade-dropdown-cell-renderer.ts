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
    <!-- Fills the cell instead of being pinned to a fixed 200px. At 200px the select stayed that
         wide no matter how much room the column actually had, so any column narrower than that
         (which is what happens as soon as a grid carries several of these) clipped the control and
         cut off its dropdown arrow -- the Department and Sub-Department filters were the two that
         showed it, because those are the cascading ones. min-width matches DropdownCellRenderer,
         and the column will not go below it either (see DROPDOWN_COLUMN_MIN_WIDTH in
         editable-ag-grid-wrapper.ts), so the select is always fully visible. -->
    <div class="dropdown-cell-wrap">
    <nz-select
      class="ag-input"
      style="width: 100%; min-width: 150px;"
      [nzShowSearch]="params?.showSearch"
      [nzFilterOption]="params?.customFilter"
      [nzPlaceHolder]="params?.placeholder || '-- Any --'"
      [nzAllowClear]="false"
      [nzDisabled]="disabled"
      [(ngModel)]="value"
      (ngModelChange)="onChange($event)"
      (keydown)="$event.stopPropagation()"
      (keyup)="$event.stopPropagation()"
      (keypress)="$event.stopPropagation()"
      (mousedown)="$event.stopPropagation()"
      (click)="$event.stopPropagation()"
    >
      <nz-option
        *ngFor="let option of options"
        [nzValue]="option[params?.valueField || 'id']"
        [nzLabel]="option[params?.displayField || 'text']"
      ></nz-option>
    </nz-select>

      <!-- Same clear button, same position, same markup as DropdownCellRenderer. Before this,
           a cascading column (Department, Sub-Department) cleared through nz-select's own
           built-in cross while the plain columns next to it (Division, Document Type) cleared
           through this one -- two different-looking crosses sitting side by side in the same
           filter row. nzAllowClear is off above for the same reason it is off there. -->
      <button
        type="button"
        *ngIf="value !== null && value !== undefined && value !== '' && !disabled"
        class="dropdown-cell-clear"
        title="Clear selection"
        (mousedown)="$event.stopPropagation()"
        (click)="clearSelection($event)"
      >
        &times;
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        padding: 4px 0;
      }
      .dropdown-cell-wrap {
        position: relative;
        width: 100%;
      }
      nz-select {
        width: 100% !important;
      }
      .dropdown-cell-clear {
        position: absolute;
        top: 50%;
        right: 24px;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        line-height: 14px;
        padding: 0;
        border: none;
        background: transparent;
        color: rgba(0, 0, 0, 0.45);
        font-size: 14px;
        cursor: pointer;
        z-index: 2;
      }
      .dropdown-cell-clear:hover {
        color: rgba(0, 0, 0, 0.85);
      }
    `,
  ],
})
export class CascadeDropdownCellRenderer implements ICellRendererAngularComp {
  selectedValue = null;

  params!: any;
  value: any = null;
  options: any[] = [];
  disabled = false;

  agInit(params: any): void {
    this.params = params;
    const field = params.colDef.field as string;
    const rawValue = params.data?.[field] ?? null;

    const dispField = this.params.displayField || 'text';
    const sortFn = (a: any, b: any) => {
      const textA = (a.rawName || a[dispField] || '').toString().toLowerCase();
      const textB = (b.rawName || b[dispField] || '').toString().toLowerCase();
      return textA.localeCompare(textB);
    };

    // ROOT DROPDOWN
    if (!params.dependsOn) {
      this.options = [...(params.options || [])].sort(sortFn);
      this.disabled = false;
    } else {
      // CASCADE DROPDOWN
      const parentField = params.dependsOn;
      const parentValue = params.data?.[parentField];

      if (!parentValue) {
        this.disabled = true;
        this.options = [];
      } else {
        // 🔥 FIX: USE params.options (NOT context)
        const source = params.options || [];

        this.options = source
          .filter((item: any) => String(item[params.filterKey]) === String(parentValue))
          .sort(sortFn);

        this.disabled = this.options.length === 0;
      }
    }

    // Resolve matched value and normalize data
    if (rawValue !== null && rawValue !== undefined) {
      const valField = this.params.valueField || 'id';
      const dispField = this.params.displayField || 'text';
      let matched = this.options.find((o) => o[valField] == rawValue);
      if (!matched) {
        matched = this.options.find((o) => o[dispField] == rawValue);
        if (matched && params.data) {
          params.data[field] = matched[valField];
        }
      }
      this.value = matched ? matched[valField] : null;
    } else {
      this.value = null;
    }
  }

  // agInit(params: any): void {
  //   debugger;
  //   this.params = params;

  //   // console.group('🔽 CASCADE DROPDOWN INIT');
  //   // console.log('FIELD:', params.colDef.field);
  //   // console.log('DEPENDS ON:', params.dependsOn);
  //   // console.log('FILTER KEY:', params.filterKey);
  //   // console.log('ROW DATA:', params.data);

  //   // ✅ ALWAYS read value from rowData (important for pinned rows)
  //   this.value = params.data?.[params.colDef.field] ?? null;
  //   //console.log('SELECTED VALUE:', this.value);

  //   // 🔹 CASE 1: ROOT DROPDOWN (Document Type)
  //   if (!params.dependsOn) {
  //     //console.log('ROOT DROPDOWN');

  //     this.options = params.options || [];
  //     this.disabled = false;

  //     //console.log('OPTIONS:', this.options);
  //     //console.groupEnd();
  //     return;
  //   }

  //   // 🔹 CASE 2: CASCADE DROPDOWN
  //   const parentField = params.dependsOn;
  //   const parentValue = params.data?.[parentField];

  //   // console.log('PARENT FIELD:', parentField);
  //   // console.log('PARENT VALUE:', parentValue);

  //   if (!parentValue) {
  //     //console.log('⛔ Parent not selected → disabling dropdown');
  //     this.disabled = true;
  //     this.options = [];
  //     //console.groupEnd();
  //     return;
  //   }

  //   const source = params.context?.[params.dataSourceKey] || [];
  //   //console.log('SOURCE DATA:', source);

  //   this.options = source.filter(
  //     (item: any) => String(item[params.filterKey]) === String(parentValue)
  //   );

  //   //console.log('FILTERED OPTIONS:', this.options);

  //   this.disabled = this.options.length === 0;

  //   //console.groupEnd();
  // }

  clearSelection(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.value = null;
    this.onChange(null);
  }

  onChange(value: any): void {
    //console.log('✅ DROPDOWN CHANGE', {
    //  field: this.params.colDef.field,
    //  value,
    //});

    this.value = value;

    this.params.onValueChange(value, this.params.data);
  }

  refresh(params: any): boolean {
    this.agInit(params);
    return true;
  }
}
