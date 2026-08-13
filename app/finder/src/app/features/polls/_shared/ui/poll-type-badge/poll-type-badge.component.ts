import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { OptionType } from '../../models/poll-detail.model';

const CONFIG: Record<OptionType, { icon: string; label: string; bg: string; fg: string }> = {
  [OptionType.YesNo]:  { icon: 'checklist', label: 'Ja / Nein', bg: 'var(--person-1-bg)', fg: 'var(--person-1-fg)' },
  [OptionType.Rating]: { icon: 'trophy',    label: 'Bewertung', bg: 'var(--person-3-bg)', fg: 'var(--person-3-fg)' },
  [OptionType.Date]:   { icon: 'calendar',  label: 'Termin',    bg: 'var(--person-4-bg)', fg: 'var(--person-4-fg)' },
};

@Component({
  selector: 'app-poll-type-badge',
  imports: [DsIconComponent],
  templateUrl: './poll-type-badge.component.html',
  styleUrl: './poll-type-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: inline-flex' },
})
export class PollTypeBadgeComponent {
  type      = input.required<OptionType>();
  showLabel = input(true);

  protected readonly cfg      = computed(() => CONFIG[this.type()]);
  protected readonly iconSize = computed(() => this.showLabel() ? 13 : 16);
}
