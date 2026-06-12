import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'timeSince',
  pure: false,
})
export class TimeSincePipe implements PipeTransform {
  private readonly translateService = inject(TranslateService);

  transform(date: Date | string | number): string {
    const lang = this.translateService.currentLang();
    const inputDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - inputDate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) {
      return this.translateService.instant('project.timeAgo.justNow');
    }
    if (diffMins < 60) {
      return this.translateService.instant(
        diffMins === 1 ? 'project.timeAgo.minuteAgo' : 'project.timeAgo.minutesAgo',
        { count: diffMins },
      );
    }
    if (diffHours < 24) {
      return this.translateService.instant(
        diffHours === 1 ? 'project.timeAgo.hourAgo' : 'project.timeAgo.hoursAgo',
        { count: diffHours },
      );
    }
    if (diffDays < 30) {
      return this.translateService.instant(
        diffDays === 1 ? 'project.timeAgo.dayAgo' : 'project.timeAgo.daysAgo',
        { count: diffDays },
      );
    }
    if (diffMonths < 12) {
      return this.translateService.instant(
        diffMonths === 1 ? 'project.timeAgo.monthAgo' : 'project.timeAgo.monthsAgo',
        { count: diffMonths },
      );
    }

    return inputDate.toLocaleDateString(lang ?? undefined);
  }
}
