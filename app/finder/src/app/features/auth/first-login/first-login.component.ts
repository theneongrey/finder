import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { UserStore } from '../../../common/data/user.store';
import { AuthStepIndicatorComponent } from '../_shared/auth-step-indicator.component';
import { FirstLoginAboutComponent } from './steps/about/first-login-about.component';
import { FirstLoginSwipeComponent } from './steps/swipe/first-login-swipe.component';
import { FirstLoginNameComponent } from './steps/name/first-login-name.component';
import { FirstLoginDoneComponent } from './steps/done/first-login-done.component';

@Component({
    selector: 'app-first-login',
    imports: [
        AuthStepIndicatorComponent,
        FirstLoginAboutComponent,
        FirstLoginSwipeComponent,
        FirstLoginNameComponent,
        FirstLoginDoneComponent,
    ],
    templateUrl: './first-login.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
})
export class FirstLoginComponent {
    readonly currentStep = signal(0);

    constructor() {
        const userStore = inject(UserStore);
        const router = inject(Router);

        effect(() => {
            const user = userStore.user();
            if (user?.isAuthenticated && user.name) {
                void router.navigate(['/polls']);
            }
        });
    }

    nextStep(): void {
        this.currentStep.update((s) => s + 1);
    }
}
