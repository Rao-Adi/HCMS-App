import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentAttributes } from './document-attributes';

describe('DocumentAttributes', () => {
  let component: DocumentAttributes;
  let fixture: ComponentFixture<DocumentAttributes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentAttributes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentAttributes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
