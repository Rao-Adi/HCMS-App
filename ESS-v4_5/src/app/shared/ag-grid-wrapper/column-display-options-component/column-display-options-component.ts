import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ColumnToggle } from '@app/shared/interfaces/interfaces';

@Component({
  selector: 'app-column-display-options-component',
  imports: [NgFor],
  templateUrl: './column-display-options-component.html',
  styleUrl: './column-display-options-component.css'
})
export class ColumnDisplayOptionsComponent {
  
  @Input() columnToggles?: ColumnToggle[];
  @Output() toggle = new EventEmitter<ColumnToggle>();

  onToggle(col: ColumnToggle) {
    this.toggle.emit(col); // ⬅ just emit
  }

}
