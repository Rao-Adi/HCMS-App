import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionHistoryModal } from './revision-history-modal';

describe('RevisionHistoryModal', () => {
  let component: RevisionHistoryModal;
  let fixture: ComponentFixture<RevisionHistoryModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisionHistoryModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevisionHistoryModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
