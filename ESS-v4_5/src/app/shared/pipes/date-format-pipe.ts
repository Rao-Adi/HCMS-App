import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDateFormat',
})
export class CustomDateFormatPipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined): string | null {
 
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    const day = date.getDate().toString().padStart(2, '0'); // Add leading zero if needed
    const year = date.getFullYear();

    // Short month names
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

    // Check if the original value has time component
    const originalValue = value.toString();

    // Check if the string contains time (has space and colon for time)
    if (typeof value === 'string' && originalValue.includes(' ') && originalValue.includes(':')) {
      // Extract time from the original string to preserve exact time
      const timePart = originalValue.split(' ')[1] || '';
      const timeComponents = timePart.split(':');

      if (timeComponents.length >= 2) {
        const hours = timeComponents[0];
        const minutes = timeComponents[1];
        const seconds = timeComponents[2] || '00';

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      }
    }

    // If no time component or not a string with time format, return date only
    return `${day}/${month}/${year}`;
  }
}
