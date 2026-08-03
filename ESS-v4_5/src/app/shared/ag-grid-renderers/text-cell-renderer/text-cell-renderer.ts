import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
  selector: 'app-text-cell-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule, NzInputModule, NzInputNumberModule],
  template: `
    <nz-input-group [nzPrefix]="prefix" [nzSuffix]="suffix" nzSize="default">
      <input
        type="text"
        nz-input
        [(ngModel)]="displayValue"
        (ngModelChange)="onValueChange($event)"
        (keydown)="$event.stopPropagation()"
        (keyup)="$event.stopPropagation()"
        (keypress)="$event.stopPropagation()"
        style="text-align: left;"
      />
    </nz-input-group>
  `,
  //   template: `
  //     <div style="display: flex; align-items: center; width: 100%;">
  //       <span *ngIf="params?.prefix" style="margin-right: 4px; white-space: nowrap;">
  //         {{ params.prefix }}
  //       </span>
  //       <input
  //         type="text"
  //         [ngModel]="currentValue"
  //         (ngModelChange)="onInput($event)"
  //         (blur)="onBlur()"
  //         style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px;"
  //         [placeholder]="params?.placeholder || ''">
  //       <span *ngIf="params?.suffix" style="margin-left: 4px; white-space: nowrap;">
  //         {{ params.suffix }}
  //       </span>
  //     </div>
  //   `
})
export class TextCellRenderer implements ICellRendererAngularComp {
  displayValue: string = '';
  prefix: string = '';
  suffix: string = '';

  params: any;
  currentValue: any;

  agInit(params: any): void {
    // this.params = params;
    // this.currentValue = params.value || params.params?.value || '';
    this.params = params;

    const field = params.colDef.field as string;

    // ✅ read from rowData (important for pinned row)
    this.displayValue = params.data?.[field] ?? '';
  }

  onInput(value: any): void {
    this.currentValue = value;
  }

  onBlur(): void {
    if (this.params?.onValueChange && this.currentValue !== undefined) {
      this.params.onValueChange(this.currentValue, this.params.data);
    }
  }

  refresh(params: any): boolean {
    this.params = params;
    this.currentValue = params.value || params.params?.value || '';
    return true;
  }

  onValueChange(value: string): void {
    const field = this.params.colDef.field as string;

    // ✅ store EXACT string
    this.params.data[field] = value;

    if (this.params.onValueChange) {
      this.params.onValueChange(value, this.params.data);
    }

    // const numericValue = parseFloat(value?.toString().replace(/[^0-9.-]/g, '')) || 0;
    // this.params.data[this.params.colDef?.field as string] = numericValue;

    // if (this.params.onValueChange) {
    //   this.params.onValueChange(numericValue, this.params.data);
    // }
  }
}
