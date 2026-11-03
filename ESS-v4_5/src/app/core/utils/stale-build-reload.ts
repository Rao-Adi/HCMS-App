import { ErrorHandler, Injectable } from '@angular/core';

// After a new build is published the files the old one asked for by name (chunk-XXXX.js) are gone. A tab that was opened before
// the deploy still holds the old index.html, so the first page it has to download in pieces fails with "Failed to fetch
// dynamically imported module" -- a 404 from the server (or, behind the SPA rewrite, the HTML page where a script was
// expected) and a screen that does nothing. Loading the page again fetches the new index.html and everything works.
const RELOADED_AT = 'dmsStaleBuildReloadAt';

// What each browser calls a lazy chunk that could not be loaded.
const STALE_BUILD = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed|ChunkLoadError/i;

export function isStaleBuildError(error: unknown): boolean {
  const e = error as any;
  return STALE_BUILD.test(String(e?.message ?? e?.rejection?.message ?? e ?? ''));
}

// Loads the page again -- on `target` (an app URL such as /documents/x) when the failed navigation is known, so the person
// ends up where they were going. At most once every 30 seconds: if the fresh page fails the same way (index.html itself being
// served from a cache) a loop of reloads would be worse than the error. Returns whether it reloaded.
export function reloadForNewBuild(target?: string): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT) || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    // Storage blocked: reload anyway rather than leave a dead screen.
  }

  if (target) {
    // The base href (/DMSUI/ in production) is not part of the router's URL.
    window.location.assign(new URL(target.replace(/^\/+/, ''), document.baseURI).href);
  } else {
    window.location.reload();
  }
  return true;
}

// For a lazy chunk that is not loaded by the router (the router has its own handler, see app.config.ts).
@Injectable()
export class StaleBuildErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    if (isStaleBuildError(error) && reloadForNewBuild()) return;
    super.handleError(error);
  }
}
