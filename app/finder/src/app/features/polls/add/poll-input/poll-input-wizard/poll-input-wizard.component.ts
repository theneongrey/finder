import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PollInputStateService } from '../poll-input-state.service';
import { PollTypeSelectionComponent } from './poll-type-selection/poll-type-selection.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsSubHeaderComponent } from '@ds/sub-header/ds-sub-header.component';
import { ShareContentComponent } from '../../../_shared/ui/share-content/share-content.component';
import { PollItemComponent } from '../../../_shared/ui/poll-item/poll-item.component';
import { PollInputFormComponent } from '../../../_shared/ui/poll-input-form/poll-input-form.component';
import { TitleBarService } from '@common/services/title-bar.service';
import { OptionType } from '@common/models/option-type.model';

@Component({
  selector: 'app-poll-input-wizard',
  templateUrl: './poll-input-wizard.component.html',
  imports: [
    PollTypeSelectionComponent,
    PollInputFormComponent,
    ShareContentComponent,
    PollItemComponent,
    DsButtonComponent,
    DsIconComponent,
    DsSubHeaderComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputWizardComponent {
  protected readonly state = inject(PollInputStateService);
  private readonly titleService = inject(TitleBarService);
  private readonly translateService = inject(TranslateService);

  readonly OptionType = OptionType;

  readonly wizardStep = signal(1);

  readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 680px)')
      .pipe(map(({ matches }) => matches)),
    { initialValue: false },
  );

  readonly optionTypeLabel = computed(() => {
    const type = this.state.optionType();
    if (type === OptionType.YesNo) {
      return 'project.detail.pollTypes.yesNo';
    }
    if (type === OptionType.Date) {
      return 'project.detail.pollTypes.appointment';
    }
    if (type === OptionType.Rating) {
      return 'project.detail.pollTypes.rating';
    }
    return '';
  });

  readonly step2Label = computed(() => {
    const type = this.state.optionType();
    if (type === OptionType.Date) {
      return 'project.pollInput.stepOptionsDate';
    }
    if (type === OptionType.Rating) {
      return 'project.pollInput.stepOptionsRating';
    }
    return 'project.pollInput.stepOptions';
  });

  readonly ctaLabel = computed((): string => {
    const step = this.wizardStep();
    if (step === 1) {
      return 'project.pollInput.next';
    }
    if (step === 2) {
      return 'project.pollInput.createPoll';
    }
    return 'project.pollInput.done'; // step 3: finish
  });

  readonly canProceed = computed((): boolean => {
    const step = this.wizardStep();
    if (step === 1) {
      return this.state.optionType() !== undefined;
    }
    if (step === 2) {
      return this.state.isValid() && !this.state.isPollCreating();
    }
    if (step === 3) {
      return true;
    }
    return true;
  });

  readonly webSteps = computed(() => {
    const step = this.wizardStep();
    return [
      {
        num: '1',
        titleKey: 'project.pollInput.stepArt',
        subKey: this.optionTypeLabel(),
        isDone: step > 1,
        isCurrent: step === 1,
      },
      {
        num: '2',
        titleKey: this.step2Label(),
        subKey: '',
        isDone: step > 2,
        isCurrent: step === 2,
      },
      {
        num: '3',
        titleKey: 'project.pollInput.stepShare',
        subKey: '',
        isDone: false,
        isCurrent: step === 3,
      },
    ];
  });

  readonly webContentTitleKey = computed((): string => {
    const step = this.wizardStep();
    if (step === 1) {
      return 'project.pollInput.typeTitle';
    }
    if (step === 2) {
      return this.step2Label();
    }
    return 'project.pollInput.shareTitle';
  });

  readonly webContentSubtitle = computed((): string => {
    const step = this.wizardStep();
    if (step === 1) {
      return this.translateService.instant('project.pollInput.webStep1Title');
    }
    if (step === 2) {
      return this.state.optionType() === OptionType.Date
        ? this.translateService.instant('project.pollInput.webStep2TitleDate')
        : this.translateService.instant(
            'project.pollInput.webStep2TitleGeneric',
          );
    }
    return this.translateService.instant('project.pollInput.webStep3Title');
  });

  constructor() {
    effect(() => {
      this.state.initStandaloneMode();
    });

    effect(
      () => {
        this.state.preselectYesNo();
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        if (this.state.tryApplySharesAfterCreation()) {
          this.wizardStep.set(3);
        }
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      this.state.loadSharingContacts();
    });

    effect(() => {
      const step = this.wizardStep();
      const desktop = this.isDesktop();

      if (desktop) {
        this.titleService.setProgress(undefined);
        this.titleService.setTitle(
          this.translateService.instant('project.standaloneInput.addNew.cto'),
        );
        this.titleService.setSubtitle(
          this.translateService.instant('project.pollInput.pollsOverviewLabel'),
        );
        return;
      }

      const step2Name = this.translateService.instant(this.step2Label());
      const step1Name = this.translateService.instant(
        'project.pollInput.stepArt',
      );
      const step3Name = this.translateService.instant(
        'project.pollInput.stepShare',
      );
      const stepNames = [step1Name, step2Name, step3Name];
      const titles = [
        this.translateService.instant('project.standaloneInput.addNew.cto'),
        step2Name,
        step3Name,
      ];

      this.titleService.setTitle(titles[step - 1]);
      this.titleService.setSubtitle(
        this.translateService.instant('project.pollInput.mobileStepSubtitle', {
          step,
          total: 3,
          name: stepNames[step - 1],
        }),
      );
      this.titleService.setProgress(Math.round((step / 3) * 100));
      this.titleService.setBackFn(
        step === 2 ? () => this.prevStep() : undefined,
      );
    });
  }

  onTypeSelected(type: OptionType): void {
    this.state.onTypeSelected(type, this.wizardStep);
  }

  onCta(): void {
    const step = this.wizardStep();

    if (step === 1) {
      this.wizardStep.set(2);
      return;
    }

    if (step === 2) {
      this.state.submitStandalone();
      return;
    }

    // step 3: finish
    this.state.finishAndNavigate();
  }

  prevStep(): void {
    if (this.wizardStep() > 1) {
      this.wizardStep.update((s) => s - 1);
    }
  }

  discard(): void {
    this.state.finishAndNavigate();
  }
}
