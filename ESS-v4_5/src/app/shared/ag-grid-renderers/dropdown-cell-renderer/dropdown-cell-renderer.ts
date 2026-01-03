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
      style="width: 200px;"
      [(ngModel)]="selectedValue"
      (ngModelChange)="onSelectionChange($event)"
    >
      <nz-option
        *ngFor="let option of options"
        [nzValue]="option.id"
        [nzLabel]="option.text"
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
  selectedValue: number = 0;
  options: { id: number; text: string }[] = [];
  private params!: ICellRendererParams & {
    options: { id: number; text: string }[];
    onValueChange?: (value: number, data: any) => void;
  };

  agInit(params: any): void {
    this.params = params;
    this.selectedValue = params.value || 0;
    this.options = params.options || [];
  }

  refresh(params: any): boolean {
    this.selectedValue = params.value || 0;
    this.options = params.options || [];
    return true;
  }

  onSelectionChange(value: number): void {
    this.params.data[this.params.colDef?.field as string] = value;
    if (this.params.onValueChange) {
      this.params.onValueChange(value, this.params.data);
    }
  }
}
