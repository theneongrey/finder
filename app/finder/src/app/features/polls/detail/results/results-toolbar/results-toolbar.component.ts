import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
    signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';

@Component({
    selector: 'app-results-toolbar',
    templateUrl: './results-toolbar.component.html',
    imports: [TranslatePipe, DsButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsToolbarComponent {
    canManage = input(false);
    isClosed = input(false);
    commentsHidden = input(false);

    startVote = output<void>();
    addOption = output<void>();
    closePoll = output<void>();
    reopenPoll = output<void>();
    showComments = output<void>();

    protected readonly showCloseConfirm = signal(false);
}
