import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualManageEmployee } from './manual-manage-employee';

describe('ManualManageEmployee', () => {
  let component: ManualManageEmployee;
  let fixture: ComponentFixture<ManualManageEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualManageEmployee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualManageEmployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
