import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PollListStore } from '../../_shared/data/poll-list.store';
import { SharingStore } from '../../_shared/data/sharing.store';
import { OptionType } from '../../../../common/models/option-type.model';
import { PendingInvite } from '../../_shared/ui/share-content/share-invite-form/share-invite-form.component';
import {
    DateOptionType,
    dateTypeToOptionType,
    isDateOptionType,
} from '../../_shared/models/date-option.model';
import { VisibilityType } from '../../_shared/models/poll-detail.model';

/**
 * State of the single-step poll creation wizard. Polls are created bare —
 * options are added afterwards on the poll's detail page.
 */
@Injectable()
export class PollInputStateService {
    readonly projectListStore = inject(PollListStore);
    private readonly sharingStore = inject(SharingStore);

    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

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

    readonly question = signal('');
    readonly description = signal('');
    readonly closeDate = signal<string | undefined>(undefined);
    readonly appointmentDateType = signal<DateOptionType | undefined>(
        undefined,
    );
    // Whether each option carries a time-of-day. Persisted via the concrete
    // OptionType (e.g. Date vs DateWithTime), not as a separate field.
    readonly showTime = signal<boolean>(false);
    private readonly pollCreating = signal(false);

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
    }

    onAppointmentDateTypeChange(newType: DateOptionType): void {
        // The sub-type + the per-option time flag together map to the concrete
        // OptionType (e.g. 'date' + time → DateWithTime).
        this.optionType.set(dateTypeToOptionType(newType, this.showTime()));
        this.appointmentDateType.set(newType);
    }

    onToggleTime(value: boolean): void {
        this.showTime.set(value);
        const dateType = this.appointmentDateType();
        if (dateType) {
            this.optionType.set(dateTypeToOptionType(dateType, value));
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
}
