import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentRequestManagement } from './document-request-management';

describe('DocumentRequestManagement', () => {
  let component: DocumentRequestManagement;
  let fixture: ComponentFixture<DocumentRequestManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentRequestManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentRequestManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
