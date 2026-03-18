import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentTemplate } from './document-template';

describe('DocumentTemplate', () => {
  let component: DocumentTemplate;
  let fixture: ComponentFixture<DocumentTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
