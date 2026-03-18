import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateUpdateDocument } from './create-update-document';

describe('CreateUpdateDocument', () => {
  let component: CreateUpdateDocument;
  let fixture: ComponentFixture<CreateUpdateDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateUpdateDocument]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateUpdateDocument);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
