import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
    selector: 'app-auth-shell-first-login-sidebar',
    imports: [RouterLink, TranslatePipe, DsIconComponent, NgOptimizedImage],
    templateUrl: './auth-shell-first-login-sidebar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'hidden w-[520px] flex-none flex-col justify-between border-r border-[var(--border-hairline-soft)] bg-[rgba(250,253,249,0.5)] px-11 py-10 lg:flex',
    },
})
export class AuthShellFirstLoginSidebarComponent {
    readonly features = [
        { icon: 'calendar', key: 'auth.firstLogin.sidebar.feature1' },
        { icon: 'check', key: 'auth.firstLogin.sidebar.feature2' },
        { icon: 'star', key: 'auth.firstLogin.sidebar.feature3' },
    ];
}
