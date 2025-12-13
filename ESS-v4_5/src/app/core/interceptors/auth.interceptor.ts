import { inject, Injector } from '@angular/core'; // <-- Import Injector
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { DataService, BYPASS_INTERCEPTORS } from '../services/data.service';
import { Observable } from 'rxjs';

// --- Helper functions (getXSRFToken, getUserAgent) ---
// (These are from your original DataService)
function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.startsWith(nameEQ)) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

function getUserAgent(name: string): string | null {
  let browser = 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.match(/msie/)) { browser = 'ie'; }
  else if (ua.match(/firefox/)) { browser = 'firefox'; }
  else if (ua.match(/chrome/)) { browser = 'chrome'; }
  else if (ua.match(/opera/)) { browser = 'opera'; }
  else if (ua.match(/safari/)) { browser = 'safari'; }

  const cookieValue = getCookie(name);
  if (cookieValue) {
    return `${browser}-${cookieValue}`;
  }
  return null;
}
// --- End Helper Functions ---


export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  // --- THIS IS THE FIX ---
  // 1. Inject the INJECTOR, not the service directly.
  const injector = inject(Injector);
  // --- END FIX ---

  // Check if we should bypass
  if (req.context.get(BYPASS_INTERCEPTORS) === true) {
    return next(req);
  }

  // --- THIS IS THE FIX ---
  // 2. Get the DataService INSIDE the function.
  // This delays its creation until the first HTTP call,
  // by which time AppConfigService is ready.
  const dataService = injector.get(DataService);
  // --- END FIX ---

  const token = dataService._TokenKey;
  const xsrf = getCookie("xsrftoken");
  const userAgent = getUserAgent("login");

  let clonedReq = req.clone({
    setHeaders: {}
  });

  if ((req.method === 'POST' || req.method === 'PUT') && !(req.body instanceof FormData)) {
    clonedReq = clonedReq.clone({
      setHeaders: { 'Content-Type': 'application/json' }
    });
  }

  if (userAgent) {
    clonedReq = clonedReq.clone({
      setHeaders: { 'login': userAgent }
    });
  }

  if (token) {
    clonedReq = clonedReq.clone({
      setHeaders: { 'Token': token }
    });
  }
  if (xsrf) {
    clonedReq = clonedReq.clone({
      setHeaders: { 'xsrftoken': xsrf }
    });
  }

  return next(clonedReq);
};
