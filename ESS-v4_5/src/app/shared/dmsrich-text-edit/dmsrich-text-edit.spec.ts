import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DMSRichTextEdit } from './dmsrich-text-edit';

describe('DMSRichTextEdit', () => {
  let component: DMSRichTextEdit;
  let fixture: ComponentFixture<DMSRichTextEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DMSRichTextEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DMSRichTextEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
