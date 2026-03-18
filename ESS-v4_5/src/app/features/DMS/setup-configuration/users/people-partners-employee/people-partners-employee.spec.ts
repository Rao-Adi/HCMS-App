import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeoplePartnersEmployee } from './people-partners-employee';

describe('PeoplePartnersEmployee', () => {
  let component: PeoplePartnersEmployee;
  let fixture: ComponentFixture<PeoplePartnersEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeoplePartnersEmployee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeoplePartnersEmployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
