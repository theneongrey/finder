import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeSince',
})
export class TimeSincePipe implements PipeTransform {
  transform(date: Date | string | number): string {
    const inputDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - inputDate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) {return 'just now';}
    if (diffMins < 60)
      {return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;}
    if (diffHours < 24)
      {return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;}
    if (diffDays < 30) {return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;}
    if (diffMonths < 12)
      {return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;}

    return inputDate.toLocaleDateString('de-DE');
  }
}
