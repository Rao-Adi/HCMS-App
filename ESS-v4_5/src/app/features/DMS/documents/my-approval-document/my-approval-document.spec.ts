import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyApprovalDocument } from './my-approval-document';

describe('MyApprovalDocument', () => {
  let component: MyApprovalDocument;
  let fixture: ComponentFixture<MyApprovalDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyApprovalDocument]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyApprovalDocument);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
