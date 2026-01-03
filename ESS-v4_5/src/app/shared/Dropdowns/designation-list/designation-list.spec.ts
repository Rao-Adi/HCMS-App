import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignationList } from './designation-list';

describe('DesignationList', () => {
  let component: DesignationList;
  let fixture: ComponentFixture<DesignationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignationList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
