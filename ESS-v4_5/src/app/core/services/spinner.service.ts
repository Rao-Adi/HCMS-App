import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  // A signal to hold the loading state.
  // WritableSignal<boolean>
  public readonly isLoading = signal(false);

  show() {
    this.isLoading.set(true);
  }

  hide() {
    this.isLoading.set(false);
  }
}
