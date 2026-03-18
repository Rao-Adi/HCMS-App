import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DivisionList } from './division-list';

describe('DivisionList', () => {
  let component: DivisionList;
  let fixture: ComponentFixture<DivisionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DivisionList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DivisionList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
