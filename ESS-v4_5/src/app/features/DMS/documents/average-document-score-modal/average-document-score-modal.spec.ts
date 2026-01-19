import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AverageDocumentScoreModal } from './average-document-score-modal';

describe('AverageDocumentScoreModal', () => {
  let component: AverageDocumentScoreModal;
  let fixture: ComponentFixture<AverageDocumentScoreModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AverageDocumentScoreModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AverageDocumentScoreModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
