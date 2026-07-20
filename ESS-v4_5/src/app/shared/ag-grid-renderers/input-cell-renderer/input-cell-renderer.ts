import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
  selector: 'app-input-cell-renderer',
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
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        padding: 4px 0;
      }
      nz-input-group {
        width: 100% !important;
        height: 26px;
        font-size: 0.875 rem;
      }
      /* Target input directly inside ant-input-group (NO prefix) */
      :host ::ng-deep .ant-input-group > input.ant-input {
        border: 1px solid #d9d9d9 !important;
        border-radius: 4px !important;
        height: 26px !important;
      }

      :host ::ng-deep .ant-input-group > input.ant-input:focus {
        border-color: #4096ff !important;
        box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1) !important;
      }

      /* Target affix-wrapper (HAS prefix/suffix) */
      :host ::ng-deep .ant-input-affix-wrapper {
        border: 1px solid #d9d9d9 !important;
        border-radius: 4px !important;
        height: 26px !important;
      }

      :host ::ng-deep .ant-input-affix-wrapper:focus-within {
        border-color: #4096ff !important;
        box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1) !important;
      }

      :host ::ng-deep .ant-input-affix-wrapper > input.ant-input {
        border: none !important;
        box-shadow: none !important;
      }
    `,
  ],
})
export class InputCellRenderer implements ICellRendererAngularComp {
  displayValue: string = '';
  prefix: string = '';
  suffix: string = '';
  // private params!: ICellRendererParams & {
  //   prefix?: string;
  //   suffix?: string;
  //   onValueChange?: (value: number | string, data: any) => void;
  // };
  params: any;

  agInit(params: any): void {
    this.params = params;
    this.prefix = params.prefix || '';
    this.suffix = params.suffix || '';
    this.displayValue = this.formatValue(params.value);
  }

  refresh(params: any): boolean {
    this.displayValue = this.formatValue(params.value);
    return true;
  }

  private formatValue(value: any): string {
    if (value == null || value === '') return '0';
    return value.toLocaleString();
  }

  onValueChange(value: string): void {
    const field = this.params.colDef.field as string;

    const numericValue =
      value === '' || value == null ? null : Number(value.toString().replace(/,/g, ''));

    this.params.data[field] = numericValue;

    if (this.params.onValueChange) {
      this.params.onValueChange(numericValue, this.params.data);
    }

    // const numericValue = parseFloat(value?.toString().replace(/[^0-9.-]/g, '')) || 0;
    // this.params.data[this.params.colDef?.field as string] = numericValue;

    // if (this.params.onValueChange) {
    //   this.params.onValueChange(numericValue, this.params.data);
    // }
  }
}
