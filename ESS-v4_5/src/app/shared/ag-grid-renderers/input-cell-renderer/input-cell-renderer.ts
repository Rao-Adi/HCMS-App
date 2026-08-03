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
        (keydown)="onKeyDown($event)"
        (keyup)="$event.stopPropagation()"
        (keypress)="$event.stopPropagation()"
        (wheel)="onWheel($event)"
        style="text-align: right;"
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
    if (value == null || value === '') return '';
    const parsed = Number(value.toString().replace(/,/g, ''));
    if (!isNaN(parsed)) {
      return parsed.toLocaleString();
    }
    return '';
  }

  onValueChange(value: string): void {
    const field = this.params.colDef.field as string;

    // Filter out all characters except digits, decimal point, and minus sign
    let cleanValue = value.toString().replace(/[^0-9.-]/g, '');

    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // Ensure minus sign is only at the start
    if (cleanValue.includes('-')) {
      const isNegative = cleanValue.startsWith('-');
      cleanValue = (isNegative ? '-' : '') + cleanValue.replace(/-/g, '');
    }

    this.displayValue = cleanValue;

    const numericValue = cleanValue === '' ? null : Number(cleanValue);
    this.params.data[field] = numericValue;

    if (this.params.onValueChange) {
      this.params.onValueChange(numericValue, this.params.data);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    
    // Allow key combinations like Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (
      allowedKeys.indexOf(event.key) !== -1 ||
      (event.key === 'a' && (event.ctrlKey || event.metaKey)) ||
      (event.key === 'c' && (event.ctrlKey || event.metaKey)) ||
      (event.key === 'v' && (event.ctrlKey || event.metaKey)) ||
      (event.key === 'x' && (event.ctrlKey || event.metaKey))
    ) {
      return;
    }

    // Block non-numeric characters
    const isNumber = /^[0-9]$/.test(event.key);
    const isDecimal = event.key === '.' && !this.displayValue.includes('.');
    const isMinus = event.key === '-' && this.displayValue === '';

    if (!isNumber && !isDecimal && !isMinus && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      event.preventDefault();
    }
    
    // Up/down arrow key increments/decrements
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.step(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.step(-1);
    }
    
    event.stopPropagation();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.step(1);
    } else if (event.deltaY > 0) {
      this.step(-1);
    }
  }

  step(direction: number): void {
    const rawValue = this.displayValue.toString().replace(/,/g, '');
    const current = Number(rawValue);
    if (!isNaN(current) && this.displayValue.trim() !== '') {
      const next = current + direction;
      this.displayValue = this.formatValue(next);
      this.onValueChange(this.displayValue);
    }
  }
}
