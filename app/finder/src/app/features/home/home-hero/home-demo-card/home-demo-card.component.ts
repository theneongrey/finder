import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { DsBadgeComponent } from '@ds/badge/ds-badge.component';
import { DsAvatarComponent } from '@ds/avatar/ds-avatar.component';
import { DEMO, DEMO_SEQ, DEMO_TOTAL_VOTERS, NAMES_TOP_100, PPL } from '../../home.constants';
import { HomeService } from '../../home.service';

@Component({
  selector: 'app-home-demo-card',
  imports: [TranslatePipe, DsStatusDotComponent, DsBadgeComponent, DsAvatarComponent],
  templateUrl: './home-demo-card.component.html',
  styleUrl: './home-demo-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeDemoCardComponent implements OnInit, OnDestroy {
  private homeService = inject(HomeService);

  readonly demoStep = signal(0);
  readonly floatName = signal('');
  readonly floatVisible = signal(true);

  private nameQueue: string[] = [];
  private nameIdx = 0;
  private nameToastTimer: ReturnType<typeof setTimeout> | undefined;
  private nameTimer: ReturnType<typeof setInterval> | undefined;
  private demoTimer: ReturnType<typeof setInterval> | undefined;

  readonly demoState = computed(() => {
    const seqI = Math.min(this.demoStep(), DEMO_SEQ.length - 1);
    const seq = DEMO_SEQ[seqI];
    const counts = DEMO.map((_, i) => (seq[i] || []).length);
    const total = counts.reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...counts, 1);
    const leadIdx = counts.indexOf(maxCount);

    const options = DEMO.map((d, i) => {
      const n = counts[i];
      const isLead = i === leadIdx && n > 0;
      return {
        labelKey: d.labelKey,
        n,
        numLabel: n === 0 ? '–' : String(n),
        numColor: isLead ? '#1f7a8c' : '#a39e96',
        weight: isLead ? '700' : '600',
        pct: Math.round((n / maxCount) * 100) + '%',
        fill: isLead ? 'rgba(31,122,140,.13)' : 'rgba(20,24,28,.045)',
        border: isLead ? '#bcdfe3' : 'rgba(20,24,28,.08)',
        chips: (seq[i] || []).map(vi => PPL[d.voters[vi]]),
      };
    });

    return {
      options,
      votedCount: total,
      votedTotal: DEMO_TOTAL_VOTERS,
      pct: Math.round((total / DEMO_TOTAL_VOTERS) * 100) + '%',
    };
  });

  ngOnInit(): void {
    this.nameQueue = this.homeService.shuffle(NAMES_TOP_100);
    this.floatName.set(this.nameQueue[0]);

    this.nameTimer = setInterval(() => {
      this.floatVisible.set(false);
      this.nameToastTimer = setTimeout(() => {
        this.nameIdx = (this.nameIdx + 1) % this.nameQueue.length;
        this.floatName.set(this.nameQueue[this.nameIdx]);
        this.floatVisible.set(true);
      }, 220);
    }, 2200);

    this.demoTimer = setInterval(() => {
      this.demoStep.update(s => (s + 1) % (DEMO_SEQ.length + 2));
    }, 1800);
  }

  ngOnDestroy(): void {
    clearInterval(this.nameTimer);
    clearInterval(this.demoTimer);
    clearTimeout(this.nameToastTimer);
  }
}
