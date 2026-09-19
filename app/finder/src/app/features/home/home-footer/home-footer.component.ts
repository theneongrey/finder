import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-home-footer',
    imports: [TranslatePipe, RouterLink],
    templateUrl: './home-footer.component.html',
    styleUrl: './home-footer.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFooterComponent {}
