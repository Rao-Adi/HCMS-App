import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabinetStructureList } from './cabinet-structure-list';

describe('CabinetStructureList', () => {
  let component: CabinetStructureList;
  let fixture: ComponentFixture<CabinetStructureList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabinetStructureList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CabinetStructureList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
