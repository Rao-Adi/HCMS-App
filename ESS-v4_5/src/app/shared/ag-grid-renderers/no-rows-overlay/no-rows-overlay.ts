import { Component } from '@angular/core';
import { INoRowsOverlayAngularComp } from 'ag-grid-angular';
import { INoRowsOverlayParams } from 'ag-grid-community';

// Registered as gridOptions.noRowsOverlayComponent -- AG Grid renders and positions this
// itself within the grid's own row-viewport area, which is the one place plain CSS/template
// overlays couldn't reliably reach without either overlapping other grid chrome (when
// absolutely positioned across the whole grid) or landing outside the grid entirely (when
// rendered as a sibling in the wrapper's own template).
@Component({
  standalone: true,
  selector: 'app-no-rows-overlay',
  template: `<div class="no-rows-overlay-text">No records to show.</div>`,
  styles: [
    `
      .no-rows-overlay-text {
        text-align: center;
        color: #000;
        margin-top:30px;
        font-size: 14px;
      }
    `,
  ],
})
export class NoRowsOverlay implements INoRowsOverlayAngularComp {
  agInit(params: INoRowsOverlayParams): void {}
}
