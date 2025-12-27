import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessDomainList } from './business-domain-list';

describe('BusinessDomainList', () => {
  let component: BusinessDomainList;
  let fixture: ComponentFixture<BusinessDomainList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDomainList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessDomainList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
