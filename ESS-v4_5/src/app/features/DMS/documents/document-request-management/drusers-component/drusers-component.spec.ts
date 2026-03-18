import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DRUsersComponent } from './drusers-component';

describe('DRUsersComponent', () => {
  let component: DRUsersComponent;
  let fixture: ComponentFixture<DRUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DRUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DRUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
