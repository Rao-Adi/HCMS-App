import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsibilityTransferForm } from './responsibility-transfer-form';

describe('ResponsibilityTransferForm', () => {
  let component: ResponsibilityTransferForm;
  let fixture: ComponentFixture<ResponsibilityTransferForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsibilityTransferForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponsibilityTransferForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
