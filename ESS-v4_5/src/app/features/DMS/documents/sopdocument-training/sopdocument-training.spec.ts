import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SOPDocumentTraining } from './sopdocument-training';

describe('SOPDocumentTraining', () => {
  let component: SOPDocumentTraining;
  let fixture: ComponentFixture<SOPDocumentTraining>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SOPDocumentTraining]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SOPDocumentTraining);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
