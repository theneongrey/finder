import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PollDetailStore } from '../../data/poll-detail.store';
import { PollListStore } from '../../data/poll-list.store';
import { SharingStore } from '../../data/sharing.store';
import { OptionType } from '../../models/poll-detail.model';
import { PollRole } from '../../models/poll-role.enum';
import {
  OptionEntry,
  DateOptionEntry,
  DateOptionType,
} from './poll-input-form/poll-input-form.component';
import {
  parseDateOptionText,
  serializeDateOption,
  isDateOptionEntryValid,
  nextFullHour,
} from '../../utils/date-option.utils';
import { UrlValidationService } from '../../../../../common/utils/url-validation.service';
import { TitleBarService } from '../../../../../common/services/title-bar.service';
import { AppointmentTypeConversionService } from '../../utils/appointment-type-conversion.service';
import { PollTypeSelectionComponent } from './poll-type-selection/poll-type-selection.component';
import { PollInputFormComponent } from './poll-input-form/poll-input-form.component';
import { ShareContentComponent } from '../share-content/share-content.component';
import { PendingInvite } from '../share-content/share-invite-form/share-invite-form.component';
import { PollItemComponent } from '../poll-item/poll-item.component';
import { PollTypeBadgeComponent } from '../poll-type-badge/poll-type-badge.component';
import { PollItem } from '../../models/poll-item.model';
import { DsButtonComponent } from '@ds/button/ds-button.component';

export type { OptionEntry, DateOptionEntry, DateOptionType };
export type { PendingInvite };

