import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    inject,
    signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UserStore } from '../../../../../common/data/user.store';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
    selector: 'app-first-login-done',
    imports: [TranslatePipe, DsIconComponent],
    templateUrl: './first-login-done.component.html',
    styleUrl: './first-login-done.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
})
export class FirstLoginDoneComponent implements OnDestroy {
    readonly barWidth = signal('8%');
    private timer: ReturnType<typeof setTimeout> | undefined;

    protected readonly name = inject(UserStore).user()?.name ?? '';

    constructor() {
        const router = inject(Router);
        const userStore = inject(UserStore);

        setTimeout(() => this.barWidth.set('100%'), 60);

        this.timer = setTimeout(() => {
            const redirectUrl = userStore.redirectUrl();
            userStore.setRedirectUrl(undefined);
            void router.navigate([redirectUrl ?? '/polls']);
        }, 2000);
    }

    ngOnDestroy(): void {
        clearTimeout(this.timer);
    }
}
