import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'dropdown-cell-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule],
  template: `
    <nz-select
      class="ag-input"
      style="width: 100%; min-width: 150px;"
      [nzShowSearch]="params?.showSearch"
      [nzFilterOption]="params?.customFilter"
      [nzDisabled]="params?.disabled"
      nzPlaceHolder="-- Any --"
      [(ngModel)]="selectedValue"
      [nzAllowClear]="true"
      (ngModelChange)="onSelectionChange($event)"
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
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        padding: 4px 0;
      }
      nz-select {
        width: 100% !important;
      }
    `,
  ],
})
export class DropdownCellRenderer implements ICellRendererAngularComp {
  selectedValue: any = null;
  options: any[] = [];

  
  params!: ICellRendererParams & {
    options: any[];
    onValueChange?: (value: number, data: any) => void;
    valueField?: string;
    displayField?: string;
    showSearch?: boolean;
    customFilter?: any;
    disabled?: boolean;
  };

  agInit(params: any): void {
    this.params = params;

    const field = params.colDef.field as string;
    const rawValue = params.data?.[field];

    this.options = params.options || [];

    // 🔥 FORCE type match (number ↔ number)
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
      this.selectedValue = matched ? matched[valField] : null;
    } else {
      this.selectedValue = null;
    }
  }

  // agInit(params: any): void {
  //   this.params = params;

  //   // 🔥 FIX 1: always read value from rowData
  //   const field = params.colDef.field as string;
  //   this.selectedValue = params.data?.[field] ?? null;

  //   // 🔥 FIX 2: accept string/number IDs
  //   this.options = params.options || [];

  //   // console.log('DOCUMENT TYPE INIT', {
  //   //   value: this.selectedValue,
  //   //   options: this.options,
  //   // });
  // }

  refresh(params: any): boolean {
    this.params = params;
    const field = params.colDef.field as string;
    const rawValue = params.data?.[field];

    this.options = params.options || [];

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
      this.selectedValue = matched ? matched[valField] : null;
    } else {
      this.selectedValue = null;
    }

    return true;
  }

  // refresh(params: any): boolean {
  //   const field = params.colDef.field as string;
  //   this.selectedValue = params.data?.[field] ?? null;
  //   this.options = params.options || [];
  //   return true;
  // }

  onSelectionChange(value: any): void {
    const field = this.params.colDef?.field as string;

    // update row data
    this.params.data[field] = value;

    if (this.params.onValueChange) {
      this.params.onValueChange(value, this.params.data);
    }
  }

  // selectedValue: number = 0;
  // options: { id: number; text: string }[] = [];
  // private params!: ICellRendererParams & {
  //   options: { id: number; text: string }[];
  //   onValueChange?: (value: number, data: any) => void;
  // };

  // agInit(params: any): void {
  //   this.params = params;
  //   this.selectedValue = params.value || 0;
  //   this.options = params.options || [];
  // }

  // refresh(params: any): boolean {
  //   this.selectedValue = params.value || 0;
  //   this.options = params.options || [];
  //   return true;
  // }

  // onSelectionChange(value: number): void {
  //   this.params.data[this.params.colDef?.field as string] = value;
  //   if (this.params.onValueChange) {
  //     this.params.onValueChange(value, this.params.data);
  //   }
  // }
}
