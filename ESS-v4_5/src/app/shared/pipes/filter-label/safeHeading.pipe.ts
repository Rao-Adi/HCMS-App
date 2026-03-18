 import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'safeHeading',
  standalone: true,
  pure: false // As per your documentation, to detect lang changes
})
export class SafeTranslatePipe implements PipeTransform {

  // Modern, clean injection for standalone components
  private translate = inject(TranslateService);

  /**
   * Transforms a translation key (e.g., 'labels.EmployeeCode')
   * into the translated text ("Employee Code")
   * or a fallback ("EmployeeCode").
   */
  transform(key: string | null | undefined): string {
    if (!key || typeof key !== 'string' || key.trim() === '') {
      return ''; // Return empty for invalid keys
    }

    try {
      const translation = this.translate.instant(key);
      
      // If no translation found, return last part after dot
      return translation === key ? key.split('.').pop() || key : translation;
    } catch (error) {
      console.warn(`Translation failed for key: "${key}"`, error);
      // Fallback: "labels.EmployeeCode" → "EmployeeCode"
      return key.split('.').pop() || key;
    }
  }
}