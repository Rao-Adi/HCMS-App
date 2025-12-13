import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core'; // 1. Added importProvidersFrom
import { provideRouter, withInMemoryScrolling, UrlSerializer, DefaultUrlSerializer, UrlTree } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { AppConfigService } from './core/services/app-config';

// Import your interceptors
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// 2. Add imports for ngx-translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
// Import for Animations (Solution for NG05105)
import { provideAnimations } from '@angular/platform-browser/animations';
// Import for NG-ZORRO Locale (Solution for NG0701)
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n'; // 👈 NEW IMPORTS

ModuleRegistry.registerModules([AllCommunityModule]);

export function initializeAppConfig(appConfigService: AppConfigService) {
  return () => appConfigService.loadConfig();
}

export class LowerCaseUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    return super.parse(url ? url.toLowerCase() : url);
  }
}

// 3. Add your EmptyTranslateLoader class (as per your documentation)
/**
 * Prevents @ngx-translate from auto-loading any files,
 * allowing app.component.ts to take control.
 */
export class EmptyTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({}); // Return empty object
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    // ⭐ 3. NG-ZORRO Locale Providers (Solution for NG0701)
    provideAnimations(),
    { provide: NZ_I18N, useValue: en_US }, // 'en_US' set karna zaroori hai
    // Your existing HttpClient providers
    provideHttpClient(
      withInterceptors([
        loadingInterceptor, // Handles spinner
        authInterceptor,    // Handles headers
        errorInterceptor    // Handles session timeout
      ]),
      withInterceptorsFromDi()
    ),

    // 4. Add the ngx-translate providers
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: EmptyTranslateLoader
        }
      })
    ),

    // Your existing APP_INITIALIZER provider
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppConfig,
      deps: [AppConfigService],
      multi: true
    },

    // Your existing Serializer provider
    {
      provide: UrlSerializer,
      useClass: LowerCaseUrlSerializer
    }
  ],
};
