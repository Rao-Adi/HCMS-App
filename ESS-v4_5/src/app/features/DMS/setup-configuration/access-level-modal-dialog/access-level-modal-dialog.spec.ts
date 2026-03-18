import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessLevelModalDialog } from './access-level-modal-dialog';

describe('AccessLevelModalDialog', () => {
  let component: AccessLevelModalDialog;
  let fixture: ComponentFixture<AccessLevelModalDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessLevelModalDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccessLevelModalDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
