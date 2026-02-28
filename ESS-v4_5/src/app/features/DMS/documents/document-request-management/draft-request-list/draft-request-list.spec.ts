import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftRequestList } from './draft-request-list';

describe('DraftRequestList', () => {
  let component: DraftRequestList;
  let fixture: ComponentFixture<DraftRequestList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DraftRequestList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DraftRequestList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
