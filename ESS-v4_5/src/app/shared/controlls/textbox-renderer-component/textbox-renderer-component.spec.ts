import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextboxRendererComponent } from './textbox-renderer-component';

describe('TextboxRendererComponent', () => {
  let component: TextboxRendererComponent;
  let fixture: ComponentFixture<TextboxRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextboxRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextboxRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
