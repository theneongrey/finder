import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { DsIconButtonComponent } from '../icon-button/ds-icon-button.component';

@Component({
  selector: 'ds-bottom-sheet',
  imports: [...HlmSheetImports, DsIconButtonComponent],
  templateUrl: './ds-bottom-sheet.component.html',
  styleUrl: './ds-bottom-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsBottomSheetComponent {
  title    = input.required<string>();
  subtitle = input<string | undefined>(undefined);
  open     = input<boolean>(false);

  close = output<void>();

  protected onStateChanged(state: string): void {
    if (state === 'closed') {
      this.close.emit();
    }
  }
}
