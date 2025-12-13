import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzI18nModule } from 'ng-zorro-antd/i18n';
// --- 1. DEFINE THE TRANSLATION TYPE ---
// This tells TypeScript that our JSON files are objects
// that can be indexed by a string (e.g., labels['EmployeeCode']).
// This directly fixes the "Index signature...is missing" error.
type TranslationObject = { [key: string]: any };

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [CommonModule, RouterOutlet, NzDatePickerModule, NzI18nModule]
})
export class App {
  title = signal('ESS v4.5');

  constructor(private translate: TranslateService, private http: HttpClient) {
    const lang = 'en-GB';
    translate.setDefaultLang(lang);
    translate.use(lang);

    this.loadCombinedTranslations(lang);
  }

  async loadCombinedTranslations(lang: string) {
    const basePath = `/assets/i18n/${lang}`;

    try {
      // --- 2. APPLY THE TYPE TO YOUR HTTP CALLS ---
      // By adding <TranslationObject>, we tell TypeScript what to expect,
      // which resolves all the errors.
      const [labels, validations] = await Promise.all([
        firstValueFrom(this.http.get<TranslationObject>(`${basePath}/labels.json`)),
        firstValueFrom(this.http.get<TranslationObject>(`${basePath}/validations.json`))
      ]);

      this.translate.setTranslation(lang, {
        labels,
        validations
      }, true);

    } catch (error) {
      console.error('Failed to load initial translations', error);
    }
  }
}
