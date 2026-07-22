import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BYPASS_INTERCEPTORS } from '../services/data.service';
import { NotificationToastService } from '../../shared/notification/notification.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  const notificationToastService = inject(NotificationToastService);

  return next(req).pipe(
    tap((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        const body = event.body;
        // Intercept 200 OK responses that indicate a business/logical error
        if (body && (body.Success === false || body.success === false)) {
          const errMsg = body.Message || body.message || body.Error || body.error;
          if (errMsg && typeof errMsg === 'string') {
            notificationToastService.setLastBackendError(errMsg);
          }
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (req.context.get(BYPASS_INTERCEPTORS) === true) {
        return throwError(() => error);
      }

      let isSessionTimeout = false;

      // Logic from original DataService
      if (Array.isArray(error.error) && error.error[0]?.validationCode === 'SessionTimeOut') {
        isSessionTimeout = true;
      } else if (error.status === 401) {
        isSessionTimeout = true;
      }

      if (isSessionTimeout) {
        console.warn('Session timeout detected, navigating to sessiontimeout page.');
        if (!router.url.includes('/sessiontimeout')) {
          localStorage.setItem('HRISRedirectURL', router.url);
        }
        return throwError(() => ({ status: 401, message: 'SessionTimeOut' }));
      }

      // Extract exact server error message
      let extractedMessage = 'An unknown server error occurred.';
      if (error.error) {
        if (typeof error.error === 'string') {
          extractedMessage = error.error;
        } else if (error.error.Message) {
          extractedMessage = error.error.Message;
        } else if (error.error.message) {
          extractedMessage = error.error.message;
        } else if (error.error.errors && typeof error.error.errors === 'object') {
          const errorList: string[] = [];
          for (const key of Object.keys(error.error.errors)) {
            const val = error.error.errors[key];
            if (Array.isArray(val)) {
              errorList.push(...val);
            } else if (typeof val === 'string') {
              errorList.push(val);
            }
          }
          if (errorList.length > 0) {
            extractedMessage = errorList.join('\n');
          }
        }
      } else if (error.message) {
        extractedMessage = error.message;
      }

      notificationToastService.setLastBackendError(extractedMessage);

      return throwError(() => error);
    })
  );
};
