import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { DsButtonComponent } from '../button/ds-button.component';

@Component({
  selector: 'ds-bottom-sheet',
  imports: [...HlmSheetImports, DsButtonComponent],
  templateUrl: './ds-bottom-sheet.component.html',
  styleUrl: './ds-bottom-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsBottomSheetComponent {
  title    = input.required<string>();
  subtitle = input<string | undefined>(undefined);
  open     = input<boolean>(false);

  dismissed = output<void>();

  private dragStartY = 0;
  private isDragging = false;

  protected onStateChanged(state: string): void {
    if (state === 'closed') {
      this.dismissed.emit();
    }
  }

  protected onHandlePointerDown(event: PointerEvent): void {
    this.dragStartY = event.clientY;
    this.isDragging = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onHandlePointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    if (event.clientY - this.dragStartY > 80) {
      this.isDragging = false;
      this.dismissed.emit();
    }
  }

  protected onHandlePointerUp(): void {
    this.isDragging = false;
  }
}
