import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationModalPopup } from './observation-modal-popup';

describe('ObservationModalPopup', () => {
  let component: ObservationModalPopup;
  let fixture: ComponentFixture<ObservationModalPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservationModalPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservationModalPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
