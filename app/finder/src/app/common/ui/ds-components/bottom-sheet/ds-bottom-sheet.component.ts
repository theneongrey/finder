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
  private panelEl: HTMLElement | null = null;

  protected onStateChanged(state: string): void {
    if (state === 'closed') {
      this.dismissed.emit();
    }
  }

  protected onHandlePointerDown(event: PointerEvent): void {
    this.panelEl = (event.target as HTMLElement).closest('.ds-sheet-panel') as HTMLElement | null;
    this.dragStartY = event.clientY;
    this.isDragging = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onHandlePointerMove(event: PointerEvent): void {
    if (!this.isDragging || !this.panelEl) return;
    const delta = Math.max(0, event.clientY - this.dragStartY);
    this.panelEl.style.transition = 'none';
    this.panelEl.style.transform = `translateY(${delta}px)`;
  }

  protected onHandlePointerUp(): void {
    if (!this.isDragging || !this.panelEl) {
      this.isDragging = false;
      return;
    }
    this.isDragging = false;

    const match = this.panelEl.style.transform.match(/translateY\((\d+(?:\.\d+)?)px\)/);
    const delta = match ? parseFloat(match[1]) : 0;
    const panel = this.panelEl;
    this.panelEl = null;

    if (delta >= 100) {
      panel.style.transition = 'transform 220ms ease';
      panel.style.transform = `translateY(${panel.offsetHeight}px)`;
      setTimeout(() => {
        panel.style.transition = '';
        panel.style.transform = '';
        this.dismissed.emit();
      }, 220);
    } else {
      panel.style.transition = 'transform 300ms cubic-bezier(.22,.7,.3,1)';
      panel.style.transform = 'translateY(0)';
      setTimeout(() => {
        panel.style.transition = '';
        panel.style.transform = '';
      }, 300);
    }
  }
}
