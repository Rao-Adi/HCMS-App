import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDateFormat',
})
export class CustomDateFormatPipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined): string | null {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = months[date.getMonth()];

    // Check if the original value contains a time component (has a colon ':')
    const originalValue = value.toString();
    const hasTime = originalValue.includes(':');

    if (hasTime) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
    }

    return `${month} ${day}, ${year}`;
  }
}
