import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyApprovalRequest } from './my-approval-request';

describe('MyApprovalRequest', () => {
  let component: MyApprovalRequest;
  let fixture: ComponentFixture<MyApprovalRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyApprovalRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyApprovalRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
