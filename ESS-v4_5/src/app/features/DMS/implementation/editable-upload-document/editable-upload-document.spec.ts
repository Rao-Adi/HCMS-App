import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableUploadDocument } from './editable-upload-document';

describe('EditableUploadDocument', () => {
  let component: EditableUploadDocument;
  let fixture: ComponentFixture<EditableUploadDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditableUploadDocument]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditableUploadDocument);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
