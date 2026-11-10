// auth.guard.ts
import { inject, isDevMode } from '@angular/core';
import { Router, UrlTree, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataService } from '../services/data.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const data = inject(DataService);

  // Only protect routes that explicitly ask for it
  if (route.data?.['authRequired'] !== true) return true;

  const DEBUG_STAY_PUT = isDevMode(); // flip to your env flag if you prefer

  // Helper: in debug, cancel navigation if we already have something rendered; otherwise show /security
  const stayOnSamePage = (): boolean | UrlTree => {
    if (router.navigated) {
      console.warn('[AuthGuard][DEBUG] Blocking redirect; staying on current page.');
      return false; // cancels this navigation → UI stays where it is
    }
    // first navigation: pick a safe, public page to render
    return router.createUrlTree(['/security']);
  };

  const rememberReturnUrl = () => {
    if (!state.url.includes('applicationlevelerror')) {
      localStorage.setItem('HRISRedirectURL', state.url);
    }
  };

  const formId = route.data['formId'];
  const apiUrl = `Security/CanViewForAuthGuard?FormId=${formId}&AppCode=DMS-b`;

  // The session is gone (never logged in through the ERP, expired, or the ERP session was closed): the DMS has no login of its own, so the user
  // goes to the "YOUR SESSION HAS TIMED OUT" page, which takes them to the ERP login after a few seconds. The address they came for (e.g. the page
  // an email notification pointed at) is remembered, and the login flow returns them to it.
  const sessionExpired = (): boolean | UrlTree => {
    rememberReturnUrl();
    return DEBUG_STAY_PUT ? stayOnSamePage() : router.createUrlTree(['/sessiontimeout']);
  };

  return data.get<string>(apiUrl).pipe(
    map((resp: any): boolean | UrlTree => {
      const r = String(resp).toLowerCase();

      if (r === 'sessiontimeout') {
        return sessionExpired();
      }

      // The 'IsLogin' check has no permission to refuse: it is only asking whether a session exists, and the API answers 'false'
      // (not 'SessionTimeOut') when there is none. That is an expired session, not 'access denied'.
      if (formId === 'IsLogin' && r !== 'true') {
        return sessionExpired();
      }

      if (r === 'false') {
        rememberReturnUrl();
        return DEBUG_STAY_PUT
          ? stayOnSamePage()
          : router.createUrlTree(['/applicationlevelerror'], { queryParams: { type: 'denied' } });
      }

      return r === 'true';
    }),
    catchError(err => {
      console.error('AuthGuard error:', err);
      // The interceptor turns a 401 / SessionTimeOut answer into { status: 401 }.
      if (err?.status === 401 || err?.message === 'SessionTimeOut') {
        return of(sessionExpired());
      }
      rememberReturnUrl();
      return of(DEBUG_STAY_PUT
        ? stayOnSamePage()
        : router.createUrlTree(['/applicationlevelerror'], { queryParams: { type: 'guard-error' } })
      );
    })
  );
};
