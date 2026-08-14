import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsBadgeComponent } from '../../common/ui/ds-components/badge/ds-badge.component';
import { DsAvatarStackComponent } from '../../common/ui/ds-components/avatar-stack/ds-avatar-stack.component';
import { IDEAS, PPL } from './home.constants';

@Component({
  selector: 'app-home-ideas-section',
  imports: [TranslatePipe, DsBadgeComponent, DsAvatarStackComponent],
  templateUrl: './home-ideas-section.component.html',
  styleUrl: './home-ideas-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeIdeasSectionComponent implements OnInit, OnDestroy {
  readonly ideaIdx = signal(1);
  readonly ideaVisible = signal(true);
  readonly ideas = IDEAS;

  private ideaTimer: ReturnType<typeof setInterval> | undefined;
  private selectIdeaTimer: ReturnType<typeof setTimeout> | undefined;

  readonly currentIdea = computed(() => {
    const idea = IDEAS[this.ideaIdx()];
    const maxN = Math.max(...idea.options.map(o => o.n)) || 1;
    return {
      ...idea,
      optionsFormatted: idea.options.map(o => ({
        ...o,
        pct: Math.round((o.n / maxN) * 100) + '%',
        fill: o.n === maxN ? 'rgba(31,122,140,.13)' : 'rgba(20,24,28,.045)',
        border: o.n === maxN ? '#bcdfe3' : 'rgba(20,24,28,.07)',
        numColor: o.n === maxN ? '#1f7a8c' : '#a39e96',
        weight: o.n === maxN ? '700' : '600',
        numLabel: o.n === 0 ? '–' : String(o.n),
      })),
      votersFormatted: idea.voters.map(k => ({ initial: PPL[k].i, bg: PPL[k].bg, fg: PPL[k].fg })),
    };
  });

  ngOnInit(): void {
    this.startIdeaTimer(7000);
  }

  ngOnDestroy(): void {
    clearInterval(this.ideaTimer);
    clearTimeout(this.selectIdeaTimer);
  }

  private startIdeaTimer(delay: number): void {
    clearInterval(this.ideaTimer);
    this.ideaTimer = setInterval(() => {
      this.ideaVisible.set(false);
      setTimeout(() => {
        this.ideaIdx.update(i => (i + 1) % IDEAS.length);
        this.ideaVisible.set(true);
      }, 300);
    }, delay);
  }

  selectIdea(i: number): void {
    this.ideaVisible.set(false);
    clearTimeout(this.selectIdeaTimer);
    this.selectIdeaTimer = setTimeout(() => {
      this.ideaIdx.set(i);
      this.ideaVisible.set(true);
      this.startIdeaTimer(60_000);
    }, 300);
  }

  scrollToEmail(): void {
    const el = document.getElementById('home-email');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.focus(), 420);
    }
  }
}
