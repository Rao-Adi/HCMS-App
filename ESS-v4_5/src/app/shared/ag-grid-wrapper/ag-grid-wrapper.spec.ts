import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgGridWrapper } from './ag-grid-wrapper';

describe('AgGridWrapper', () => {
  let component: AgGridWrapper;
  let fixture: ComponentFixture<AgGridWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgGridWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgGridWrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
