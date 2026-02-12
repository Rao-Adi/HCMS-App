import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingRequestForApproval } from './pending-request-for-approval';

describe('PendingRequestForApproval', () => {
  let component: PendingRequestForApproval;
  let fixture: ComponentFixture<PendingRequestForApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingRequestForApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingRequestForApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
