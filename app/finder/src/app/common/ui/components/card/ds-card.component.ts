import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-card',
  template: `
    <div
      [style.padding.px]="padding()"
      [style.border]="accentBorder() ? 'none' : '1px solid var(--border-hairline-soft)'"
      [style.border-left]="accentBorder() ? '4px solid var(--accent)' : undefined"
      class="ds-card"
    >
      <ng-content />
    </div>
  `,
  styles: [`
    .ds-card {
      position: relative;
      background: var(--surface-card);
      border-radius: var(--radius-3xl);
      box-shadow: var(--shadow-card-soft);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsCardComponent {
  padding = input<number>(20);
  accentBorder = input<boolean>(false);
}
