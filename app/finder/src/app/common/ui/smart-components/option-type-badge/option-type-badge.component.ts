import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { OptionType } from '@common/models/option-type.model';

const CONFIG: Record<
    OptionType,
    { icon: string; labelKey: string; bg: string; fg: string }
> = {
    [OptionType.YesNo]: {
        icon: 'checklist',
        labelKey: 'project.detail.pollTypes.yesNo',
        bg: 'var(--person-1-bg)',
        fg: 'var(--person-1-fg)',
    },
    [OptionType.Rating]: {
        icon: 'star',
        labelKey: 'project.detail.pollTypes.rating',
        bg: 'var(--person-3-bg)',
        fg: 'var(--person-3-fg)',
    },
    [OptionType.Date]: {
        icon: 'calendar',
        labelKey: 'project.detail.pollTypes.appointment',
        bg: 'var(--person-4-bg)',
        fg: 'var(--person-4-fg)',
    },
};

@Component({
    selector: 'app-poll-type-badge',
    imports: [DsIconComponent, TranslatePipe],
    templateUrl: './option-type-badge.component.html',
    styleUrl: './option-type-badge.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: inline-flex' },
})
export class OptionTypeBadgeComponent {
    type = input.required<OptionType>();
    showLabel = input(true);

    protected readonly cfg = computed(() => CONFIG[this.type()]);
    protected readonly iconSize = computed(() => (this.showLabel() ? 13 : 16));
}
