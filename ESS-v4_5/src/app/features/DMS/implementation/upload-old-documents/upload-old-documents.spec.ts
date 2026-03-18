import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadOldDocuments } from './upload-old-documents';

describe('UploadOldDocuments', () => {
  let component: UploadOldDocuments;
  let fixture: ComponentFixture<UploadOldDocuments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadOldDocuments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadOldDocuments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
