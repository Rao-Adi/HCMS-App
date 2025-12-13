import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalDocuments } from './approval-documents';

describe('ApprovalDocuments', () => {
  let component: ApprovalDocuments;
  let fixture: ComponentFixture<ApprovalDocuments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalDocuments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalDocuments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
