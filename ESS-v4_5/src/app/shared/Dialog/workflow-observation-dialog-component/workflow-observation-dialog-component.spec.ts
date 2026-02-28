import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowObservationDialogComponent } from './workflow-observation-dialog-component';

describe('WorkflowObservationDialogComponent', () => {
  let component: WorkflowObservationDialogComponent;
  let fixture: ComponentFixture<WorkflowObservationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowObservationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowObservationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
