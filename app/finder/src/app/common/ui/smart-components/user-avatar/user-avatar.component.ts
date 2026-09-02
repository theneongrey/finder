import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { DsAvatarComponent } from '@ds/avatar/ds-avatar.component';

const PERSON_PALETTE = [
    { bg: 'var(--person-1-bg)', fg: 'var(--person-1-fg)' },
    { bg: 'var(--person-2-bg)', fg: 'var(--person-2-fg)' },
    { bg: 'var(--person-3-bg)', fg: 'var(--person-3-fg)' },
    { bg: 'var(--person-4-bg)', fg: 'var(--person-4-fg)' },
    { bg: 'var(--person-5-bg)', fg: 'var(--person-5-fg)' },
    { bg: 'var(--person-6-bg)', fg: 'var(--person-6-fg)' },
    { bg: 'var(--person-7-bg)', fg: 'var(--person-7-fg)' },
    { bg: 'var(--person-8-bg)', fg: 'var(--person-8-fg)' },
];

function nameHash(name: string): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
        h = (h * 31 + name.charCodeAt(i)) >>> 0;
    }
    return h;
}

@Component({
    selector: 'app-user-avatar',
    imports: [DsAvatarComponent],
    templateUrl: './user-avatar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class UserAvatarComponent {
    user = input.required<{ name: string | undefined }>();
    size = input<'normal' | 'large' | 'xlarge' | number>('normal');
    voted = input<boolean | undefined>(undefined);

    protected readonly initial = computed(
        () => this.user().name?.[0]?.toUpperCase() ?? '',
    );
    protected readonly palette = computed(() => {
        const idx = nameHash(this.user().name ?? '') % PERSON_PALETTE.length;
        return PERSON_PALETTE[idx];
    });
    protected readonly avatarSize = computed(() => {
        const s = this.size();
        if (typeof s === 'number') {
            return s;
        }
        if (s === 'normal') {
            return 34;
        }
        if (s === 'large') {
            return 40;
        }
        return 64;
    });
}
