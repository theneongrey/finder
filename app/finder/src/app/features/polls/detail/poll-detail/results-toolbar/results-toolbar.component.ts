import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    afterNextRender,
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
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        // Publish the toolbar's rendered height so the poll header's sticky bar can pin exactly
        // below it. Its height is fractional (text metrics), so a hardcoded offset left a subpixel
        // seam where the scrolling content showed through.
        afterNextRender(() => {
            const bar = this.host.nativeElement.firstElementChild;
            if (!bar) {
                return;
            }
            const root = document.documentElement;
            const observer = new ResizeObserver(() =>
                root.style.setProperty(
                    '--results-toolbar-height',
                    `${bar.getBoundingClientRect().height}px`,
                ),
            );
            observer.observe(bar);
            this.destroyRef.onDestroy(() => {
                observer.disconnect();
                root.style.removeProperty('--results-toolbar-height');
            });
        });
    }

    canManage = input(false);
    isClosed = input(false);
    commentsHidden = input(false);
    presence = input<PollParticipant[]>([]);
    selfId = input<string | undefined>(undefined);
    /** Current sort label, shown in the overflow menu's sort toggle. */
    sortLabel = input('');

    startVote = output<void>();
    addOption = output<void>();
    closePoll = output<void>();
    reopenPoll = output<void>();
    showComments = output<void>();
    share = output<void>();
    toggleSort = output<void>();

    protected readonly showCloseConfirm = signal(false);

    private readonly endPollLabel = this.translateService.translate(
        'project.results.endPoll',
    );
    private readonly shareLabel = this.translateService.translate(
        'project.common.share',
    );

    /** End-poll + share — the management actions the kebab carries at every width. Both are
     *  Maintainer/Owner-only, so for a plain voter this list is empty. */
    private readonly actionItems = computed<MenuItem[]>(() => {
        const items: MenuItem[] = [];
        if (!this.canManage()) {
            return items;
        }
        if (!this.isClosed()) {
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
            separatorBefore: items.length > 0,
            onClick: () => this.share.emit(),
        });
        return items;
    });

    /** Desktop kebab: the sort toggle lives in the poll header, so the menu is actions only. */
    protected readonly menuItems = this.actionItems;

    /**
     * Mobile kebab: there's no header sort button at this width, so the menu leads with the sort
     * toggle followed by the shared actions.
     */
    protected readonly menuItemsCompact = computed<MenuItem[]>(() => {
        const sortItem: MenuItem = {
            icon: 'sort',
            label: this.sortLabel(),
            onClick: () => this.toggleSort.emit(),
        };
        return [
            sortItem,
            ...this.actionItems().map((item, i) =>
                i === 0 ? { ...item, separatorBefore: true } : item,
            ),
        ];
    });
}
