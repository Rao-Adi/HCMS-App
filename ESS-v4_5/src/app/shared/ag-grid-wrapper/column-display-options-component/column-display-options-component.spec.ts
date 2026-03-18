import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnDisplayOptionsComponent } from './column-display-options-component';

describe('ColumnDisplayOptionsComponent', () => {
  let component: ColumnDisplayOptionsComponent;
  let fixture: ComponentFixture<ColumnDisplayOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnDisplayOptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColumnDisplayOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
