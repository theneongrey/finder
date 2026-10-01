import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from '@ds/menu/ds-menu.component';

/** Handlers for the option card menu; an item is only shown when its handler is given. */
export interface OptionMenuActions {
    edit?: () => void;
    resetVote?: () => void;
    delete?: () => void;
}

/** Menu items for an option card, in a fixed order: Edit, Reset vote, Delete. */
export function optionMenuItems(
    translate: TranslateService,
    actions: OptionMenuActions,
): MenuItem[] {
    const items: MenuItem[] = [];
    if (actions.edit) {
        items.push({
            icon: 'edit',
            label: translate.instant('project.results.edit'),
            onClick: actions.edit,
        });
    }
    if (actions.resetVote) {
        items.push({
            icon: 'refresh',
            label: translate.instant('project.results.resetVote'),
            onClick: actions.resetVote,
        });
    }
    if (actions.delete) {
        items.push({
            icon: 'trash',
            label: translate.instant('project.results.deleteOption'),
            danger: true,
            separatorBefore: true,
            onClick: actions.delete,
        });
    }
    return items;
}
