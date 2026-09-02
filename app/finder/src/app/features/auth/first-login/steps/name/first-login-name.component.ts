import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    effect,
    inject,
    output,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NAMES_TOP_100 } from '../../../../../common/constants/names.constants';
import { UserStore } from '../../../../../common/data/user.store';
import { DsAvatarComponent } from '../../../../../common/ui/ds-components/avatar/ds-avatar.component';
import { DsButtonComponent } from '../../../../../common/ui/ds-components/button/ds-button.component';
import { DsInputComponent } from '../../../../../common/ui/ds-components/input/ds-input.component';

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

function pickRandomName(): string {
    return NAMES_TOP_100[Math.floor(Math.random() * NAMES_TOP_100.length)];
}

@Component({
    selector: 'app-first-login-name',
    imports: [
        FormsModule,
        TranslatePipe,
        DsButtonComponent,
        DsInputComponent,
        DsAvatarComponent,
    ],
    templateUrl: './first-login-name.component.html',
    styleUrl: './first-login-name.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
})
export class FirstLoginNameComponent {
    next = output<void>();

    private readonly userStore = inject(UserStore);
    private readonly destroyRef = inject(DestroyRef);

    readonly nameValue = signal('');
    readonly saving = signal(false);

    protected readonly initial = computed(
        () => this.nameValue().trim()[0]?.toUpperCase() ?? '?',
    );
    protected readonly palette = computed(() => {
        const n = this.nameValue().trim();
        const idx = n ? nameHash(n) % PERSON_PALETTE.length : 0;
        return PERSON_PALETTE[idx];
    });

    protected readonly animatedName = signal<string>(pickRandomName());
    protected readonly fadingOut = signal(false);
    protected readonly showPlaceholder = computed(
        () => !this.nameValue().trim(),
    );

    constructor() {
        effect(() => {
            if (this.saving() && this.userStore.user()?.name) {
                this.next.emit();
            }
        });

        let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
        const cycleTimer = setInterval(() => {
            this.fadingOut.set(true);
            fadeTimeout = setTimeout(() => {
                this.animatedName.set(pickRandomName());
                this.fadingOut.set(false);
            }, 380);
        }, 2800);

        this.destroyRef.onDestroy(() => {
            clearInterval(cycleTimer);
            clearTimeout(fadeTimeout);
        });
    }

    submit(): void {
        const name = this.nameValue().trim();
        if (!name) return;
        this.saving.set(true);
        this.userStore.updateProfile({
            name,
            language: this.userStore.user()?.language ?? 'de',
        });
    }
}
