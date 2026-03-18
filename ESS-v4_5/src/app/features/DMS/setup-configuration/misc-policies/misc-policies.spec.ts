import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiscPolicies } from './misc-policies';

describe('MiscPolicies', () => {
  let component: MiscPolicies;
  let fixture: ComponentFixture<MiscPolicies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiscPolicies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiscPolicies);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
