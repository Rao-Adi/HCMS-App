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
  get environment() {
    return this.appConfig;
  }
}
