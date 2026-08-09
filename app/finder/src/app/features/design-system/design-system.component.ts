import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DsIconComponent, ICON_NAMES } from '../../common/ui/components/icon/ds-icon.component';
import { DsBadgeComponent } from '../../common/ui/components/badge/ds-badge.component';
import { DsStatusDotComponent } from '../../common/ui/components/badge/ds-status-dot.component';
import { DsAvatarComponent } from '../../common/ui/components/avatar/ds-avatar.component';
import { DsAvatarStackComponent } from '../../common/ui/components/avatar-stack/ds-avatar-stack.component';
import { DsButtonComponent } from '../../common/ui/components/button/ds-button.component';
import { DsCardComponent } from '../../common/ui/components/card/ds-card.component';
import { DsIconButtonComponent } from '../../common/ui/components/icon-button/ds-icon-button.component';
import { DsInputComponent } from '../../common/ui/components/input/ds-input.component';
import { DsProgressBarComponent } from '../../common/ui/components/progress-bar/ds-progress-bar.component';
import { DsSegmentedControlComponent } from '../../common/ui/components/segmented-control/ds-segmented-control.component';
import { DsTabsComponent } from '../../common/ui/components/tabs/ds-tabs.component';
import { DsBottomSheetComponent } from '../../common/ui/components/bottom-sheet/ds-bottom-sheet.component';
import { DsMenuComponent } from '../../common/ui/components/menu/ds-menu.component';
import { DsEmptyStateButtonComponent } from '../../common/ui/components/empty-state-button/ds-empty-state-button.component';
import { DsVoteButtonsComponent } from '../../common/ui/components/vote-buttons/ds-vote-buttons.component';
import { DsPollTypeBadgeComponent } from '../../common/ui/components/poll-type-badge/ds-poll-type-badge.component';
import { DsInputOtpComponent } from '../../common/ui/components/input-otp/ds-input-otp.component';
import { DsTextareaComponent } from '../../common/ui/components/textarea/ds-textarea.component';

