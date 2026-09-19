import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnInit,
    inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { TitleBarService } from '@common/services/title-bar.service';
import { SupportedLanguage, setStoredLanguage } from '@common/i18n/languages';
import { getContactEmail } from '../contact-email';

@Component({
    selector: 'app-imprint',
    imports: [TitleBarComponent, TranslatePipe],
    templateUrl: './imprint.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImprintComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private translate = inject(TranslateService);
    private titleBar = inject(TitleBarService);
    private destroyRef = inject(DestroyRef);

    /** Contact address assembled in JS (not a mailto link) to deter scrapers. */
    readonly contactEmail = getContactEmail();

    /** Section keys under `legal.imprint.sections.*`, rendered in order. */
    readonly sections = ['provider', 'contact', 'responsible', 'disclaimer'];

    ngOnInit(): void {
        const lang = this.route.snapshot.data['lang'] as
            | SupportedLanguage
            | undefined;
        if (lang) {
            this.translate.use(lang);
            setStoredLanguage(lang);
        }

        this.translate
            .get('legal.imprint.title')
            .subscribe((title: string) => this.titleBar.setTitle(title));

        this.destroyRef.onDestroy(() => this.titleBar.clearTitle());
    }
}
