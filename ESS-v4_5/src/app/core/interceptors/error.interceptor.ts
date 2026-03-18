import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BYPASS_INTERCEPTORS } from '../services/data.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      if (req.context.get(BYPASS_INTERCEPTORS) === true) {
        return throwError(() => error);
      }

      let isSessionTimeout = false;

      // Logic from your original DataService
      if (Array.isArray(error.error) && error.error[0]?.validationCode === 'SessionTimeOut') {
        isSessionTimeout = true;
      }
      else if (error.status === 401) {
        isSessionTimeout = true;
      }

      if (isSessionTimeout) {
        console.warn('Session timeout detected, navigating to sessiontimeout page.');
        if (!router.url.includes('/sessiontimeout')) {
          localStorage.setItem('HRISRedirectURL', router.url);
        }
        //router.navigate(['/sessiontimeout']);
        return throwError(() => ({ status: 401, message: 'SessionTimeOut' }));
      }

      let errorMessage = 'An unknown error occurred';
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Network error: ${error.message}`;
      } else {
        errorMessage = `Server error ${error.status}: ${error.message}`;
      }

      console.error('API Error:', errorMessage, error);
      return throwError(() => error);
    })
  );
};
