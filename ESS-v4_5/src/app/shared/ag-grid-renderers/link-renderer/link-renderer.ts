// link-renderer.component.ts
import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  template: `<a
      style="color:#1890ff; cursor:pointer; text-decoration:underline"
      (click)="handleClick($event)">
      {{ label }}
    </a>`,
})
export class LinkRenderer implements ICellRendererAngularComp {
  public label: string = '';
  public url: string = '';
  onClick!: () => void;

  agInit(params: any): void {
      // 🔥 READ FROM PARAMS PASSED BY WRAPPER
    this.label = params.label ?? 'View Cabinet';
    this.onClick = params.onClick;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  handleClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.onClick?.();
  }
}
