import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AGGridInlineEditingTest } from './aggrid-inline-editing-test';

describe('AGGridInlineEditingTest', () => {
  let component: AGGridInlineEditingTest;
  let fixture: ComponentFixture<AGGridInlineEditingTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AGGridInlineEditingTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AGGridInlineEditingTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
