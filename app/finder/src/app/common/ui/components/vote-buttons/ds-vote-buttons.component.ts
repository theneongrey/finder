import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

@Component({
  selector: 'ds-vote-buttons',
  imports: [DsIconComponent],
  template: `
    <div class="ds-vote-row">
      <button type="button" class="ds-vote-btn ds-vote-btn--no" (click)="no.emit()">
        <ds-icon name="close" [size]="24" />
      </button>
      <button type="button" class="ds-vote-btn--skip" (click)="skip.emit()">Überspringen</button>
      <button type="button" class="ds-vote-btn ds-vote-btn--yes" (click)="yes.emit()">
        <ds-icon name="heart" [size]="24" />
      </button>
    </div>
  `,
  styles: [`
    .ds-vote-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 34px;
      width: 100%;
    }
    .ds-vote-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ds-vote-btn--no {
      border: 2px solid var(--red-200);
      background: var(--red-100);
      color: var(--red-700);
    }
    .ds-vote-btn--yes {
      border: 2px solid var(--teal-300);
      background: #fff;
      color: var(--accent);
    }
    .ds-vote-btn--skip {
      border: none;
      background: none;
      color: var(--accent);
      font-family: var(--font-body);
      font-size: var(--fs-body);
      font-weight: var(--weight-bold);
      cursor: pointer;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block;' },
})
export class DsVoteButtonsComponent {
  yes = output<void>();
  no = output<void>();
  skip = output<void>();
}
