import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-about-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  // ViewEncapsulation.None handles the full-bleed layout without needing global styles
  encapsulation: ViewEncapsulation.None,
  template: `
   
      
      <div class="modal-header">
      <div class="Lookup">
        <div>About</div>
        <img src="./assets/images/lookupclose.png" class="cross-icon"  style="cursor: pointer;" />
        </div>
      </div>

      <div class="modal-body">
        
        <div class="details-grid">
          
          <div class="detail-item">
            <label>APPLICATION NAME</label>
            <span>{{ appData.name }}</span>
          </div>

          <div class="detail-item">
            <label>VERSION</label>
            <span>{{ appData.version }}</span>
          </div>

          <div class="detail-item full-width">
            <label>COPYRIGHT</label>
            <span>&copy; {{ appData.copyright }}</span>
          </div>

          <div class="detail-item full-width link-section">
            <label>WEBSITE</label>
            <a [href]="appData.website" target="_blank" rel="noopener noreferrer">
              {{ appData.website }}
            </a>
          </div>

        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-ok" (click)="close()">OK</button>
      </div>

    
  `,
  styles: [`
    /* 1. CONTAINER RESET */
    .about-popup-container {
      display: flex; flex-direction: column;
      width: 100%; height: 100%;
      background: white; overflow: hidden;
    }

    /* 2. HEADER */
    .modal-header {
      background-color: #3F51B5 !important;
      color: white !important;
      padding: 16px 24px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .modal-header h2 {
      margin: 0; font-size: 1.2rem; font-weight: 500;
      color: white !important; font-family: 'Segoe UI', Roboto, sans-serif;
    }
    .close-icon {
      background: none; border: none; color: rgba(255, 255, 255, 0.8);
      font-size: 28px; line-height: 1; cursor: pointer; padding: 0;
    }
    .close-icon:hover { color: white; }

    /* 3. BODY */
    .modal-body { padding: 24px; }

    .details-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
    }

    .detail-item {
      display: flex; flex-direction: column; gap: 6px;
    }
    .detail-item.full-width { grid-column: span 2; }
    
    /* Extra spacing for the website link at bottom */
    .detail-item.link-section { margin-top: 8px; }

    .detail-item label {
      font-size: 0.7rem; font-weight: 700; color: #78909C;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    .detail-item span, .detail-item a {
      font-size: 0.95rem; color: #333; font-weight: 400;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; /* Standard Font */
    }

    /* Standard Link Styling (Blue + Hover Underline) */
    .detail-item a {
      color: #3F51B5; /* App Blue */
      text-decoration: none;
      font-weight: 500;
    }
    .detail-item a:hover { text-decoration: underline; }

    /* 4. FOOTER */
    .modal-footer {
      padding: 16px 24px; display: flex; justify-content: flex-end;
    }
    .btn-ok {
      background-color: #E8EAF6; color: #3F51B5; border: none;
      padding: 8px 32px; border-radius: 4px; font-weight: 600;
      cursor: pointer; font-size: 0.9rem; transition: background 0.2s;
    }
    .btn-ok:hover { background-color: #C5CAE9; }
  `]
})
export class AboutPopupComponent {
  currentYear = new Date().getFullYear();

  appData = {
    name: 'Document Management System',
    version: 'v1.0',
    copyright: `${this.currentYear} Softronic Systems (Pvt.) Ltd.`,
    website: 'https://people.partners/'
  };

  constructor(public dialogRef: MatDialogRef<AboutPopupComponent>) { }

  close(): void {
    this.dialogRef.close();
  }
}
