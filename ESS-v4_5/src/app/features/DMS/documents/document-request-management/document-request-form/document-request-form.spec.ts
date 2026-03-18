import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentRequestForm } from './document-request-form';

describe('DocumentRequestForm', () => {
  let component: DocumentRequestForm;
  let fixture: ComponentFixture<DocumentRequestForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentRequestForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentRequestForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
