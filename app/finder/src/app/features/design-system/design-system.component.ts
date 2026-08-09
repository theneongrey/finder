import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmInputOtpImports } from '@spartan-ng/helm/input-otp';
import { BrnInputOtp } from '@spartan-ng/brain/input-otp';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { AddCardComponent } from '../../common/ui/components/add-card/add-card.component';
import { AutoResizeTextareaComponent } from '../../common/ui/components/auto-resize-textarea/auto-resize-textarea.component';
import { ShareDrawerComponent } from '../../common/ui/components/share-drawer/share-drawer.component';
import { SharingStore } from '../polls/_shared/data/sharing.store';
import { VisibilityType } from '../polls/_shared/models/poll-detail.model';

const mockSharingStore = {
  sharingContactsSuggestion: signal([]),
  sharingInProgress: signal(false),
  loadContacts: () => { /* noop */ },
  share: () => { /* noop */ },
  removePermission: () => { /* noop */ },
  updateVisibilityType: () => { /* noop */ },
  navigateToSharedProject: () => { /* noop */ },
} as unknown as InstanceType<typeof SharingStore>;

@Component({
  selector: 'app-design-system',
  imports: [
    NgClass,
    FormsModule,
    HlmButton,
    ...HlmCardImports,
    BrnInputOtp,
    ...HlmInputOtpImports,
    HlmInput,
    HlmTextarea,
    ...HlmSelectImports,
    ...HlmDatePickerImports,
    ...HlmToggleGroupImports,
    ...HlmTabsImports,
    HlmBadge,
    ...HlmAvatarImports,
    ...HlmAlertImports,
    ...HlmProgressImports,
    ...HlmSpinnerImports,
    ...HlmSkeletonImports,
    HlmSeparator,
    ...HlmPopoverImports,
    AddCardComponent,
    AutoResizeTextareaComponent,
    ShareDrawerComponent,
  ],
  providers: [{ provide: SharingStore, useValue: mockSharingStore }],
  templateUrl: './design-system.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignSystemComponent {
  shareDrawerVisible = signal(false);
  readonly VisibilityType = VisibilityType;

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
        { token: '--teal-900', hex: '#1f7a8c' },
        { token: '--teal-300', hex: '#9fc2cf' },
        { token: '--teal-200', hex: '#cfe6e8' },
        { token: '--teal-150', hex: '#e7f2f3' },
        { token: '--teal-100', hex: '#d7eef0' },
      ],
    },
    {
      label: 'Semantic — Status',
      colors: [
        { token: '--positive / --color-success', hex: '#4f7a4a' },
        { token: '--negative / --color-error', hex: '#c1453f' },
        { token: '--warning / --color-warning', hex: '#a8742a' },
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
    { token: '--fs-display-3xs', size: '19px', tracking: '0' },
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
  ];

  shadowTokens = [
    { token: '--shadow-card-soft', shadow: '0 3px 14px rgba(35,40,45,0.05)', label: 'card-soft' },
    { token: '--shadow-overlay', shadow: '0 10px 30px rgba(30,35,40,0.16)', label: 'overlay' },
    { token: '--shadow-sheet', shadow: '0 -12px 40px rgba(20,24,28,0.22)', label: 'sheet' },
    { token: '--shadow-fab', shadow: '0 1px 4px rgba(20,24,28,0.06)', label: 'fab' },
    { token: '--shadow-accent-btn', shadow: '0 6px 18px rgba(31,122,140,0.28)', label: 'accent-btn' },
  ];

  durationTokens = [
    { token: '--duration-fast', value: '120ms', label: 'Fast' },
    { token: '--duration-standard', value: '180ms', label: 'Standard' },
  ];

  selectOptions = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];
  selectButtonValue = 'day';

  dropdownOptions = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c' },
  ];
  selectedDropdown: string | undefined;
  dropdownOptionToString = (value: string): string =>
    this.dropdownOptions.find((o) => o.value === value)?.label ?? value;

  inputText = '';
  textareaValue = '';
  autoResizeValue = '';
  otpValue = '';
  datePickerValue: Date | undefined = undefined;
  timeInputValue = '';
  loadingButtonDemo = signal(false);
  loadingIconButtonDemo = signal(false);
}
