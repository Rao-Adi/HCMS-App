import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentAuthorizationPostTraining } from './document-authorization-post-training';

describe('DocumentAuthorizationPostTraining', () => {
  let component: DocumentAuthorizationPostTraining;
  let fixture: ComponentFixture<DocumentAuthorizationPostTraining>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentAuthorizationPostTraining]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentAuthorizationPostTraining);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
