import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersInRoleModal } from './users-in-role-modal';

describe('UsersInRoleModal', () => {
  let component: UsersInRoleModal;
  let fixture: ComponentFixture<UsersInRoleModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersInRoleModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersInRoleModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
