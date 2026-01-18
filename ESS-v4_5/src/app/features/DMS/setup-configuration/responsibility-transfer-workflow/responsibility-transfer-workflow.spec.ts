import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsibilityTransferWorkflow } from './responsibility-transfer-workflow';

describe('ResponsibilityTransferWorkflow', () => {
  let component: ResponsibilityTransferWorkflow;
  let fixture: ComponentFixture<ResponsibilityTransferWorkflow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsibilityTransferWorkflow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponsibilityTransferWorkflow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
