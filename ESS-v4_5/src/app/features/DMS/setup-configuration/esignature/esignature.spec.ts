import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ESignature } from './esignature';

describe('ESignature', () => {
  let component: ESignature;
  let fixture: ComponentFixture<ESignature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ESignature]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ESignature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