@Component({
  selector: 'app-poll-input',
  templateUrl: './poll-input.component.html',
  host: { class: 'block h-full' },
  imports: [
    PollTypeSelectionComponent,
    PollInputFormComponent,
    ShareContentComponent,
    PollItemComponent,
    PollTypeBadgeComponent,
    DsButtonComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputComponent {
  private readonly projectDetailStore = inject(PollDetailStore);
  private readonly projectListStore = inject(PollListStore);
  private readonly sharingStore = inject(SharingStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly urlValidation = inject(UrlValidationService);
  private readonly conversionService = inject(AppointmentTypeConversionService);
  private readonly translateService = inject(TranslateService);
  private readonly titleService = inject(TitleBarService);

  readonly OptionType = OptionType;

  mode = input<'add' | 'edit' | 'standalone'>('add');
  projectId = this.projectDetailStore.projectId;
  pollId = input<string | undefined>(undefined);

  readonly wizardStep = signal(1);

  readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 680px)')
      .pipe(map(({ matches }) => matches)),
    { initialValue: false },
  );

  readonly createdProject = computed(() => this.projectListStore.lastCreatedProject());
  readonly pollPreview = computed((): PollItem | undefined => {
    const p = this.createdProject();
    if (!p) { return undefined; }
    return {
      pollId: p.pollId,
      projectId: p.projectId,
      name: p.name,
      description: p.description,
      optionType: p.optionType as OptionType,
      optionCount: p.optionCount,
      commentCount: p.commentCount,
      lastVoteAt: p.lastVoteAt,
      nextOpenOptionId: p.nextOpenOptionId,
      role: p.role,
      totalParticipants: p.totalParticipants,
      votedCount: p.votedCount,
      currentUserVoted: p.currentUserVoted,
      participants: p.participants,
      isFavorite: p.isFavorite,
      closeDate: p.closeDate,
      isClosed: p.isClosed,
    };
  });
  readonly currentProject = this.projectDetailStore.currentProject;
  readonly sharingContacts = this.sharingStore.sharingContactsSuggestion;
  readonly sharingInProgress = this.sharingStore.sharingInProgress;

  optionType = signal<OptionType | undefined>(
    this.route.snapshot.data['optionType'],
  );

  // Pending invites collected before poll creation (standalone add only)
  readonly pendingInvites = signal<PendingInvite[]>([]);

  private sharesApplied = false;

  canClosePoll = computed(() => {
    const poll = this.projectDetailStore.currentPoll();
    const project = this.projectDetailStore.currentProject();
    return this.mode() === 'edit'
      && poll !== undefined
      && !poll.isClosed
      && project !== undefined
      && project.role >= PollRole.Maintainer;
  });

  canReopenPoll = computed(() => {
    const poll = this.projectDetailStore.currentPoll();
    const project = this.projectDetailStore.currentProject();
    return this.mode() === 'edit'
      && poll !== undefined
      && !!poll.isClosed
      && project !== undefined
      && project.role >= PollRole.Maintainer;
  });

  pollClosedAt = computed(() => this.projectDetailStore.currentPoll()?.closeDate);

  question = signal('');
  description = signal('');
  closeDate = signal<string | undefined>(undefined);
  options = signal<OptionEntry[]>([{ text: '', description: '' }]);
  dateOptions = signal<DateOptionEntry[]>([]);
  appointmentDateType = signal<DateOptionType | undefined>(undefined);
  removedOptionIds = signal<string[]>([]);
  private readonly pollCreating = signal(false);

  // Translated labels (reactive signals)
  private readonly nextLabel = this.translateService.translate('project.pollInput.next');
  private readonly doneLabel = this.translateService.translate('project.pollInput.done');
  private readonly createPollLabel = this.translateService.translate('project.pollInput.createPoll');
  private readonly updatePollLabel = this.translateService.translate('project.pollInput.updatePoll');
  private readonly editPollTitleLabel = this.translateService.translate('project.pollInput.editPollTitle');
  private readonly discardLabel = this.translateService.translate('project.pollInput.discard');
  private readonly step1Label = this.translateService.translate('project.pollInput.stepArt');
  private readonly step2LabelDate = this.translateService.translate('project.pollInput.stepOptionsDate');
  private readonly step2LabelRating = this.translateService.translate('project.pollInput.stepOptionsRating');
  private readonly step2LabelGeneric = this.translateService.translate('project.pollInput.stepOptions');
  private readonly step3Label = this.translateService.translate('project.pollInput.stepShare');
  private readonly pollTypeLabelYesNo = this.translateService.translate('project.detail.pollTypes.yesNo');
  private readonly pollTypeLabelDate = this.translateService.translate('project.detail.pollTypes.appointment');
  private readonly pollTypeLabelRating = this.translateService.translate('project.detail.pollTypes.rating');
  private readonly typeTitle = this.translateService.translate('project.pollInput.typeTitle');
  private readonly shareTitle = this.translateService.translate('project.pollInput.shareTitle');
  private readonly webStep1Sub = this.translateService.translate('project.pollInput.webStep1Title');
  private readonly webStep2SubGeneric = this.translateService.translate('project.pollInput.webStep2TitleGeneric');
  private readonly webStep2SubDate = this.translateService.translate('project.pollInput.webStep2TitleDate');
  private readonly webStep3Sub = this.translateService.translate('project.pollInput.webStep3Title');

  readonly optionTypeLabel = computed(() => {
    const type = this.optionType();
    if (type === OptionType.YesNo) { return this.pollTypeLabelYesNo(); }
    if (type === OptionType.Date) { return this.pollTypeLabelDate(); }
    if (type === OptionType.Rating) { return this.pollTypeLabelRating(); }
    return '';
  });

  readonly step2Label = computed(() => {
    const type = this.optionType();
    if (type === OptionType.Date) { return this.step2LabelDate(); }
    if (type === OptionType.Rating) { return this.step2LabelRating(); }
    return this.step2LabelGeneric();
  });

  readonly ctaLabel = computed((): string => {
    const mode = this.mode();
    if (mode === 'edit') { return this.updatePollLabel(); }
    if (mode === 'add') { return this.createPollLabel(); }

    // standalone
    const step = this.wizardStep();
    if (step === 1) { return this.nextLabel(); }
    if (step === 2) { return this.createPollLabel(); }
    return this.doneLabel(); // step 3: finish
  });

  readonly discardText = computed(() => this.discardLabel());

  readonly pollIsClosed = computed(() => {
    const poll = this.projectDetailStore.currentPoll();
    return this.mode() === 'edit' && !!poll?.isClosed;
  });

  get canProceed(): boolean {
    const mode = this.mode();
    if (mode === 'edit') { return !this.pollIsClosed() && this.isValid(); }
    if (mode !== 'standalone') { return this.isValid(); }
    const step = this.wizardStep();
    if (step === 1) { return this.optionType() !== undefined; }
    if (step === 2) { return this.isValid() && !this.pollCreating(); }
    if (step === 3) { return true; }
    return true;
  }

  readonly webSteps = computed(() => {
    const step = this.wizardStep();
    return [
      {
        num: '1',
        title: this.step1Label(),
        sub: this.optionTypeLabel(),
        isDone: step > 1,
        isCurrent: step === 1,
      },
      {
        num: '2',
        title: this.step2Label(),
        sub: '',
        isDone: step > 2,
        isCurrent: step === 2,
      },
      {
        num: '3',
        title: this.step3Label(),
        sub: '',
        isDone: false,
        isCurrent: step === 3,
      },
    ];
  });

  readonly webContentTitle = computed((): string => {
    if (this.mode() === 'edit') { return this.editPollTitleLabel(); }
    const step = this.wizardStep();
    if (step === 1) { return this.typeTitle(); }
    if (step === 2) { return this.step2Label(); }
    return this.shareTitle();
  });

  readonly webContentSubtitle = computed((): string => {
    if (this.mode() === 'edit') { return this.projectDetailStore.currentPoll()?.name ?? ''; }
    const step = this.wizardStep();
    if (step === 1) { return this.webStep1Sub(); }
    if (step === 2) {
      return this.optionType() === OptionType.Date
        ? this.webStep2SubDate()
        : this.webStep2SubGeneric();
    }
    return this.webStep3Sub();
  });

  constructor() {
    // Reset standalone state on init
    effect(() => {
      if (this.mode() === 'standalone') {
        this.projectListStore.clearCreatedProject();
        this.sharesApplied = false;
        this.pendingInvites.set([]);
      }
    });

    // Edit mode: skip type-selection step, start at step 2
    effect(() => {
      if (this.mode() === 'edit') {
        this.wizardStep.set(2);
      }
    }, { allowSignalWrites: true });

    // Preselect Yes/No in standalone mode (set directly to avoid triggering auto-advance)
    effect(() => {
      if (this.mode() === 'standalone' && this.optionType() === undefined) {
        this.optionType.set(OptionType.YesNo);
        this.options.set([{ text: '', description: '' }]);
      }
    }, { allowSignalWrites: true });

    // After standalone poll creation: advance to step 3
    effect(() => {
      const created = this.createdProject();
      if (!created || this.mode() !== 'standalone' || this.sharesApplied) { return; }
      this.sharesApplied = true;
      this.pollCreating.set(false);
      for (const invite of this.pendingInvites()) {
        this.sharingStore.share({
          email: invite.email,
          permissionType: invite.role,
          projectId: created.projectId,
        });
      }
      this.wizardStep.set(3);
    }, { allowSignalWrites: true });

    // Load sharing contacts
    effect(() => {
      const mode = this.mode();
      if (mode === 'edit' || mode === 'standalone') {
        this.sharingStore.loadGeneralContacts();
      }
    });

    // Update title bar for standalone and edit
    effect(() => {
      const mode = this.mode();
      if (mode !== 'standalone' && mode !== 'edit') { return; }
      const step = this.wizardStep();
      const desktop = this.isDesktop();

      if (desktop) {
        this.titleService.setProgress(undefined);
        if (mode === 'standalone') {
          this.titleService.setTitle(this.translateService.instant('project.standaloneInput.addNew.cto'));
          this.titleService.setSubtitle(this.translateService.instant('project.pollInput.pollsOverviewLabel'));
        } else if (mode === 'edit') {
          this.titleService.setTitle(this.translateService.instant('project.pollInput.editPollTitle'));
          this.titleService.setSubtitle(this.translateService.instant('project.pollInput.pollsOverviewLabel'));
        }
        return;
      }

      if (mode === 'edit') {
        this.titleService.setTitle(this.translateService.instant('project.pollInput.editPollTitle'));
        this.titleService.setSubtitle(this.translateService.instant('project.pollInput.pollsOverviewLabel'));
        this.titleService.setProgress(undefined);
        this.titleService.setBackFn(undefined);
        return;
      }

      const step2Name = this.step2Label();
      const stepNames = [this.step1Label(), step2Name, this.step3Label()];
      const titles = [
        this.translateService.instant('project.standaloneInput.addNew.cto'),
        step2Name,
        this.step3Label(),
      ];

      this.titleService.setTitle(titles[step - 1]);
      this.titleService.setSubtitle(
        this.translateService.instant('project.pollInput.mobileStepSubtitle', { step, total: 3, name: stepNames[step - 1] }),
      );
      this.titleService.setProgress(Math.round((step / 3) * 100));
      this.titleService.setBackFn(
        mode === 'standalone' && step === 2 ? () => this.prevStep() : undefined,
      );
    });

    // 'add' mode title (within a project)
    effect(() => {
      if (this.mode() === 'add') {
        this.titleService.setTitle(this.projectDetailStore.currentProject()?.name ?? '');
      }
    });

    effect(() => {
      const pollId = this.pollId();
      if (this.mode() === 'edit' && pollId) {
        this.projectDetailStore.getPoll(pollId);
      }
    });

    effect(() => {
      const currentPoll = this.projectDetailStore.currentPoll();
      if (
        this.mode() === 'edit' &&
        currentPoll &&
        currentPoll.id === this.pollId()
      ) {
        this.question.set(currentPoll.name);
        this.description.set(currentPoll.description);
        this.closeDate.set(currentPoll.closeDate);

        if (currentPoll.optionType === OptionType.Date) {
          const entries = currentPoll.options.length
            ? currentPoll.options.map((o) => parseDateOptionText(o.text, o.id))
            : [];

          if (entries.length > 0) {
            this.appointmentDateType.set(entries[0].type);
            this.dateOptions.set(entries);
          }
        } else {
          this.options.set(
            currentPoll.options.length
              ? currentPoll.options.map((o) => ({
                  id: o.id,
                  text: o.text,
                  description: o.description,
                  meta: o.meta
                    ? {
                        url: o.meta.url,
                        title: o.meta.title,
                        description: o.meta.description,
                        imageUrl: o.meta.imageUrl,
                        siteName: o.meta.siteName,
                      }
                    : undefined,
                }))
              : [{ text: '', description: '' }],
          );
        }
      }
    });
  }

  onTypeSelected(type: OptionType): void {
    this.optionType.set(type);
    if (type === OptionType.YesNo) {
      this.options.set([{ text: '', description: '' }]);
    }
    if (type === OptionType.Date) {
      this.onAppointmentDateTypeChange('date');
    }
    if (this.mode() === 'standalone' && this.wizardStep() === 1) {
      this.wizardStep.set(2);
    }
  }

  isValid(): boolean {
    const type = this.optionType();
    if (type === undefined) {
      return false;
    }
    if (type === OptionType.Date) {
      const dateType = this.appointmentDateType();
      if (!dateType) { return false; }
      return (
        !!this.question() &&
        this.dateOptions().some((o) => isDateOptionEntryValid(o))
      );
    }
    const opts = this.options();
    return (
      !!this.question() &&
      opts.filter((o) => !!o.text).length >= 1 &&
      opts.every((o) => !o.meta?.url || this.urlValidation.isValid(o.meta.url))
    );
  }

  onCta(): void {
    const mode = this.mode();

    if (mode === 'edit') {
      this.editPoll();
      return;
    }

    if (mode === 'add') {
      this.addPoll();
      return;
    }

    // standalone
    const step = this.wizardStep();

    if (step === 1) {
      this.wizardStep.set(2);
      return;
    }

    if (step === 2) {
      this.pollCreating.set(true);
      this.addStandalonePoll();
      return;
    }

    // step 3: finish
    this.finishAndNavigate();
  }

  prevStep(): void {
    if (this.wizardStep() > 1) {
      this.wizardStep.update(s => s - 1);
    }
  }

  discard(): void {
    if (this.mode() === 'edit') {
      const projectId = this.projectId();
      const pollId = this.pollId();
      if (projectId && pollId) {
        this.router.navigate(['/polls', projectId, 'overview', pollId]);
      } else {
        this.router.navigate(['/polls']);
      }
      return;
    }
    this.projectListStore.clearCreatedProject();
    this.router.navigate(['/polls']);
  }

  onAppointmentDateTypeChange(newType: DateOptionType): void {
    const oldType = this.appointmentDateType();
    if (oldType === newType) {
      return;
    }
    if (oldType) {
      const converted = this.conversionService.convert(this.dateOptions(), oldType, newType);
      const fallback = newType === 'weekday' ? [] : [{ type: newType }];
      this.dateOptions.set(converted.length > 0 ? converted : fallback);
    } else {
      this.dateOptions.set(newType === 'weekday' ? [] : [{ type: newType }]);
    }
    this.appointmentDateType.set(newType);
  }

  toggleWeekday(weekday: number): void {
    const opts = this.dateOptions();
    const existingIndex = opts.findIndex((o) => o.weekday === weekday);
    if (existingIndex !== -1) {
      const removed = opts[existingIndex];
      if (removed.id) {
        this.removedOptionIds.update((ids) => [...ids, removed.id!]);
      }
      this.dateOptions.update((opts) => opts.filter((_, i) => i !== existingIndex));
    } else {
      this.dateOptions.update((opts) => [...opts, { type: 'weekday', weekday }]);
    }
  }

  addOption(): void {
    const type = this.optionType();
    if (type === OptionType.Date) {
      const dateType = this.appointmentDateType();
      if (!dateType) { return; }
      if (dateType === 'time') {
        this.dateOptions.update((opts) => [...opts, { type: 'time', startTime: nextFullHour() }]);
      } else if (dateType === 'time-range') {
        const start = nextFullHour();
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        this.dateOptions.update((opts) => [...opts, { type: 'time-range', startTime: start, endTime: end }]);
      } else {
        this.dateOptions.update((opts) => [...opts, { type: dateType }]);
      }
    } else {
      this.options.update((opts) => [...opts, { text: '', description: '' }]);
    }
  }

  removeOption(index: number): void {
    const type = this.optionType();
    if (type === OptionType.Date) {
      const removed = this.dateOptions()[index];
      if (removed?.id) {
        this.removedOptionIds.update((ids) => [...ids, removed.id!]);
      }
      this.dateOptions.update((opts) => opts.filter((_, i) => i !== index));
    } else {
      const removedOption = this.options()[index];
      if (removedOption?.id) {
        this.removedOptionIds.update((ids) => [...ids, removedOption.id!]);
      }
      this.options.update((opts) => opts.filter((_, i) => i !== index));
    }
  }

  closePollNow(): void {
    const pollId = this.pollId();
    if (pollId) {
      this.projectDetailStore.closePoll(pollId);
    }
  }

  reopenPollNow(): void {
    const pollId = this.pollId();
    if (pollId) {
      this.projectDetailStore.reopenPoll(pollId);
    }
  }

  // Sharing management
  addPendingInvite(invite: PendingInvite): void {
    this.pendingInvites.update(list => [...list, invite]);
  }

  removePendingInvite(email: string): void {
    this.pendingInvites.update(list => list.filter(i => i.email !== email));
  }

  private finishAndNavigate(): void {
    this.projectListStore.clearCreatedProject();
    this.router.navigate(['/polls']);
  }

  private addPoll(): void {
    const projectId = this.projectId();
    const optionType = this.optionType();
    if (!projectId || optionType === undefined || !this.isValid()) {
      return;
    }

    if (optionType === OptionType.Date) {
      const options = this.dateOptions()
        .filter((o) => isDateOptionEntryValid(o))
        .map((o) => ({
          text: serializeDateOption(o),
          description: '',
        }));

      this.projectDetailStore.addPoll({
        projectId,
        name: this.question(),
        description: this.description(),
        optionType: OptionType.Date,
        options,
      });
    } else {
      const options = this.options()
        .filter((o) => !!o.text)
        .map((o) => ({
          text: o.text,
          description: o.description,
          meta: o.meta,
        }));

      this.projectDetailStore.addPoll({
        projectId,
        name: this.question(),
        description: this.description(),
        optionType,
        options,
      });
    }
  }

  private addStandalonePoll(): void {
    const optionType = this.optionType();
    if (optionType === undefined || !this.isValid()) {
      return;
    }

    if (optionType === OptionType.Date) {
      const options = this.dateOptions()
        .filter((o) => isDateOptionEntryValid(o))
        .map((o) => ({
          text: serializeDateOption(o),
          description: '',
        }));

      this.projectListStore.addStandalonePoll({
        name: this.question(),
        description: this.description(),
        optionType: OptionType.Date,
        closeDate: this.closeDate(),
        options,
      });
    } else {
      const options = this.options()
        .filter((o) => !!o.text)
        .map((o) => ({
          text: o.text,
          description: o.description,
          meta: o.meta,
        }));

      this.projectListStore.addStandalonePoll({
        name: this.question(),
        description: this.description(),
        optionType,
        closeDate: this.closeDate(),
        options,
      });
    }
  }

  private editPoll(): void {
    const projectId = this.projectId();
    const pollId = this.pollId();
    const optionType = this.optionType();
    if (!projectId || !pollId || optionType === undefined || !this.isValid()) {
      return;
    }

    if (optionType === OptionType.Date) {
      const options = this.dateOptions()
        .filter((o) => isDateOptionEntryValid(o))
        .map((o) => ({
          id: o.id,
          text: serializeDateOption(o),
          description: '',
        }));

      this.projectDetailStore.editPoll({
        projectId,
        pollId,
        name: this.question(),
        description: this.description(),
        closeDate: this.closeDate(),
        options,
        removedOptionIds: this.removedOptionIds(),
      });
    } else {
      const options = this.options()
        .filter((o) => !!o.text)
        .map((o) => ({
          id: o.id,
          text: o.text,
          description: o.description,
          meta: o.meta,
        }));

      this.projectDetailStore.editPoll({
        projectId,
        pollId,
        name: this.question(),
        description: this.description(),
        closeDate: this.closeDate(),
        options,
        removedOptionIds: this.removedOptionIds(),
      });
    }
  }
}
