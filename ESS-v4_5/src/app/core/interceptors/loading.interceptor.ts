import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { SpinnerService } from '../services/spinner.service';
import { finalize } from 'rxjs/operators';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinnerService = inject(SpinnerService);

  // Show the spinner
  spinnerService.show();

  // Use finalize to hide the spinner on completion or error
  return next(req).pipe(
    finalize(() => {
      spinnerService.hide();
    })
  );
};
