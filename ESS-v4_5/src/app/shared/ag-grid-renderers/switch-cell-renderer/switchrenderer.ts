import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  selector: 'app-switchrenderer',
  imports: [CommonModule, FormsModule, NzSwitchModule],
  template: `
    <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
      <nz-switch
        [(ngModel)]="switchValue1"
        (ngModelChange)="onChange($event)" 
        [nzLoading]="loading"
      >
      </nz-switch>
    </div>
  `,
})
export class SwitchRenderer {
  params: any;
  currentValue = false;

  activeMode: any;
  selectedTab: string = 'Upload';
  loading = false;
  switchValue1 = false;
  switchValue2 = false;

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

  clickSwitch(checked: boolean): void {
    debugger;
    if (this.loading) return;

    this.loading = true;

    this.currentValue = checked;
    this.params?.onValueChange?.(checked, this.params.data);
  }
}
