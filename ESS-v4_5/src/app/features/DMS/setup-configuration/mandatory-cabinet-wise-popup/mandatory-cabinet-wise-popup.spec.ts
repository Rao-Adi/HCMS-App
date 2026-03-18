import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MandatoryCabinetWisePopup } from './mandatory-cabinet-wise-popup';

describe('MandatoryCabinetWisePopup', () => {
  let component: MandatoryCabinetWisePopup;
  let fixture: ComponentFixture<MandatoryCabinetWisePopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MandatoryCabinetWisePopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MandatoryCabinetWisePopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
