import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentList } from './department-list';

describe('DepartmentList', () => {
  let component: DepartmentList;
  let fixture: ComponentFixture<DepartmentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
