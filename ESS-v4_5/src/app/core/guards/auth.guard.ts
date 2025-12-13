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
  const apiUrl = `Security/CanViewForAuthGuard?FormId=${formId}&AppCode=ESSv4.5`;

  return data.get<string>(apiUrl).pipe(
    map((resp: any): boolean | UrlTree => {
      const r = String(resp).toLowerCase();

      if (r === 'sessiontimeout') {
        rememberReturnUrl();
        return DEBUG_STAY_PUT
          ? stayOnSamePage()
          : router.createUrlTree(['/applicationlevelerror'], { queryParams: { type: 'sessiontimeout' } });
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
      rememberReturnUrl();
      return of(DEBUG_STAY_PUT
        ? stayOnSamePage()
        : router.createUrlTree(['/applicationlevelerror'], { queryParams: { type: 'guard-error' } })
      );
    })
  );
};
