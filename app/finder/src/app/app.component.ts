import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserStore } from './common/data/user.store';
import { TranslateService } from '@ngx-translate/core';
import { SUPPORTED_LANGUAGES } from './common/i18n/languages';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    const userStore = inject(UserStore);
    userStore.getUser();

    const translateService = inject(TranslateService);
    translateService.addLangs([...SUPPORTED_LANGUAGES]);
  }
}
