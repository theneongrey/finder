import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    ViewChild,
    effect,
    input,
} from '@angular/core';

@Component({
    selector: 'app-analog-clock',
    templateUrl: './analog-clock.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalogClockComponent implements AfterViewInit {
    time = input.required<Date>();
    size = input<number>(56);

    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    private viewInitialized = false;

    constructor() {
        effect(() => {
            const t = this.time();
            if (this.viewInitialized) {
                this.draw(t);
            }
        });
    }

    ngAfterViewInit() {
        this.viewInitialized = true;
        this.draw(this.time());
    }

    private draw(time: Date) {
        const SIZE = this.size();
        const primaryColor =
            getComputedStyle(document.documentElement)
                .getPropertyValue('--color-primary')
                .trim() || '#4797bf';

        const cx = SIZE / 2;
        const cy = SIZE / 2;
        const r = SIZE / 2 - 2;

        const canvas = this.canvasRef.nativeElement;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, SIZE, SIZE);

        // Face
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Dial tick marks
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const isHour = i % 3 === 0;
            const inner = r * (isHour ? 0.78 : 0.85);
            const outer = r * 0.95;
            ctx.beginPath();
            ctx.moveTo(
                cx + inner * Math.cos(angle),
                cy + inner * Math.sin(angle),
            );
            ctx.lineTo(
                cx + outer * Math.cos(angle),
                cy + outer * Math.sin(angle),
            );
            ctx.strokeStyle = primaryColor;
            ctx.globalAlpha = isHour ? 1 : 0.5;
            ctx.lineWidth = isHour ? 1.5 : 1;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        const hours = time.getHours() % 12;
        const minutes = time.getMinutes();

        // Hour hand
        const hourAngle = ((hours + minutes / 60) * 30 - 90) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
            cx + r * 0.52 * Math.cos(hourAngle),
            cy + r * 0.52 * Math.sin(hourAngle),
        );
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Minute hand
        const minuteAngle = (minutes * 6 - 90) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
            cx + r * 0.74 * Math.cos(minuteAngle),
            cy + r * 0.74 * Math.sin(minuteAngle),
        );
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Center cap
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
    }
}
