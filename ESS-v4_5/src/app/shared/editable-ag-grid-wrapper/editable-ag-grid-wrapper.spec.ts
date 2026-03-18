import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableAgGridWrapper } from './editable-ag-grid-wrapper';

describe('EditableAgGridWrapper', () => {
  let component: EditableAgGridWrapper;
  let fixture: ComponentFixture<EditableAgGridWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditableAgGridWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditableAgGridWrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
