import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalWorkflowPolicyManagement } from './approval-workflow-policy-management';

describe('ApprovalWorkflowPolicyManagement', () => {
  let component: ApprovalWorkflowPolicyManagement;
  let fixture: ComponentFixture<ApprovalWorkflowPolicyManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalWorkflowPolicyManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalWorkflowPolicyManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
