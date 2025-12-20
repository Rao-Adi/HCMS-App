import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyList } from './company-list';

describe('CompanyList', () => {
  let component: CompanyList;
  let fixture: ComponentFixture<CompanyList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
