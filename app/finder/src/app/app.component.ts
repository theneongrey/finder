import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { UserStore } from './common/data/user.store';
import { TranslateService } from '@ngx-translate/core';
import { SUPPORTED_LANGUAGES } from './common/i18n/languages';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ...HlmToasterImports],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    const userStore = inject(UserStore);
    const translateService = inject(TranslateService);

    userStore.getUser();
    translateService.addLangs([...SUPPORTED_LANGUAGES]);
  }
}
