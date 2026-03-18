import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowApprovalHistoryComponent } from './workflow-approval-history-component';

describe('WorkflowApprovalHistoryComponent', () => {
  let component: WorkflowApprovalHistoryComponent;
  let fixture: ComponentFixture<WorkflowApprovalHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowApprovalHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowApprovalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
