import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormByDocumentAttribute } from './dynamic-form-by-document-attribute';

describe('DynamicFormByDocumentAttribute', () => {
  let component: DynamicFormByDocumentAttribute;
  let fixture: ComponentFixture<DynamicFormByDocumentAttribute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormByDocumentAttribute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicFormByDocumentAttribute);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
