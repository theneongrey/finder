import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SupportedLanguage, setStoredLanguage } from '../../common/i18n/languages';
import { HomeNavComponent } from './home-nav.component';
import { HomeHeroComponent } from './home-hero.component';
import { HomeStepsComponent } from './home-steps.component';
import { HomeIdeasSectionComponent } from './home-ideas-section.component';
import { HomeCodeAnimationComponent } from './home-code-animation.component';
import { HomeFinalCtaComponent } from './home-final-cta.component';
import { HomeFooterComponent } from './home-footer.component';

@Component({
  selector: 'app-home',
  imports: [
    HomeNavComponent,
    HomeHeroComponent,
    HomeStepsComponent,
    HomeIdeasSectionComponent,
    HomeCodeAnimationComponent,
    HomeFinalCtaComponent,
    HomeFooterComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  readonly scrolled = signal(false);

  ngOnInit(): void {
    const lang = this.route.snapshot.data['lang'] as SupportedLanguage;
    if (lang) {
      this.translate.use(lang);
      setStoredLanguage(lang);
    }
  }

  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    this.scrolled.set(el.scrollTop > 20);
  }
}
