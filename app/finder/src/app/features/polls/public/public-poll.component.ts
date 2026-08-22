import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../common/services/user.service';
import { UserStore } from '../../../common/data/user.store';
import { TitleBarComponent } from '../../../common/ui/smart-components/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { PollService } from '../_shared/data/poll.service';
import { OptionType, PublicParticipant, PublicProjectInfo, PublicPollPreview } from '../_shared/models/poll-detail.model';
import { DateOptionFormatService } from '../_shared/utils/date-option-format.service';
import { DsButtonComponent } from '../../../common/ui/ds-components/button/ds-button.component';
import { DsPollCardSkeletonComponent } from '../../../common/ui/ds-components/poll-card-skeleton/ds-poll-card-skeleton.component';
import { DsIconComponent } from '../../../common/ui/ds-components/icon/ds-icon.component';
import { DsStatusDotComponent } from '../../../common/ui/ds-components/badge/ds-status-dot.component';
import { AvatarStackComponent } from '../../../common/ui/smart-components/avatar-stack/avatar-stack.component';
import { PollTypeBadgeComponent } from '../_shared/ui/poll-type-badge/poll-type-badge.component';
import { UserAvatarComponent } from '../../../common/ui/smart-components/user-avatar/user-avatar.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { User } from '../../../common/models/user.model';

interface OptionDisplay {
  id: string;
  text: string;
  description: string;
  voteCount: number;
  pct: string;
  isLead: boolean;
}

interface ParticipantDisplay extends PublicParticipant {
  user: { name: string };
}

@Component({
  selector: 'app-public-poll',
  standalone: true,
  imports: [
    TitleBarComponent,
    DsButtonComponent,
    DsPollCardSkeletonComponent,
    DsIconComponent,
    DsStatusDotComponent,
    AvatarStackComponent,
    PollTypeBadgeComponent,
    UserAvatarComponent,
    ReactiveFormsModule,
    TranslatePipe,
    DatePipe,
  ],
  templateUrl: 'public-poll.component.html',
  styleUrl: 'public-poll.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly userStore = inject(UserStore);
  private readonly titleBarService = inject(TitleBarService);
  private readonly translateService = inject(TranslateService);
  private readonly pollService = inject(PollService);
  private readonly dateFormatService = inject(DateOptionFormatService);

  protected readonly isLoading = signal(true);
  protected readonly isAuthenticated = signal(false);
  protected readonly currentUser = signal<User | undefined>(undefined);
  protected readonly projectInfo = signal<PublicProjectInfo | undefined>(undefined);
  protected readonly pollPreview = computed<PublicPollPreview | undefined>(() => this.projectInfo()?.pollPreview);
  protected readonly emailControl = new FormControl('', Validators.email);
  protected readonly OptionType = OptionType;

  protected readonly perks = ['publicPoll.perk1', 'publicPoll.perk2', 'publicPoll.perk3'];

  protected readonly optionDisplays = computed<OptionDisplay[]>(() => {
    const preview = this.pollPreview();
    if (!preview) return [];
    const isDate = preview.optionType === OptionType.Date;
    const maxVotes = Math.max(...preview.options.map((o) => o.voteCount), 1);
    return preview.options.map((o) => ({
      id: o.id,
      text: isDate ? this.dateFormatService.formatLabel(o.text) : o.text,
      description: isDate
        ? (this.dateFormatService.formatSubLabel(o.text) ?? o.description)
        : o.description,
      voteCount: o.voteCount,
      pct: Math.round((o.voteCount / maxVotes) * 100) + '%',
      isLead: o.voteCount > 0 && o.voteCount === maxVotes,
    }));
  });

  protected readonly participantSlots = computed(() => {
    const count = this.pollPreview()?.participantCount ?? 0;
    return Array.from({ length: Math.min(count, 5) });
  });

  protected readonly participantAvatarUsers = computed(() =>
    this.projectInfo()?.participants?.map(p => ({ name: p.name, voted: p.hasVoted })) ?? []
  );

  protected readonly currentUserHasVoted = computed(() => {
    const name = this.currentUser()?.name;
    if (!name) return false;
    return this.projectInfo()?.participants?.find(p => p.name === name)?.hasVoted ?? false;
  });

  protected readonly participantDisplays = computed<ParticipantDisplay[]>(() => {
    const info = this.projectInfo();
    if (!info) return [];
    return (info.participants ?? []).map((p) => ({ ...p, user: { name: p.name } }));
  });

  private projectId = '';

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.userStore.setRedirectUrl(`/u/${this.projectId}`);
    this.titleBarService.setTitle(this.translateService.instant('publicPoll.sharedLinkTitle'));

    this.pollService.getPublicProjectInfo(this.projectId).subscribe({
      next: (info) => this.projectInfo.set(info),
      error: (err) => {
        if (err?.status === 403) this.router.navigate(['/']);
      },
    });

    this.userService.getUser().subscribe({
      next: (user) => {
        this.isAuthenticated.set(user?.isAuthenticated ?? false);
        this.currentUser.set(user ?? undefined);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected login(): void {
    const email = this.emailControl.value?.trim() ?? '';
    if (email && this.emailControl.valid) {
      this.router.navigate(['/auth/request-email'], { queryParams: { email } });
    } else {
      this.router.navigate(['/auth/request-email']);
    }
  }

  protected navigateToPoll(): void {
    const info = this.projectInfo();
    if (info?.isStandalone && info.pollId) {
      this.router.navigate(['/polls', info.projectId, 'overview', info.pollId]);
    } else {
      this.router.navigate(['/polls']);
    }
  }

  protected copyShareLink(): void {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }
}
