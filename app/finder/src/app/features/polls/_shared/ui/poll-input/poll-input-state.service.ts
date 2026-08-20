import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { AppointmentTypeConversionService } from '../../utils/appointment-type-conversion.service';
import { PendingInvite } from '../share-content/share-invite-form/share-invite-form.component';
import { PollItem } from '../../models/poll-item.model';

@Injectable()
export class PollInputStateService {
  private readonly projectDetailStore = inject(PollDetailStore);
  readonly projectListStore = inject(PollListStore);
  private readonly sharingStore = inject(SharingStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly urlValidation = inject(UrlValidationService);
  private readonly conversionService = inject(AppointmentTypeConversionService);

  readonly OptionType = OptionType;

  readonly projectId = this.projectDetailStore.projectId;
  readonly currentProject = this.projectDetailStore.currentProject;
  readonly sharingContacts = this.sharingStore.sharingContactsSuggestion;
  readonly sharingInProgress = this.sharingStore.sharingInProgress;

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

  optionType = signal<OptionType | undefined>(
    this.route.snapshot.data['optionType'],
  );

  readonly pendingInvites = signal<PendingInvite[]>([]);

  private sharesApplied = false;

  readonly canClosePoll = computed(() => {
    const poll = this.projectDetailStore.currentPoll();
    const project = this.projectDetailStore.currentProject();
    return (
      poll !== undefined &&
      !poll.isClosed &&
      project !== undefined &&
      project.role >= PollRole.Maintainer
    );
  });

  readonly canReopenPoll = computed(() => {
    const poll = this.projectDetailStore.currentPoll();
    const project = this.projectDetailStore.currentProject();
    return (
      poll !== undefined &&
      !!poll.isClosed &&
      project !== undefined &&
      project.role >= PollRole.Maintainer
    );
  });

  readonly pollClosedAt = computed(() => this.projectDetailStore.currentPoll()?.closeDate);

  readonly question = signal('');
  readonly description = signal('');
  readonly closeDate = signal<string | undefined>(undefined);
  readonly options = signal<OptionEntry[]>([{ text: '', description: '' }]);
  readonly dateOptions = signal<DateOptionEntry[]>([]);
  readonly appointmentDateType = signal<DateOptionType | undefined>(undefined);
  readonly removedOptionIds = signal<string[]>([]);
  private readonly pollCreating = signal(false);

  readonly pollIsClosed = computed(() => {
    const poll = this.projectDetailStore.currentPoll();
    return !!poll?.isClosed;
  });

  readonly isValid = computed((): boolean => {
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
  });

  readonly isPollCreating = computed(() => this.pollCreating());

  initEditMode(pollId: string): void {
    this.projectDetailStore.getPoll(pollId);
  }

  loadEditData(pollId: string): void {
    const currentPoll = this.projectDetailStore.currentPoll();
    if (!currentPoll || currentPoll.id !== pollId) { return; }

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

  initStandaloneMode(): void {
    this.projectListStore.clearCreatedProject();
    this.sharesApplied = false;
    this.pendingInvites.set([]);
  }

  preselectYesNo(): void {
    if (this.optionType() === undefined) {
      this.optionType.set(OptionType.YesNo);
      this.options.set([{ text: '', description: '' }]);
    }
  }

  tryApplySharesAfterCreation(): boolean {
    const created = this.createdProject();
    if (!created || this.sharesApplied) { return false; }
    this.sharesApplied = true;
    this.pollCreating.set(false);
    for (const invite of this.pendingInvites()) {
      this.sharingStore.share({
        email: invite.email,
        permissionType: invite.role,
        projectId: created.projectId,
      });
    }
    return true;
  }

  loadSharingContacts(): void {
    this.sharingStore.loadGeneralContacts();
  }

  onTypeSelected(type: OptionType, wizardStep: ReturnType<typeof signal<number>>): void {
    this.optionType.set(type);
    if (type === OptionType.YesNo) {
      this.options.set([{ text: '', description: '' }]);
    }
    if (type === OptionType.Date) {
      this.onAppointmentDateTypeChange('date');
    }
    if (wizardStep() === 1) {
      wizardStep.set(2);
    }
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
      this.dateOptions.update((o) => o.filter((_, i) => i !== existingIndex));
    } else {
      this.dateOptions.update((o) => [...o, { type: 'weekday', weekday }]);
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

  onOptionsChange(updated: OptionEntry[]): void {
    this.options.set(updated);
  }

  onDateOptionsChange(updated: DateOptionEntry[]): void {
    this.dateOptions.set(updated);
  }

  addPendingInvite(invite: PendingInvite): void {
    this.pendingInvites.update(list => [...list, invite]);
  }

  removePendingInvite(email: string): void {
    this.pendingInvites.update(list => list.filter(i => i.email !== email));
  }

  closePollNow(pollId: string | undefined): void {
    if (pollId) {
      this.projectDetailStore.closePoll(pollId);
    }
  }

  reopenPollNow(pollId: string | undefined): void {
    if (pollId) {
      this.projectDetailStore.reopenPoll(pollId);
    }
  }

  submitAdd(projectId: string | undefined): void {
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

  submitStandalone(): void {
    const optionType = this.optionType();
    if (optionType === undefined || !this.isValid()) {
      return;
    }

    this.pollCreating.set(true);

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

  submitEdit(projectId: string | undefined, pollId: string | undefined): void {
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

  finishAndNavigate(): void {
    this.projectListStore.clearCreatedProject();
    this.router.navigate(['/polls']);
  }

  navigateAfterDiscard(projectId: string | undefined, pollId: string | undefined): void {
    if (projectId && pollId) {
      this.router.navigate(['/polls', projectId, 'overview', pollId]);
    } else {
      this.router.navigate(['/polls']);
    }
  }
}
