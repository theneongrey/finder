import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

@Component({
  selector: 'ds-vote-buttons',
  imports: [DsIconComponent],
  template: `
    <div class="ds-vote-row">
      <button type="button" class="ds-vote-btn ds-vote-btn--no" (click)="no.emit()">
        <ds-icon name="close" [size]="24" color="var(--negative)" />
      </button>
      @if (showMaybe()) {
        <button type="button" class="ds-vote-btn ds-vote-btn--maybe" (click)="maybe.emit()">
          <ds-icon name="info" [size]="21" color="var(--warning)" />
        </button>
      }
      <button type="button" class="ds-vote-skip" (click)="skip.emit()">Überspringen</button>
      <button type="button" class="ds-vote-btn ds-vote-btn--yes" (click)="yes.emit()">
        <ds-icon name="check" [size]="25" color="#fff" />
      </button>
    </div>
  `,
  styles: [`
    .ds-vote-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      width: 100%;
    }
    .ds-vote-btn {
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform var(--duration-fast) var(--ease-standard);
    }
    .ds-vote-btn:active { transform: scale(0.92); }
    .ds-vote-btn--no {
      width: 62px;
      height: 62px;
      border: 1.5px solid #f0c3bd;
      background: #fff;
    }
    .ds-vote-btn--maybe {
      width: 54px;
      height: 54px;
      border: 1.5px solid #e6cfa4;
      background: #fff;
    }
    .ds-vote-btn--yes {
      width: 62px;
      height: 62px;
      border: none;
      background: var(--positive-strong);
      box-shadow: 0 8px 20px rgba(93, 154, 86, 0.34);
    }
    .ds-vote-skip {
      height: 44px;
      padding: 0 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-hairline);
      background: #fff;
      color: var(--ink-600);
      font-family: var(--font-body);
      font-size: var(--fs-body-xs);
      font-weight: var(--weight-bold);
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease-standard);
    }
    .ds-vote-skip:hover { background: var(--cream-100); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block;' },
})
export class DsVoteButtonsComponent {
  showMaybe = input<boolean>(false);

  yes   = output<void>();
  no    = output<void>();
  skip  = output<void>();
  maybe = output<void>();
}
