import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPendingRequestForApproval } from './my-pending-request-for-approval';

describe('MyPendingRequestForApproval', () => {
  let component: MyPendingRequestForApproval;
  let fixture: ComponentFixture<MyPendingRequestForApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPendingRequestForApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPendingRequestForApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
