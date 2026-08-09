import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

export type EmptyStateLayout = 'row' | 'tile';

@Component({
  selector: 'ds-empty-state-button',
  imports: [DsIconComponent],
  template: `
    @if (layout() === 'tile') {
      <button type="button" class="ds-esb-tile" (click)="clicked.emit()">
        <span class="ds-esb-tile__icon-wrap">
          <ds-icon [name]="icon()" [size]="19" color="var(--accent)" />
        </span>
        <span class="ds-esb-tile__label">{{ label() }}</span>
      </button>
    } @else {
      <button type="button" class="ds-esb-row" (click)="clicked.emit()">
        <span class="ds-esb-row__icon">
          <ds-icon [name]="icon()" [size]="18" color="#fff" />
        </span>
        {{ label() }}
      </button>
    }
  `,
  styles: [`
    .ds-esb-tile {
      border: 1.5px dashed var(--sand-500);
      background: rgba(255, 255, 255, 0.4);
      border-radius: var(--radius-xl);
      padding: 18px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 9px;
      cursor: pointer;
      font-family: var(--font-body);
      width: 100%;
    }
    .ds-esb-tile__icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--accent-tint);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ds-esb-tile__label {
      font-size: var(--fs-ui);
      font-weight: var(--weight-bold);
      color: var(--ink-700);
      text-align: center;
      line-height: 1.2;
    }
    .ds-esb-row {
      width: 100%;
      border: 1.5px dashed var(--sand-500);
      background: rgba(255, 255, 255, 0.4);
      border-radius: var(--radius-3xl);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      font-family: var(--font-body);
      color: var(--ink-600);
      font-size: var(--fs-body);
      font-weight: var(--weight-bold);
    }
    .ds-esb-row__icon {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents;' },
})
export class DsEmptyStateButtonComponent {
  layout = input<EmptyStateLayout>('row');
  icon = input<string>('plus');
  label = input.required<string>();

  clicked = output<void>();
}
