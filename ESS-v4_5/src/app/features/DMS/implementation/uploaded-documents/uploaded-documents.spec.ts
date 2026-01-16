import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadedDocuments } from './uploaded-documents';

describe('UploadedDocuments', () => {
  let component: UploadedDocuments;
  let fixture: ComponentFixture<UploadedDocuments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadedDocuments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadedDocuments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
