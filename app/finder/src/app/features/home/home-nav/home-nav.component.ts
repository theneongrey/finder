import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-home-nav',
    imports: [RouterLink, TranslatePipe],
    templateUrl: './home-nav.component.html',
    styleUrl: './home-nav.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeNavComponent {
    @Input() scrolled = false;

    scrollToSection(id: string): void {
        document
            .getElementById(id)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
