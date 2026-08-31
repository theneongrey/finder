import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-background-animation',
    templateUrl: './background-animation.component.html',
    styleUrl: './background-animation.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundAnimationComponent {}
