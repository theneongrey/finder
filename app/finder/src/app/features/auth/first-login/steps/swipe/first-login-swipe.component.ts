import {
    ChangeDetectionStrategy,
    Component,
    output,
    signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '../../../../../common/ui/ds-components/button/ds-button.component';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
    selector: 'app-first-login-swipe',
    imports: [TranslatePipe, DsButtonComponent, DsIconComponent],
    templateUrl: './first-login-swipe.component.html',
    styleUrl: './first-login-swipe.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
})
export class FirstLoginSwipeComponent {
    next = output<void>();

    readonly dragX = signal(0);
    readonly swiped = signal(false);
    readonly dragging = signal(false);

    protected readonly jaOpacity = () =>
        Math.min(1, Math.max(0, this.dragX() / 80));
    protected readonly neinOpacity = () =>
        Math.min(1, Math.max(0, -this.dragX() / 80));
    protected readonly cardTransform = () =>
        `translateX(${this.dragX()}px) rotate(${this.dragX() * 0.04}deg)`;

    private startX = 0;

    onPointerDown(event: PointerEvent): void {
        if (this.swiped()) return;
        this.dragging.set(true);
        this.startX = event.clientX;
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    onPointerMove(event: PointerEvent): void {
        if (!this.dragging()) return;
        this.dragX.set(event.clientX - this.startX);
    }

    onPointerUp(): void {
        if (!this.dragging()) return;
        this.dragging.set(false);
        if (Math.abs(this.dragX()) >= 80) {
            this.swiped.set(true);
        } else {
            this.dragX.set(0);
        }
    }
}
