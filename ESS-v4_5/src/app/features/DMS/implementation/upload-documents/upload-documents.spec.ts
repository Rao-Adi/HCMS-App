import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDocuments } from './upload-documents';

describe('UploadDocuments', () => {
  let component: UploadDocuments;
  let fixture: ComponentFixture<UploadDocuments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDocuments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadDocuments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
