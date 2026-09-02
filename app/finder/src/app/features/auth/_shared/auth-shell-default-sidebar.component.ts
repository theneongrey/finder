import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
    selector: 'app-auth-shell-default-sidebar',
    imports: [RouterLink, TranslatePipe, DsIconComponent, NgOptimizedImage],
    templateUrl: './auth-shell-default-sidebar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'hidden w-[520px] flex-none flex-col justify-between border-r border-[var(--border-hairline-soft)] bg-[rgba(250,253,249,0.5)] px-11 py-10 lg:flex',
    },
})
export class AuthShellDefaultSidebarComponent {
    readonly features = [
        'auth.shell.feature1',
        'auth.shell.feature2',
        'auth.shell.feature3',
    ];
}
