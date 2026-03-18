import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubDepartmentList } from './sub-department-list';

describe('SubDepartmentList', () => {
  let component: SubDepartmentList;
  let fixture: ComponentFixture<SubDepartmentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubDepartmentList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubDepartmentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
