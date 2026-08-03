import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageWorkflowPolicyModal } from './manage-workflow-policy-modal';

describe('ManageWorkflowPolicyModal', () => {
  let component: ManageWorkflowPolicyModal;
  let fixture: ComponentFixture<ManageWorkflowPolicyModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageWorkflowPolicyModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageWorkflowPolicyModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
