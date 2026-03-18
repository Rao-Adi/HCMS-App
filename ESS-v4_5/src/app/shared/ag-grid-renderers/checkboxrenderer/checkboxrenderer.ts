import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';


@Component({
  selector: 'app-checkboxrenderer',
 imports: [CommonModule, FormsModule, NzCheckboxModule],
  template: `
    <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
      <nz-checkbox
        [ngModel]="currentValue"
        (ngModelChange)="onChange($event)" 
      ></nz-checkbox>
    </div>
  `
})
export class Checkboxrenderer {

  params: any;
  currentValue = false;

  agInit(params: any): void {
    this.params = params;
    this.currentValue = !!params.value;
  }

  refresh(params: any): boolean {
    this.params = params;
    this.currentValue = !!params.value;
    return true;
  }

  onChange(checked: boolean): void {
    this.currentValue = checked;
    this.params?.onValueChange?.(checked, this.params.data);
  }

}
