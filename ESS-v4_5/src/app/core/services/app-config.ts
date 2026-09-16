import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  // This will store the loaded config
  private appConfig: any;

  // Inject HttpClient to fetch the file
  constructor(private http: HttpClient) { }

  /**
   * This method will be called on app startup to load the config
   */
  public loadConfig() {
    // The path is 'app-config.json' because it's in the root of the 'public' folder
    const configUrl = 'app-config.json';

    return firstValueFrom(this.http.get(configUrl))
      .then((config) => {
        this.appConfig = config;
        console.log('External config loaded successfully.');
      })
      .catch((err) => {
        console.error('CRITICAL: Could not load external config.', err);
      });
  }

  // A getter for the API URL
  public get baseUrl(): string {
    if (!this.appConfig) {
      // This should not happen, but it's a good safety check
      throw new Error('Config not loaded!');
    }
    return this.appConfig.apiBaseUrl;
  }

  // A getter for the Login URL
  public get loginUrl(): string {
    if (!this.appConfig) {
      throw new Error('Config not loaded!');
    }
    return this.appConfig.loginUrl;
  }

  public get SessionTimeoutURL(): string {
    if (!this.appConfig) {
      throw new Error('Config not loaded!');
    }
    return this.appConfig.sessionTimeoutURL;
  }
  /**
   * Origin that serves uploaded files. Documents and templates are stored with a relative path
   * (e.g. "/uploads/documents/Foo.docx") and served as static files by the API -- NOT by the app.
   * Resolving such a path against the page origin reaches the Angular app instead, which answers
   * with index.html under the dev server and 404 under a deployed sub-path; either way the
   * download is wrong. Derived from apiBaseUrl by dropping its trailing "/api".
   */
  public get fileBaseUrl(): string {
    if (!this.appConfig) {
      throw new Error('Config not loaded!');
    }
    return String(this.appConfig.apiBaseUrl || '').replace(/\/api\/?$/i, '');
  }

  /** Turns a stored relative file path into an absolute URL. Absolute paths are left alone. */
  public resolveFileUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = this.fileBaseUrl.replace(/\/$/, '');
    return base + (path.startsWith('/') ? path : '/' + path);
  }

  get environment() {
    return this.appConfig;
  }
}
