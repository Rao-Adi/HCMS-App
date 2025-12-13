import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalizedEmailAlerts } from './personalized-email-alerts';

describe('PersonalizedEmailAlerts', () => {
  let component: PersonalizedEmailAlerts;
  let fixture: ComponentFixture<PersonalizedEmailAlerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalizedEmailAlerts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalizedEmailAlerts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
