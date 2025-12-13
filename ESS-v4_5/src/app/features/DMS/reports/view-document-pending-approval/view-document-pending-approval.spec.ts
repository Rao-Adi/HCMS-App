import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDocumentPendingApproval } from './view-document-pending-approval';

describe('ViewDocumentPendingApproval', () => {
  let component: ViewDocumentPendingApproval;
  let fixture: ComponentFixture<ViewDocumentPendingApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDocumentPendingApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDocumentPendingApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
