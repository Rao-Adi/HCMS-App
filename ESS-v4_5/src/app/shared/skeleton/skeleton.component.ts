import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton" 
         [ngClass]="className"
         [style.width]="width" 
         [style.height]="height"
         [style.borderRadius]="borderRadius">
    </div>
  `,
  styles: [`
    :host { display: block; }
    .skeleton {
      background-color: #e2e8f0;
      animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }
  `]
})
export class SkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '1em';
  @Input() borderRadius: string = '4px';
  @Input() className: string = ''; // For adding margins like 'mb-2'
}
