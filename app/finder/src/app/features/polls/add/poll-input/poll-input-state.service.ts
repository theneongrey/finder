import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { PollListStore } from '../../_shared/data/poll-list.store';
import { SharingStore } from '../../_shared/data/sharing.store';
import { AppointmentTypeConversionService } from '../../_shared/utils/appointment-type-conversion.service';
import { DateOptionFormatService } from '../../_shared/utils/date-option-format.service';
import { OptionType } from '../../../../common/models/option-type.model';
import { PendingInvite } from '../../_shared/ui/share-content/share-invite-form/share-invite-form.component';
import { PollRole } from '../../_shared/models/poll-role.enum';
import { OptionEntry } from '../../detail/poll-detail/option-input/poll-options/poll-options.component';
import {
    DateOptionEntry,
    DateOptionType,
    dateTypeToOptionType,
    isDateOptionType,
    optionTypeHasTime,
    optionTypeToDateType,
} from '../../_shared/models/date-option.model';
import { UrlValidationService } from '../../_shared/utils/url-validation.service';
import { POLL_LIMITS } from '../../_shared/models/poll-limits';
import { VisibilityType } from '../../_shared/models/poll-detail.model';

@Injectable()
export class PollInputStateService {
    private readonly projectDetailStore = inject(PollDetailStore);
    readonly projectListStore = inject(PollListStore);
    private readonly sharingStore = inject(SharingStore);

    readonly VisibilityType = VisibilityType;
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly urlValidation = inject(UrlValidationService);
    private readonly conversionService = inject(
        AppointmentTypeConversionService,
    );
    private readonly dateOptionFormat = inject(DateOptionFormatService);

    readonly OptionType = OptionType;

    readonly projectId = this.projectDetailStore.projectId;

    readonly createdProject = computed(() =>
        this.projectListStore.lastCreatedProject(),
    );

    optionType = signal<OptionType | undefined>(
        this.route.snapshot.data['optionType'],
    );

    readonly pendingInvites = signal<PendingInvite[]>([]);
    readonly shareTiming = signal<'later' | 'now'>('later');
    readonly visibility = signal<VisibilityType>(
        VisibilityType.VisibleForSelectedOnly,
    );
    readonly sharingContacts = this.sharingStore.sharingContactsSuggestion;

    private sharesApplied = false;

    readonly canReopenPoll = computed(() => {
        const poll = this.projectDetailStore.currentPoll();
        const project = this.projectDetailStore.currentProject();
        return (
            poll !== undefined &&
            poll.isClosed &&
            project !== undefined &&
            project.role >= PollRole.Maintainer
        );
    });

    readonly pollClosedAt = computed(
        () => this.projectDetailStore.currentPoll()?.closeDate,
    );

