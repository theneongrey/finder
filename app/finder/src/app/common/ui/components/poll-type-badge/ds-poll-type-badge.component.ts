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
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: inline-flex' },
  template: `
    <div class="badge" [style.background]="cfg().bg" [style.color]="cfg().fg">
      <ds-icon [name]="cfg().icon" [size]="iconSize()" color="currentColor" />
      @if (showLabel()) {
        <span class="badge__label">{{ cfg().label }}</span>
      }
    </div>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border-radius: var(--radius-pill);
      padding: 5px 10px 5px 8px;
      font-size: var(--fs-caption);
      font-weight: 600;
      font-family: var(--font-body);
      line-height: 1;
    }
    .badge:not(:has(.badge__label)) {
      padding: 8px;
      border-radius: var(--radius-sm);
    }
  `],
})
export class DsPollTypeBadgeComponent {
  type      = input.required<PollTypeBadgeType>();
  showLabel = input(true);

  protected readonly cfg      = computed(() => CONFIG[this.type()]);
  protected readonly iconSize = computed(() => this.showLabel() ? 13 : 16);
}
