import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `,
  styles: [`
    /* 1. ADD THIS ANIMATION DEFINITION */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .spinner-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;

      /* 2. ADD THIS ANIMATION PROPERTY */
      animation: fadeIn 300ms ease-out;
    }
    
    .spinner-border {
      width: 3rem;
      height: 3rem;
    }
  `]
})
export class SpinnerComponent { }
