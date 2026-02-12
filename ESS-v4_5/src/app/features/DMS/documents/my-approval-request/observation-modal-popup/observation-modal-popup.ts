import { Component, Inject } from '@angular/core';
import { DMSRichTextEdit } from '@app/shared/dmsrich-text-edit/dmsrich-text-edit';
import { SafeTranslatePipe } from '@app/shared/pipes/filter-label/safeTranslate.pipe';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-observation-modal-popup',
  imports: [DMSRichTextEdit, SafeTranslatePipe],
  templateUrl: './observation-modal-popup.html',
  styleUrl: './observation-modal-popup.css',
})
export class ObservationModalPopup {
  templateHtml: string = '';

  constructor(@Inject(NZ_MODAL_DATA) public modalData: any) {}

}
