import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AIReport } from './aireport';

describe('AIReport', () => {
  let component: AIReport;
  let fixture: ComponentFixture<AIReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AIReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AIReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
