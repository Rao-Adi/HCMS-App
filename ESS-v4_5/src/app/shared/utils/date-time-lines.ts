import { Pipe, PipeTransform } from '@angular/core';

// A date-time shows on two lines everywhere in the DMS: the date, then the time under it.
// "Nov 10, 2026 16:05:42" (what CustomDateFormatPipe gives) or "2026-11-10 16:05:42" -> [date, time]; anything else -> null.
const DATE_TIME_PATTERNS = [
  /^([A-Za-z]{3,9} \d{1,2}, \d{4}) (\d{1,2}:\d{2}(?::\d{2})?(?: ?[AaPp][Mm])?)$/,
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/,
];

export function splitDateTime(text: unknown): [string, string] | null {
  const value = String(text ?? '').trim();
  if (!value) return null;
  for (const pattern of DATE_TIME_PATTERNS) {
    const m = pattern.exec(value);
    if (m) return [m[1], m[2]];
  }
  return null;
}

/**
 * For the plain HTML tables in popups: `{{ value | dtLines }}` gives "date\ntime" for a date-time and the value untouched for
 * anything else. The cell needs the `dms-dt` class (styles.css) so the line break is shown.
 */
@Pipe({ name: 'dtLines', standalone: true })
export class DateTimeLinesPipe implements PipeTransform {
  transform(value: unknown): string {
    const parts = splitDateTime(value);
    return parts ? `${parts[0]}\n${parts[1]}` : String(value ?? '');
  }
}
