import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalHistoryModal } from './approval-history-modal';

describe('ApprovalHistoryModal', () => {
  let component: ApprovalHistoryModal;
  let fixture: ComponentFixture<ApprovalHistoryModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalHistoryModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalHistoryModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
