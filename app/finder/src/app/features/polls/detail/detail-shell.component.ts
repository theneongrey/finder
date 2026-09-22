import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
    untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { PollDetailStore } from '../_shared/data/poll-detail.store';
import { UserStore } from '@common/data/user.store';
import { PollDetailComponent } from './poll-detail/poll-detail.component';

@Component({
    selector: 'app-poll-detail-shell',
    imports: [PollDetailComponent],
    templateUrl: './detail-shell.component.html',
    host: { class: 'block' },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollDetailShellComponent {
    private readonly projectDetailStore = inject(PollDetailStore);
    private readonly router = inject(Router);
    private readonly userStore = inject(UserStore);

    id = input<string>();
    pollId = input<string>();

    /** Bound from ?created=1 and forwarded to the detail component so the
     *  share-link bar shows once right after poll creation. */
    created = input<string | undefined>(undefined);

    constructor() {
        effect(() => {
            const projectId = this.id();
            if (projectId) {
                this.projectDetailStore.getProject(projectId);
                untracked(() =>
                    this.userStore.markProjectNotificationsAsRead(projectId),
                );
            }
        });

        effect(() => {
            const project = this.projectDetailStore.currentProject();
            if (project && this.id() !== project.id) {
                this.router.navigate(['/polls', project.id, this.pollId()], {
                    replaceUrl: true,
                });
            }
        });
    }
}
