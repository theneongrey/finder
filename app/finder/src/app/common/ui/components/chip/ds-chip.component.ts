import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

@Component({
  selector: 'ds-chip',
  imports: [DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button
      type="button"
      class="ds-chip"
      [style.background]="active() ? 'var(--teal-150)' : '#fff'"
      [style.color]="active() ? 'var(--accent)' : 'var(--ink-500)'"
      [style.border]="active() ? '1px solid var(--teal-300)' : '1px solid var(--border-hairline)'"
      (click)="toggle()"
    >
      @if (icon()) {
        <span class="ds-chip__icon" [style.opacity]="active() ? 1 : 0.35">
          <ds-icon [name]="icon()!" [size]="14" />
        </span>
      }
      {{ label() }}
    </button>
  `,
  styles: [`
    .ds-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 13px;
      border-radius: 999px;
      font-family: var(--font-body);
      font-size: var(--fs-ui-sm);
      font-weight: var(--weight-bold);
      cursor: pointer;
      white-space: nowrap;
      transition:
        background var(--duration-fast) var(--ease-standard),
        color var(--duration-fast) var(--ease-standard),
        border-color var(--duration-fast) var(--ease-standard);
    }
    .ds-chip:active { transform: scale(0.96); }
    .ds-chip__icon { display: contents; }
  `],
})
export class DsChipComponent {
  active = model<boolean>(false);
  label  = input.required<string>();
  icon   = input<string | undefined>(undefined);

  toggle(): void {
    this.active.set(!this.active());
  }
}
