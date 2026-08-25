import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TitleBarService } from '@common/services/title-bar.service';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { OptionTypeBadgeComponent } from '@smart/option-type-badge/option-type-badge.component';
import { PollInputFormComponent } from '../../_shared/ui/poll-input-form/poll-input-form.component';
import { PollInputStateService } from '../../add/poll-input/poll-input-state.service';

@Component({
  selector: 'app-edit-poll',
  imports: [
    NgTemplateOutlet,
    PollInputFormComponent,
    OptionTypeBadgeComponent,
    DsButtonComponent,
    TranslatePipe,
  ],
  templateUrl: './edit-poll.component.html',
  providers: [PollInputStateService],
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPollComponent {
  protected readonly state = inject(PollInputStateService);
  private readonly titleService = inject(TitleBarService);
  private readonly translateService = inject(TranslateService);

  pollId = input<string | undefined>(undefined);

  readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 680px)')
      .pipe(map(({ matches }) => matches)),
    { initialValue: false },
  );

  readonly canSave = computed(
    () => !this.state.pollIsClosed() && this.state.isValid(),
  );

  constructor() {
    effect(() => {
      const pollId = this.pollId();
      if (pollId) {
        this.state.initEditMode(pollId);
        this.state.loadSharingContacts();
      }
    });

    effect(
      () => {
        const pollId = this.pollId();
        if (pollId) {
          this.state.loadEditData(pollId);
        }
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      this.titleService.setTitle(
        this.translateService.instant('project.pollInput.editPollTitle'),
      );
      this.titleService.setSubtitle(
        this.translateService.instant('project.pollInput.pollsOverviewLabel'),
      );
      this.titleService.setProgress(undefined);
      this.titleService.setBackFn(undefined);
    });
  }

  save(): void {
    this.state.submitEdit(this.state.projectId(), this.pollId());
  }

  discard(): void {
    this.state.navigateAfterDiscard(this.state.projectId(), this.pollId());
  }
}
