import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DsIconButtonComponent } from '../icon-button/ds-icon-button.component';

@Component({
  selector: 'ds-bottom-sheet',
  imports: [DsIconButtonComponent],
  template: `
    <div class="ds-sheet-backdrop" (click)="close.emit()"></div>
    <div class="ds-sheet-panel">
      <div class="ds-sheet-handle"></div>
      <div class="ds-sheet-header">
        <div class="ds-sheet-titles">
          <div class="ds-sheet-title">{{ title() }}</div>
          @if (subtitle()) {
            <div class="ds-sheet-subtitle">{{ subtitle() }}</div>
          }
        </div>
        <ds-icon-button icon="close" variant="dark" [size]="32" (click)="close.emit()" />
      </div>
      <ng-content />
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--z-drawer);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      font-family: var(--font-body);
    }
    .ds-sheet-backdrop {
      position: absolute;
      inset: 0;
      background: var(--backdrop-scrim);
      backdrop-filter: blur(1px);
    }
    .ds-sheet-panel {
      position: relative;
      width: 100%;
      max-width: var(--mobile-max-width);
      background: var(--bg-sheet);
      border-radius: 26px 26px 0 0;
      box-shadow: var(--shadow-sheet);
      padding: 10px 22px 26px;
      max-height: 92vh;
      overflow-y: auto;
    }
    .ds-sheet-handle {
      width: 38px;
      height: 4.5px;
      border-radius: 3px;
      background: var(--cream-400);
      margin: 0 auto 16px;
    }
    .ds-sheet-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ds-sheet-titles { flex: 1; }
    .ds-sheet-title {
      font-size: var(--fs-display-2xs);
      font-family: var(--font-display);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      letter-spacing: var(--tracking-display-sm);
    }
    .ds-sheet-subtitle {
      font-size: var(--fs-ui);
      color: var(--text-tertiary);
      margin-top: 2px;
    }
    @media (min-width: 680px) {
      :host {
        align-items: center;
      }
      .ds-sheet-panel {
        border-radius: var(--radius-3xl);
        max-height: 80vh;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsBottomSheetComponent {
  title = input.required<string>();
  subtitle = input<string | undefined>(undefined);

  close = output<void>();
}