@Component({
  selector: 'app-design-system',
  imports: [
    DsIconComponent,
    DsBadgeComponent,
    DsStatusDotComponent,
    DsAvatarComponent,
    DsAvatarStackComponent,
    DsButtonComponent,
    DsCardComponent,
    DsIconButtonComponent,
    DsInputComponent,
    DsProgressBarComponent,
    DsSegmentedControlComponent,
    DsTabsComponent,
    DsBottomSheetComponent,
    DsMenuComponent,
    DsEmptyStateButtonComponent,
    DsVoteButtonsComponent,
    DsPollTypeBadgeComponent,
    DsInputOtpComponent,
    DsTextareaComponent,
    FormsModule,
  ],
  templateUrl: './design-system.component.html',
  styleUrl: './design-system.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignSystemComponent {
  readonly iconNames = ICON_NAMES;

  bottomSheetOpen = signal(false);
  menuOpen = signal(false);
  loadingDemo = signal(false);

  segValue = signal('day');
  tabsValue = signal('overview');

  readonly segOptions = [
    { value: 'day', label: 'Tag' },
    { value: 'week', label: 'Woche' },
    { value: 'month', label: 'Monat' },
  ];

  readonly tabItems = [
    { value: 'overview', label: 'Überblick', count: 3 },
    { value: 'members', label: 'Mitglieder' },
    { value: 'settings', label: 'Einstellungen' },
  ];

  readonly avatarStack = [
    { initial: 'A', bg: 'var(--person-1-bg)', fg: 'var(--person-1-fg)' },
    { initial: 'B', bg: 'var(--person-2-bg)', fg: 'var(--person-2-fg)' },
    { initial: 'C', bg: 'var(--person-3-bg)', fg: 'var(--person-3-fg)' },
    { initial: 'D', bg: 'var(--person-4-bg)', fg: 'var(--person-4-fg)' },
    { initial: 'E', bg: 'var(--person-5-bg)', fg: 'var(--person-5-fg)' },
    { initial: 'F', bg: 'var(--person-6-bg)', fg: 'var(--person-6-fg)' },
  ];

  readonly menuItems = [
    { icon: 'edit', label: 'Bearbeiten', onClick: () => {} },
    { icon: 'share', label: 'Teilen', onClick: () => {} },
    { icon: 'trash', label: 'Löschen', danger: true, onClick: () => {} },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  colorGroups = [
    {
      label: 'Cream / Sand Neutrals',
      colors: [
        { token: '--cream-50', hex: '#faf8f4' },
        { token: '--cream-100', hex: '#f7f5f1' },
        { token: '--cream-200', hex: '#f4f1ec' },
        { token: '--cream-300', hex: '#eeeae3' },
        { token: '--cream-400', hex: '#e0dbd0' },
        { token: '--sand-300', hex: '#e8e3da' },
        { token: '--sand-400', hex: '#d2cdc6' },
        { token: '--sand-500', hex: '#c8c2b8' },
      ],
    },
    {
      label: 'Ink Neutrals — Text',
      colors: [
        { token: '--ink-900', hex: '#1d2227' },
        { token: '--ink-700', hex: '#3a3833' },
        { token: '--ink-600', hex: '#5a5650' },
        { token: '--ink-500', hex: '#6f6b66' },
        { token: '--ink-400', hex: '#79756f' },
        { token: '--ink-350', hex: '#8a8681' },
        { token: '--ink-300', hex: '#9b968f' },
        { token: '--ink-250', hex: '#a39e96' },
        { token: '--ink-200', hex: '#b5b0a8' },
      ],
    },
    {
      label: 'Teal — Brand',
      colors: [
        { token: '--teal-900 (--accent)', hex: '#1f7a8c' },
        { token: '--teal-300', hex: '#9fc2cf' },
        { token: '--teal-200', hex: '#cfe6e8' },
        { token: '--teal-150 (--accent-tint)', hex: '#e7f2f3' },
        { token: '--teal-100', hex: '#d7eef0' },
      ],
    },
    {
      label: 'Semantic — Status',
      colors: [
        { token: '--positive', hex: '#4f7a4a' },
        { token: '--positive-strong', hex: '#5d9a56' },
        { token: '--negative', hex: '#c1453f' },
        { token: '--negative-strong', hex: '#d24a3d' },
        { token: '--warning', hex: '#a8742a' },
      ],
    },
    {
      label: 'Person Palette',
      colors: [
        { token: '--person-1', hex: '#d7eef0', fgHex: '#1f7a8c' },
        { token: '--person-2', hex: '#f4dfe2', fgHex: '#b56374' },
        { token: '--person-3', hex: '#f6e7cf', fgHex: '#b3863a' },
        { token: '--person-4', hex: '#e6e0f3', fgHex: '#6f5aa6' },
        { token: '--person-5', hex: '#dcecd9', fgHex: '#4f7a4a' },
        { token: '--person-6', hex: '#d9e4f2', fgHex: '#4a6da6' },
        { token: '--person-7', hex: '#fce8dc', fgHex: '#b05c3a' },
        { token: '--person-8', hex: '#e8f0c0', fgHex: '#5e7018' },
      ],
    },
  ];

  displaySizes = [
    { token: '--fs-display-xl', size: '33px', tracking: '-0.8px' },
    { token: '--fs-display-lg', size: '30px', tracking: '-0.7px' },
    { token: '--fs-display-md', size: '27px', tracking: '-0.4px' },
    { token: '--fs-display-sm', size: '24px', tracking: '-0.3px' },
    { token: '--fs-display-xs', size: '21px', tracking: '-0.2px' },
    { token: '--fs-display-2xs', size: '20px', tracking: '-0.2px' },
    { token: '--fs-display-3xs', size: '19px', tracking: '-0.2px' },
  ];

  bodySizes = [
    { token: '--fs-body-lg', size: '16px' },
    { token: '--fs-body', size: '15px' },
    { token: '--fs-body-sm', size: '14.5px' },
    { token: '--fs-body-xs', size: '14px' },
    { token: '--fs-ui', size: '13.5px' },
    { token: '--fs-ui-sm', size: '13px' },
    { token: '--fs-caption', size: '12.5px' },
    { token: '--fs-caption-sm', size: '12px' },
    { token: '--fs-micro', size: '11.5px' },
    { token: '--fs-micro-sm', size: '11px' },
    { token: '--fs-tiny', size: '10.5px' },
  ];

  radiusScale = [
    { token: '--radius-xs', value: '9px' },
    { token: '--radius-sm', value: '12px' },
    { token: '--radius-md', value: '14px' },
    { token: '--radius-lg', value: '16px' },
    { token: '--radius-xl', value: '18px' },
    { token: '--radius-2xl', value: '20px' },
    { token: '--radius-3xl', value: '22px' },
    { token: '--radius-4xl', value: '26px' },
    { token: '--radius-pill', value: '999px' },
    { token: '--radius-circle', value: '50%' },
  ];

  shadowTokens = [
    { token: '--shadow-card-soft', shadow: 'var(--shadow-card-soft)', label: 'card-soft' },
    { token: '--shadow-overlay', shadow: 'var(--shadow-overlay)', label: 'overlay' },
    { token: '--shadow-sheet', shadow: 'var(--shadow-sheet)', label: 'sheet' },
    { token: '--shadow-fab', shadow: 'var(--shadow-fab)', label: 'fab' },
    { token: '--shadow-accent-btn', shadow: 'var(--shadow-accent-btn)', label: 'accent-btn' },
  ];

  spacingScale = [
    { token: '--space-1', px: 2 }, { token: '--space-2', px: 4 },
    { token: '--space-3', px: 6 }, { token: '--space-4', px: 8 },
    { token: '--space-5', px: 10 }, { token: '--space-6', px: 12 },
    { token: '--space-7', px: 14 }, { token: '--space-8', px: 16 },
    { token: '--space-9', px: 18 }, { token: '--space-10', px: 20 },
    { token: '--space-12', px: 24 }, { token: '--space-16', px: 32 },
    { token: '--space-20', px: 40 }, { token: '--space-24', px: 48 },
  ];
}
