import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { LoggerService } from '@common/services/logger.service';
import { UserService } from '@common/services/user.service';
import { UserStore } from '@common/data/user.store';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { TitleBarService } from '@common/services/title-bar.service';
import { PollService } from '../polls/_shared/data/poll.service';
import { PublicProjectInfo } from '../polls/_shared/models/poll-detail.model';
import { DateOptionFormatService } from '../polls/_shared/utils/date-option-format.service';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsPollCardSkeletonComponent } from '@ds/poll-card-skeleton/ds-poll-card-skeleton.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { User } from '@common/models/user.model';
import { PublicPollCardComponent } from './public-poll-card/public-poll-card.component';
import { PublicPollInviteBannerComponent } from './public-poll-invite-banner/public-poll-invite-banner.component';
import { PublicPollNudgeBarComponent } from './public-poll-nudge-bar/public-poll-nudge-bar.component';
import { PublicPollMemberSidebarComponent } from './public-poll-member-sidebar/public-poll-member-sidebar.component';
import { PublicPollGuestSidebarComponent } from './public-poll-guest-sidebar/public-poll-guest-sidebar.component';
import { OptionDisplay, ParticipantDisplay } from './public-poll.models';
import { OptionType } from '@common/models/option-type.model';

@Component({
  selector: 'app-public-poll',
  standalone: true,
  imports: [
    TitleBarComponent,
    DsIconComponent,
    DsPollCardSkeletonComponent,
    PublicPollCardComponent,
    PublicPollInviteBannerComponent,
    PublicPollNudgeBarComponent,
    PublicPollMemberSidebarComponent,
    PublicPollGuestSidebarComponent,
    TranslatePipe,
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
  private readonly logger = inject(LoggerService);
  private readonly pollService = inject(PollService);
  private readonly dateFormatService = inject(DateOptionFormatService);

  protected readonly isLoading = signal(true);
  protected readonly isAuthenticated = signal(false);
  protected readonly currentUser = signal<User | undefined>(undefined);
  protected readonly projectInfo = signal<PublicProjectInfo | undefined>(
    undefined,
  );
  protected readonly pollPreview = computed(
    () => this.projectInfo()?.pollPreview,
  );
  protected readonly emailControl = new FormControl('', Validators.email);
  protected readonly OptionType = OptionType;

  protected readonly perks = [
    'publicPoll.perk1',
    'publicPoll.perk2',
    'publicPoll.perk3',
  ];

  protected readonly optionDisplays = computed<OptionDisplay[]>(() => {
    const preview = this.pollPreview();
    if (!preview) {
      return [];
    }
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

  protected readonly participantAvatarUsers = computed(
    () =>
      this.projectInfo()?.participants?.map((p) => ({
        name: p.name,
        voted: p.hasVoted,
      })) ?? [],
  );

  protected readonly currentUserHasVoted = computed(() => {
    const name = this.currentUser()?.name;
    if (!name) {
      return false;
    }
    return (
      this.projectInfo()?.participants?.find((p) => p.name === name)
        ?.hasVoted ?? false
    );
  });

  protected readonly participantDisplays = computed<ParticipantDisplay[]>(
    () => {
      const info = this.projectInfo();
      if (!info) {
        return [];
      }
      return (info.participants ?? []).map((p) => ({
        name: p.name,
        hasVoted: p.hasVoted,
        user: { name: p.name },
      }));
    },
  );

  private projectId = '';

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.userStore.setRedirectUrl(this.router.url);
    this.titleBarService.setSubtitle(
      this.translateService.instant('project.pollInput.pollsOverviewLabel'),
    );
    this.titleBarService.setBackRoute('/polls');
    this.titleBarService.clearTitle();

    this.pollService.getPublicProjectInfo(this.projectId).subscribe({
      next: (info) => {
        this.projectInfo.set(info);
        this.titleBarService.setTitle(
          info.pollPreview?.name ?? info.projectName,
        );
        if (this.isAuthenticated()) {
          this.navigateToPoll();
        }
      },
      error: (err) => {
        this.logger.error('Failed to load public project info', err);
        this.isLoading.set(false);
      },
    });

    this.userService.getUser().subscribe({
      next: (user) => {
        const authenticated = user?.isAuthenticated ?? false;
        this.isAuthenticated.set(authenticated);
        this.currentUser.set(user ?? undefined);
        this.isLoading.set(false);
        if (authenticated && this.projectInfo()) {
          this.navigateToPoll();
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected loginFromCard(): void {
    this.userStore.setRedirectUrl(this.router.url);
    this.router.navigate(['/auth/request-email']);
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
      this.router.navigate(['/polls', info.projectId, 'vote', info.pollId]);
    } else {
      this.router.navigate(['/polls']);
    }
  }

  protected copyShareLink(): void {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() =>
        toast.success(
          this.translateService.instant('project.share.linkCopied'),
        ),
      )
      .catch(() => {
        /* clipboard write failed silently */
      });
  }
}
