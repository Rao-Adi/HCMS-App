import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessDomainComponent } from './business-domain-component';

describe('BusinessDomainComponent', () => {
  let component: BusinessDomainComponent;
  let fixture: ComponentFixture<BusinessDomainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDomainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessDomainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
