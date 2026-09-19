import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { PollTypeButtonComponent } from './poll-type-button/poll-type-button.component';
import { OptionType } from '@common/models/option-type.model';

@Component({
    selector: 'app-poll-type-selection',
    templateUrl: './poll-type-selection.component.html',
    styleUrl: './poll-type-selection.component.css',
    host: { class: 'block' },
    imports: [PollTypeButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollTypeSelectionComponent {
    selectedType = input<OptionType | undefined>(undefined);
    layout = input<'list' | 'grid'>('list');
    typeSelected = output<OptionType>();

    readonly pollTypes = [
        {
            type: OptionType.YesNo,
            iconName: 'checklist',
            iconBg: '#e4efe1',
            iconColor: '#5c9a63',
            nameKey: 'project.detail.pollTypes.yesNo',
            descKey: 'project.detail.pollTypes.yesNoDesc',
            testId: 'type-btn-yesno',
        },
        {
            type: OptionType.Date,
            iconName: 'calendar',
            iconBg: '#f6e7d5',
            iconColor: '#c67f3b',
            nameKey: 'project.detail.pollTypes.appointment',
            descKey: 'project.detail.pollTypes.appointmentDesc',
            testId: 'type-btn-date',
        },
        {
            type: OptionType.Rating,
            iconName: 'star',
            iconBg: '#e8e3f2',
            iconColor: '#7568ac',
            nameKey: 'project.detail.pollTypes.rating',
            descKey: 'project.detail.pollTypes.ratingDesc',
            testId: 'type-btn-rating',
        },
    ];
}
