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
import { SharingStore } from '../_shared/data/sharing.store';
import { PollService } from '../_shared/data/poll.service';
import { OptionType, PublicPollPreview } from '../_shared/models/poll-detail.model';
import { DsButtonComponent } from '../../../common/ui/ds-components/button/ds-button.component';
import { DsPollCardSkeletonComponent } from '../../../common/ui/ds-components/poll-card-skeleton/ds-poll-card-skeleton.component';
import { DsIconComponent } from '../../../common/ui/ds-components/icon/ds-icon.component';
import { PollTypeBadgeComponent } from '../_shared/ui/poll-type-badge/poll-type-badge.component';
import { TranslatePipe } from '@ngx-translate/core';

interface OptionDisplay {
  id: string;
  text: string;
  description: string;
  voteCount: number;
  pct: string;
  isLead: boolean;
}

@Component({
  selector: 'app-public-poll',
  standalone: true,
  imports: [
    DsButtonComponent,
    DsPollCardSkeletonComponent,
    DsIconComponent,
    PollTypeBadgeComponent,
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
  private readonly sharingStore = inject(SharingStore);
  private readonly pollService = inject(PollService);

  protected readonly isLoading = signal(true);
  protected readonly pollPreview = signal<PublicPollPreview | undefined>(undefined);
  protected readonly emailControl = new FormControl('', Validators.email);
  protected readonly OptionType = OptionType;

  protected readonly perks = ['publicPoll.perk1', 'publicPoll.perk2', 'publicPoll.perk3'];

  protected readonly optionDisplays = computed<OptionDisplay[]>(() => {
    const preview = this.pollPreview();
    if (!preview) return [];
    const maxVotes = Math.max(...preview.options.map((o) => o.voteCount), 1);
    return preview.options.map((o) => ({
      id: o.id,
      text: o.text,
      description: o.description,
      voteCount: o.voteCount,
      pct: Math.round((o.voteCount / maxVotes) * 100) + '%',
      isLead: o.voteCount > 0 && o.voteCount === maxVotes,
    }));
  });

  protected readonly participantSlots = computed(() => {
    const count = this.pollPreview()?.participantCount ?? 0;
    return Array.from({ length: Math.min(count, 5) });
  });

  private projectId = '';

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.userStore.setRedirectUrl(`/p/${this.projectId}`);

    this.pollService.getPublicProjectInfo(this.projectId).subscribe({
      next: (info) => {
        if (info.pollPreview) this.pollPreview.set(info.pollPreview);
      },
      error: () => {},
    });

    this.userService.getUser().subscribe({
      next: (user) => {
        if (user?.isAuthenticated) {
          this.sharingStore.navigateToSharedProject(this.projectId);
        } else {
          this.isLoading.set(false);
        }
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
}
