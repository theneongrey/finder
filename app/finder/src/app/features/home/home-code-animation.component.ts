import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CODE, FEATURES } from './home.constants';

@Component({
  selector: 'app-home-code-animation',
  imports: [TranslatePipe],
  templateUrl: './home-code-animation.component.html',
  styleUrl: './home-code-animation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeCodeAnimationComponent implements OnInit, OnDestroy {
  readonly codeN = signal(0);
  readonly features = FEATURES;

  private codeTimer: ReturnType<typeof setInterval> | undefined;

  readonly codeBoxes = computed(() => {
    const n = this.codeN();
    return CODE.map((v, i) => ({
      v: i < n ? v : '',
      bg: i < n ? 'rgba(159,194,207,.16)' : 'rgba(255,255,255,.05)',
      border: i === n ? '#9fc2cf' : (i < n ? 'rgba(159,194,207,.5)' : 'rgba(255,255,255,.14)'),
    }));
  });

  readonly codeHintKey = computed(() =>
    this.codeN() >= 6 ? 'home.authPitch.codeHintDone' : 'home.authPitch.codeHintDefault',
  );

  ngOnInit(): void {
    this.codeTimer = setInterval(() => {
      this.codeN.update(n => (n >= 7 ? 0 : n + 1));
    }, 520);
  }

  ngOnDestroy(): void {
    clearInterval(this.codeTimer);
  }
}