    readonly question = signal('');
    readonly description = signal('');
    readonly closeDate = signal<string | undefined>(undefined);
    readonly options = signal<OptionEntry[]>([{ text: '', description: '' }]);
    readonly dateOptions = signal<DateOptionEntry[]>([]);
    readonly appointmentDateType = signal<DateOptionType | undefined>(
        undefined,
    );
    // Whether each option carries a time-of-day. Persisted via the concrete
    // OptionType (e.g. Date vs DateWithTime), not as a separate field.
    readonly showTime = signal<boolean>(false);
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
        if (isDateOptionType(type)) {
            const dateType = this.appointmentDateType();
            if (!dateType) {
                return false;
            }
            return (
                !!this.question() &&
                this.dateOptions().some((o) => this.dateOptionFormat.isValid(o))
            );
        }
        const opts = this.options();
        return (
            !!this.question() &&
            opts.filter((o) => !!o.text).length >= 1 &&
            opts.every(
                (o) => !o.meta?.url || this.urlValidation.isValid(o.meta.url),
            ) &&
            opts.every((o) => o.text.length <= POLL_LIMITS.optionTextLength)
        );
    });

    readonly isPollCreating: Signal<boolean> = this.pollCreating;

    /**
     * Single-step creation only requires a title; the poll type always has a
     * default and options are added later on the results page.
     */
    readonly canCreate = computed(
        (): boolean =>
            !!this.question() &&
            this.optionType() !== undefined &&
            !this.pollCreating(),
    );

    private editDataLoaded = false;
    readonly editLoading = signal(true);

    initEditMode(pollId: string): void {
        this.editDataLoaded = false;
        this.editLoading.set(true);
        this.projectDetailStore.getPoll(pollId);
    }

    loadEditData(pollId: string): void {
        if (this.editDataLoaded) {
            return;
        }
        const currentPoll = this.projectDetailStore.currentPoll();
        if (!currentPoll || currentPoll.id !== pollId) {
            return;
        }
        this.editDataLoaded = true;
        this.editLoading.set(false);

        this.question.set(currentPoll.name);
        this.description.set(currentPoll.description);
        this.closeDate.set(currentPoll.closeDate);

        if (isDateOptionType(currentPoll.optionType)) {
            const dateType = optionTypeToDateType(currentPoll.optionType)!;
            this.appointmentDateType.set(dateType);
            this.showTime.set(optionTypeHasTime(currentPoll.optionType));
            this.dateOptions.set(
                currentPoll.options.map((o) =>
                    this.dateOptionFormat.parse(o.text, dateType, o.id),
                ),
            );
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
        this.shareTiming.set('later');
        this.visibility.set(VisibilityType.VisibleForSelectedOnly);
    }

    addPendingInvite(invite: PendingInvite): void {
        this.pendingInvites.update((invites) => [
            ...invites.filter((i) => i.email !== invite.email),
            invite,
        ]);
    }

    removePendingInvite(email: string): void {
        this.pendingInvites.update((invites) =>
            invites.filter((i) => i.email !== email),
        );
    }

    preselectYesNo(): void {
        if (this.optionType() === undefined) {
            this.optionType.set(OptionType.YesNo);
            this.options.set([{ text: '', description: '' }]);
        }
    }

    /**
     * Runs once the poll has been created. When the user chose "share now",
     * the remembered visibility and invites are applied. Either way we route
     * to the poll's results page, flagging a fresh creation so the share-link
     * bar can be shown.
     */
    applySharesAndNavigate(): void {
        const created = this.createdProject();
        if (!created || this.sharesApplied) {
            return;
        }
        this.sharesApplied = true;
        this.pollCreating.set(false);

        if (this.shareTiming() === 'now') {
            if (this.visibility() === VisibilityType.VisibleForEverybody) {
                this.sharingStore.updateVisibilityType({
                    projectId: created.projectId,
                    type: this.visibility(),
                });
            }
            for (const invite of this.pendingInvites()) {
                this.sharingStore.share({
                    email: invite.email,
                    permissionType: invite.role,
                    projectId: created.projectId,
                });
            }
        }

        this.router.navigate(['/polls', created.projectId, created.pollId], {
            queryParams: { created: 1 },
        });
    }

    loadSharingContacts(): void {
        this.sharingStore.loadGeneralContacts();
    }

    onTypeSelected(type: OptionType): void {
        // The wizard offers three categories (YesNo / Rating / Date); the Date
        // category maps to a granular date OptionType via the sub-type picker.
        if (isDateOptionType(type)) {
            // Default to single-date, but keep the current sub-type if the user
            // is already on a date poll (re-clicking the category button).
            if (!isDateOptionType(this.optionType())) {
                this.onAppointmentDateTypeChange('date');
            }
            return;
        }
        this.optionType.set(type);
        if (type === OptionType.YesNo) {
            this.options.set([{ text: '', description: '' }]);
        }
    }

    onAppointmentDateTypeChange(newType: DateOptionType): void {
        // The sub-type + the per-option time flag together map to the concrete
        // OptionType (e.g. 'date' + time → DateWithTime).
        this.optionType.set(dateTypeToOptionType(newType, this.showTime()));
        const oldType = this.appointmentDateType();
        if (oldType === newType) {
            return;
        }
        if (oldType) {
            const converted = this.conversionService.convert(
                this.dateOptions(),
                oldType,
                newType,
            );
            const fallback = newType === 'weekday' ? [] : [{ type: newType }];
            this.dateOptions.set(converted.length > 0 ? converted : fallback);
        } else {
            this.dateOptions.set(
                newType === 'weekday' ? [] : [{ type: newType }],
            );
        }
        this.appointmentDateType.set(newType);
    }

    onToggleTime(value: boolean): void {
        this.showTime.set(value);
        const dateType = this.appointmentDateType();
        if (dateType) {
            this.optionType.set(dateTypeToOptionType(dateType, value));
        }
        if (value) {
            const start = this.dateOptionFormat.nextFullHour();
            this.dateOptions.update((opts) =>
                opts.map((o) => {
                    if (o.startTime) {
                        return o;
                    }
                    const changes: Partial<DateOptionEntry> = {
                        startTime: start,
                    };
                    if (o.type === 'date-range' && !o.endTime) {
                        const end = new Date(start);
                        end.setHours(end.getHours() + 1);
                        changes.endTime = end;
                    }
                    return { ...o, ...changes };
                }),
            );
        } else {
            this.dateOptions.update((opts) =>
                opts.map((o) => ({
                    ...o,
                    startTime: undefined,
                    endTime: undefined,
                })),
            );
        }
    }

    toggleWeekday(weekday: number): void {
        const opts = this.dateOptions();
        const existingIndex = opts.findIndex((o) => o.weekday === weekday);
        if (existingIndex !== -1) {
            const removed = opts[existingIndex];
            if (removed.id) {
                this.removedOptionIds.update((ids) => [...ids, removed.id!]);
            }
            this.dateOptions.update((o) =>
                o.filter((_, i) => i !== existingIndex),
            );
        } else {
            const entry: DateOptionEntry = { type: 'weekday', weekday };
            if (this.showTime()) {
                entry.startTime = this.dateOptionFormat.nextFullHour();
            }
            this.dateOptions.update((o) => [...o, entry]);
        }
    }

    addOption(): void {
        const type = this.optionType();
        if (isDateOptionType(type)) {
            const dateType = this.appointmentDateType();
            if (!dateType) {
                return;
            }
            if (dateType === 'time') {
                this.dateOptions.update((opts) => [
                    ...opts,
                    {
                        type: 'time',
                        startTime: this.dateOptionFormat.nextFullHour(),
                    },
                ]);
            } else if (dateType === 'time-range') {
                const start = this.dateOptionFormat.nextFullHour();
                const end = new Date(start);
                end.setHours(end.getHours() + 1);
                this.dateOptions.update((opts) => [
                    ...opts,
                    { type: 'time-range', startTime: start, endTime: end },
                ]);
            } else {
                const entry: DateOptionEntry = { type: dateType };
                if (this.showTime()) {
                    const start = this.dateOptionFormat.nextFullHour();
                    entry.startTime = start;
                    if (dateType === 'date-range') {
                        const end = new Date(start);
                        end.setHours(end.getHours() + 1);
                        entry.endTime = end;
                    }
                }
                this.dateOptions.update((opts) => [...opts, entry]);
            }
        } else {
            this.options.update((opts) => [
                ...opts,
                { text: '', description: '' },
            ]);
        }
    }

    removeOption(index: number): void {
        const type = this.optionType();
        if (isDateOptionType(type)) {
            const removed = this.dateOptions()[index];
            if (removed?.id) {
                this.removedOptionIds.update((ids) => [...ids, removed.id!]);
            }
            this.dateOptions.update((opts) =>
                opts.filter((_, i) => i !== index),
            );
        } else {
            const removedOption = this.options()[index];
            if (removedOption?.id) {
                this.removedOptionIds.update((ids) => [
                    ...ids,
                    removedOption.id!,
                ]);
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

    submitStandalone(): void {
        const optionType = this.optionType();
        if (optionType === undefined || !this.canCreate()) {
            return;
        }

        this.pollCreating.set(true);

        // Options are added later on the results page — the poll is created bare.
        this.projectListStore.addStandalonePoll({
            name: this.question(),
            description: this.description(),
            optionType,
            closeDate: this.closeDate(),
            options: [],
        });
    }

    submitEdit(
        projectId: string | undefined,
        pollId: string | undefined,
    ): void {
        const optionType = this.optionType();
        if (
            !projectId ||
            !pollId ||
            optionType === undefined ||
            !this.isValid()
        ) {
            return;
        }

        if (isDateOptionType(optionType)) {
            const options = this.dateOptions()
                .filter((o) => this.dateOptionFormat.isValid(o))
                .map((o) => ({
                    id: o.id,
                    text: this.dateOptionFormat.serialize(o),
                    description: '',
                }));

            this.projectDetailStore.editPoll({
                projectId,
                pollId,
                name: this.question(),
                description: this.description(),
                optionType,
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
                optionType,
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

    navigateAfterDiscard(
        _projectId: string | undefined,
        _pollId: string | undefined,
    ): void {
        this.router.navigate(['/polls']);
    }
}
