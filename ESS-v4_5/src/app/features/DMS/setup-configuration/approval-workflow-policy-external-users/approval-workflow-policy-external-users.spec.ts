import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalWorkflowPolicyExternalUsers } from './approval-workflow-policy-external-users';

describe('ApprovalWorkflowPolicyExternalUsers', () => {
  let component: ApprovalWorkflowPolicyExternalUsers;
  let fixture: ComponentFixture<ApprovalWorkflowPolicyExternalUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalWorkflowPolicyExternalUsers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalWorkflowPolicyExternalUsers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
