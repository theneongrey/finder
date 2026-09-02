import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '../../../../../common/ui/ds-components/button/ds-button.component';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
    selector: 'app-first-login-about',
    imports: [TranslatePipe, DsButtonComponent, DsIconComponent],
    templateUrl: './first-login-about.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
})
export class FirstLoginAboutComponent {
    next = output<void>();

    readonly features = [
        {
            icon: 'calendar',
            color: 'var(--accent)',
            bg: 'var(--teal-100)',
            key: 'auth.firstLogin.about.feature1',
            subKey: 'auth.firstLogin.about.feature1Sub',
        },
        {
            icon: 'check',
            color: '#5d9a56',
            bg: '#e2ede1',
            key: 'auth.firstLogin.about.feature2',
            subKey: 'auth.firstLogin.about.feature2Sub',
        },
        {
            icon: 'star',
            color: '#e0a42c',
            bg: '#fdf3d8',
            key: 'auth.firstLogin.about.feature3',
            subKey: 'auth.firstLogin.about.feature3Sub',
        },
    ];
}
