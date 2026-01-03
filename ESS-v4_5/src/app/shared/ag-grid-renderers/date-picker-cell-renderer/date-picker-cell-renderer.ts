import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

@Component({
  selector: 'date-picker-cell-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule, NzDatePickerModule],
  template: `
    <nz-date-picker 
      [nzPlaceHolder]="'Select Date'"
      [(ngModel)]="dateValue"
      style="width: 100%;"
      [nzDisabled]="disabled"
      [nzFormat]="'dd-MMM-yyyy'"
      (ngModelChange)="onDateChange($event)">
    </nz-date-picker>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 2px;
    }
    ::ng-deep .ant-picker {
      width: 100% !important;
    }
  `]
})
export class DatePickerCellRenderer implements ICellRendererAngularComp {
  dateValue: Date | null = null;
  disabled: boolean = false;
  private params: any;

  agInit(params: ICellRendererParams & { onValueChange?: Function; disabled?: boolean }): void {
    this.params = params;
    this.disabled = params.disabled || false;

    if (params.value) {
      this.dateValue = this.parseDate(params.value);
    }
  }

  refresh(params: ICellRendererParams): boolean {
    if (params.value) {
      this.dateValue = this.parseDate(params.value);
    }
    return true;
  }

  onDateChange(date: Date): void {
    if (this.params.onValueChange) {
      this.params.onValueChange(date, this.params.data);
    }
  }

  private parseDate(value: string | Date): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;

    // Try parsing different date formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;

    // Try parsing "dd-MMM-yyyy" format
    const parts = value.split('-');
    if (parts.length === 3) {
      const months: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const day = parseInt(parts[0], 10);
      const month = months[parts[1]];
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    return null;
  }
}
