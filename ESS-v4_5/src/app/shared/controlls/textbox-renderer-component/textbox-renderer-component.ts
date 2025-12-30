import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-textbox-renderer-component',
  imports: [FormsModule],
  // templateUrl: './textbox-renderer-component.html',
  template: `
    <input
      nz-input
      [ngModel]="value"
      (ngModelChange)="update($event)"
      style="width:100%"
    />
  `,
  styleUrl: './textbox-renderer-component.css'
})
export class TextboxRendererComponent {

  value: any;
  params: any;

  agInit(params: any): void {
    this.params = params;
    this.value = params.value;
  }

  update(val: any) {
    this.value = val;
    this.params.node.setDataValue(this.params.colDef.field!, val);
  }

}
