import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DRDistributionList } from './drdistribution-list';

describe('DRDistributionList', () => {
  let component: DRDistributionList;
  let fixture: ComponentFixture<DRDistributionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DRDistributionList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DRDistributionList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
