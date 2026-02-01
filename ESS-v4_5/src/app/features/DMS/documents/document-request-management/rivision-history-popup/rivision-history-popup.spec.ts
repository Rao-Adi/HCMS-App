import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RivisionHistoryPopup } from './rivision-history-popup';

describe('RivisionHistoryPopup', () => {
  let component: RivisionHistoryPopup;
  let fixture: ComponentFixture<RivisionHistoryPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RivisionHistoryPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RivisionHistoryPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
