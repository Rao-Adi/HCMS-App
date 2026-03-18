import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DRWorkflowAuthorities } from './drworkflow-authorities';

describe('DRWorkflowAuthorities', () => {
  let component: DRWorkflowAuthorities;
  let fixture: ComponentFixture<DRWorkflowAuthorities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DRWorkflowAuthorities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DRWorkflowAuthorities);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
