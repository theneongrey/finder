import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { InputOtp } from 'primeng/inputotp';
import { HlmInput } from '@spartan-ng/helm/input';
import { Panel } from 'primeng/panel';
import { Popover } from 'primeng/popover';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { AddCardComponent } from '../../common/ui/components/add-card/add-card.component';
import { AutoResizeTextareaComponent } from '../../common/ui/components/auto-resize-textarea/auto-resize-textarea.component';
import { ShareDrawerComponent } from '../../common/ui/components/share-drawer/share-drawer.component';
import { SharingStore } from '../project/_shared/data/sharing.store';
import { VisibilityType } from '../project/_shared/models/project-detail.model';

const mockSharingStore = {
  sharingContactsSuggestion: signal([]),
  sharingInProgress: signal(false),
  loadContacts: () => {},
  share: () => {},
  removePermission: () => {},
  updateVisibilityType: () => {},
  navigateToSharedProject: () => {},
} as unknown as InstanceType<typeof SharingStore>;

@Component({
  selector: 'app-design-system',
  imports: [
    NgClass,
    FormsModule,
    Button,
    Card,
    InputOtp,
    HlmInput,
    HlmTextarea,
    Select,
    SelectButton,
    ...HlmTabsImports,
    HlmBadge,
    ...HlmAvatarImports,
    ...HlmAlertImports,
    ...HlmProgressImports,
    ...HlmSpinnerImports,
    ...HlmSkeletonImports,
    Panel,
    HlmSeparator,
    Popover,
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

  colors = [
    { token: '--color-primary', hex: '#4797bf', label: 'Primary' },
    { token: '--color-primary-dark', hex: '#397999', label: 'Primary Dark' },
    { token: '--color-secondary', hex: '#627d8b', label: 'Secondary' },
    { token: '--color-tertiary', hex: '#e8af63', label: 'Tertiary' },
    { token: '--color-error', hex: '#ad3448', label: 'Error' },
    { token: '--color-neutral', hex: '#1a1c1e', label: 'Neutral' },
    {
      token: '--color-on-surface-variant',
      hex: '#404944',
      label: 'On Surface Variant',
    },
  ];

  semanticScale = [
    { step: '50', hex: '#E3F3FF' },
    { step: '100', hex: '#C3E8FF' },
    { step: '200', hex: '#83D0FA' },
    { step: '300', hex: '#67B4DD' },
    { step: '400', hex: '#4999C1' },
    { step: '500', hex: '#297FA6' },
    { step: '600', hex: '#00668A' },
    { step: '700', hex: '#004C68' },
    { step: '800', hex: '#003549' },
    { step: '900', hex: '#001E2C' },
    { step: '950', hex: '#000000' },
  ];

  buttonSeverities: {
    severity:
      | 'primary'
      | 'secondary'
      | 'success'
      | 'danger'
      | 'info'
      | 'contrast';
    label: string;
  }[] = [
    { severity: 'primary', label: 'Primary' },
    { severity: 'secondary', label: 'Secondary' },
    { severity: 'success', label: 'Success' },
    { severity: 'danger', label: 'Danger' },
    { severity: 'info', label: 'Info' },
    { severity: 'contrast', label: 'Contrast' },
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

  inputText = '';
  textareaValue = '';
  autoResizeValue = '';
  otpValue = '';

  faIcons = [
    'fa-solid fa-house',
    'fa-solid fa-user',
    'fa-solid fa-gear',
    'fa-solid fa-magnifying-glass',
    'fa-solid fa-plus',
    'fa-solid fa-xmark',
    'fa-solid fa-check',
    'fa-solid fa-trash',
    'fa-solid fa-pen',
    'fa-solid fa-eye',
    'fa-solid fa-bell',
    'fa-solid fa-envelope',
    'fa-solid fa-calendar',
    'fa-solid fa-clock',
    'fa-solid fa-arrow-left',
    'fa-solid fa-arrow-right',
    'fa-solid fa-chevron-down',
    'fa-solid fa-link',
    'fa-solid fa-share-nodes',
    'fa-solid fa-lock',
    'fa-solid fa-circle-info',
    'fa-solid fa-triangle-exclamation',
    'fa-solid fa-star',
    'fa-solid fa-heart',
    'fa-solid fa-location-dot',
  ];

  suggestions = [
    {
      title: 'Z-index scale',
      body: 'Ad-hoc z-10/20/-10 scattered throughout components. Define semantic named levels: base, dropdown, drawer, modal, toast.',
    },
    {
      title: 'Transition duration tokens',
      body: '150ms / 200ms / 250ms / 300ms are used in multiple places without a shared source of truth. Define --duration-fast, --duration-normal, --duration-slow.',
    },
    {
      title: 'Text color tokens',
      body: 'Only surface/background colors are tokenized. Body text, muted text, and disabled text rely on Tailwind defaults (gray-400, gray-500) without named tokens.',
    },
    {
      title: 'Dark mode',
      body: 'No prefers-color-scheme media query handling exists. All surface and text colors assume a light background.',
    },
    {
      title: 'Responsive breakpoints',
      body: 'Breakpoints are used in a few places but are not documented or tokenized in the design system.',
    },
    {
      title: 'Focus ring token',
      body: 'outline-primary is used for accessibility focus rings but is not a defined CSS custom property.',
    },
    {
      title: 'Semantic status colors',
      body: 'Success and warning colors exist only as PrimeNG severity aliases. No CSS tokens (--color-success, --color-warning) are defined alongside --color-error.',
    },
  ];
}
