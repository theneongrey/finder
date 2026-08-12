import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

export type PollTypeBadgeType = 'yesno' | 'rating' | 'date';

const CONFIG: Record<PollTypeBadgeType, { icon: string; label: string; bg: string; fg: string }> = {
  yesno:  { icon: 'checklist', label: 'Ja / Nein', bg: 'var(--person-1-bg)', fg: 'var(--person-1-fg)' },
  rating: { icon: 'trophy',    label: 'Bewertung', bg: 'var(--person-3-bg)', fg: 'var(--person-3-fg)' },
  date:   { icon: 'calendar',  label: 'Termin',    bg: 'var(--person-4-bg)', fg: 'var(--person-4-fg)' },
};

@Component({
  selector: 'ds-poll-type-badge',
  imports: [DsIconComponent],
  templateUrl: './ds-poll-type-badge.component.html',
  styleUrl: './ds-poll-type-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: inline-flex' },
})
export class DsPollTypeBadgeComponent {
  type      = input.required<PollTypeBadgeType>();
  showLabel = input(true);

  protected readonly cfg      = computed(() => CONFIG[this.type()]);
  protected readonly iconSize = computed(() => this.showLabel() ? 13 : 16);
}
