import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentTypeList } from './document-type-list';

describe('DocumentTypeList', () => {
  let component: DocumentTypeList;
  let fixture: ComponentFixture<DocumentTypeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTypeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentTypeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
