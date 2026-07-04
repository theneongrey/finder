import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-vote-card-date',
  templateUrl: './vote-card-date.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardDateComponent {
  private readonly translate = inject(TranslateService);

  text = input('');

  startDate = computed(() => {
    const parts = this.text().split(';');
    const ts = parseInt(parts[0]);
    return isNaN(ts) ? null : new Date(ts);
  });

  endDate = computed(() => {
    const parts = this.text().split(';');
    if (parts.length < 2) return null;
    const ts = parseInt(parts[1]);
    return isNaN(ts) ? null : new Date(ts);
  });

  formatDate(date: Date): string {
    return date.toLocaleDateString(this.translate.currentLang() ?? undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
