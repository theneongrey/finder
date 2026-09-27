import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsMenuComponent, MenuItem } from '@ds/menu/ds-menu.component';
import { PresenceAvatarsComponent } from '../../../_shared/ui/presence-avatars/presence-avatars.component';
import { PollParticipant } from '../../../_shared/models/poll-realtime.model';

@Component({
    selector: 'app-results-toolbar',
    templateUrl: './results-toolbar.component.html',
    imports: [
        TranslatePipe,
        DsButtonComponent,
        DsMenuComponent,
        PresenceAvatarsComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsToolbarComponent {
    private readonly translateService = inject(TranslateService);

    canManage = input(false);
    isClosed = input(false);
    commentsHidden = input(false);
    refreshing = input(false);
    presence = input<PollParticipant[]>([]);
    selfId = input<string | undefined>(undefined);

    startVote = output<void>();
    addOption = output<void>();
    closePoll = output<void>();
    reopenPoll = output<void>();
    showComments = output<void>();
    refresh = output<void>();
    share = output<void>();

    protected readonly showCloseConfirm = signal(false);

    private readonly endPollLabel = this.translateService.translate(
        'project.results.endPoll',
    );
    private readonly shareLabel = this.translateService.translate(
        'project.common.share',
    );

    /** Overflow menu (kebab) shown in place of the standalone close button. */
    protected readonly menuItems = computed<MenuItem[]>(() => {
        const items: MenuItem[] = [];
        if (this.isClosed()) {
            return items;
        }
        if (this.canManage()) {
            items.push({
                icon: 'circle-minus',
                label: this.endPollLabel(),
                danger: true,
                onClick: () => this.showCloseConfirm.set(true),
            });
        }
        items.push({
            icon: 'share',
            label: this.shareLabel(),
            separatorBefore: true,
            onClick: () => this.share.emit(),
        });
        return items;
    });
}
