import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabinetStructure } from './cabinet-structure';

describe('CabinetStructure', () => {
  let component: CabinetStructure;
  let fixture: ComponentFixture<CabinetStructure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabinetStructure]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CabinetStructure);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
