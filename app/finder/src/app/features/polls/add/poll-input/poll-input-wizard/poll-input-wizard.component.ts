import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PollInputStateService } from '../poll-input-state.service';
import { PollTypeSelectionComponent } from './poll-type-selection/poll-type-selection.component';
import { PollQuestionCardComponent } from '../../../_shared/ui/poll-input-form/poll-question-card/poll-question-card.component';
import { PollCloseSettingsComponent } from '../../../_shared/ui/poll-input-form/poll-close-settings/poll-close-settings.component';
import { ShareAccessFormComponent } from '../../../_shared/ui/share-content/share-access-form/share-access-form.component';
import { ShareInviteFormComponent } from '../../../_shared/ui/share-content/share-invite-form/share-invite-form.component';
import {
    DsSegmentedControlComponent,
    SegmentOption,
} from '@ds/segmented-control/ds-segmented-control.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { TitleBarService } from '@common/services/title-bar.service';
import { OptionType } from '@common/models/option-type.model';
import { VisibilityType } from '../../../_shared/models/poll-detail.model';

@Component({
    selector: 'app-poll-input-wizard',
    templateUrl: './poll-input-wizard.component.html',
    styleUrl: './poll-input-wizard.component.css',
    host: { class: 'flex flex-col min-[680px]:h-[calc(100dvh_-_61px)]' },
    imports: [
        NgTemplateOutlet,
        PollTypeSelectionComponent,
        PollQuestionCardComponent,
        PollCloseSettingsComponent,
        ShareAccessFormComponent,
        ShareInviteFormComponent,
        DsSegmentedControlComponent,
        DsButtonComponent,
        DsCardComponent,
        DsIconComponent,
        TranslatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputWizardComponent {
    protected readonly state = inject(PollInputStateService);
    private readonly titleService = inject(TitleBarService);
    private readonly translateService = inject(TranslateService);

    readonly isDesktop = toSignal(
        inject(BreakpointObserver)
            .observe('(min-width: 680px)')
            .pipe(map(({ matches }) => matches)),
        { initialValue: false },
    );

    readonly shareTimingOptions = computed<SegmentOption[]>(() => [
        {
            value: 'later',
            label: this.translateService.instant(
                'project.pollInput.shareLater',
            ),
        },
        {
            value: 'now',
            label: this.translateService.instant('project.pollInput.shareNow'),
        },
    ]);

    readonly visibilityOptions = computed<SegmentOption[]>(() => [
        {
            value: 'invite-only',
            label: this.translateService.instant('project.share.inviteOnly'),
            icon: 'lock',
        },
        {
            value: 'open',
            label: this.translateService.instant('project.share.open'),
            icon: 'globe',
        },
    ]);

    readonly selectedVisibilityStr = computed(() =>
        this.state.visibility() === VisibilityType.VisibleForEverybody
            ? 'open'
            : 'invite-only',
    );

    readonly isPublic = computed(
        () => this.state.visibility() === VisibilityType.VisibleForEverybody,
    );

    /**
     * Mobile only reveals sections progressively to keep the first view calm.
     * On desktop everything is visible from the start.
     */
    private readonly typeChosen = signal(false);

    readonly revealType = computed(
        () => this.isDesktop() || this.state.question().trim().length >= 3,
    );

    readonly revealRest = computed(
        () => this.isDesktop() || this.typeChosen(),
    );

    constructor() {
        effect(() => {
            this.state.initStandaloneMode();
        });

        // Preselect a default type on desktop only; mobile reveals the type
        // picker progressively and waits for an explicit choice.
        effect(() => {
            if (this.isDesktop()) {
                this.state.preselectYesNo();
            }
        });

        effect(() => {
            this.state.loadSharingContacts();
        });

        effect(() => {
            this.state.applySharesAndNavigate();
        });

        effect(() => {
            this.titleService.setProgress(undefined);
            this.titleService.setBackFn(undefined);
            this.titleService.setBackRoute('/polls');
            this.titleService.setTitle(
                this.translateService.instant(
                    'project.standaloneInput.addNew.cto',
                ),
            );
        });
    }

    onTypeSelected(type: OptionType): void {
        this.state.onTypeSelected(type);
        this.typeChosen.set(true);
    }

    onShareTimingChange(value: string): void {
        this.state.shareTiming.set(value === 'now' ? 'now' : 'later');
    }

    onVisibilityChange(value: string): void {
        this.state.visibility.set(
            value === 'open'
                ? VisibilityType.VisibleForEverybody
                : VisibilityType.VisibleForSelectedOnly,
        );
    }

    onCreate(): void {
        this.state.submitStandalone();
    }
}
