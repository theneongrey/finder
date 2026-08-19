import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  effect,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionEntry } from '../poll-options.component';
import { UrlValidationService } from '../../../../../../../common/utils/url-validation.service';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { PreviewData, PreviewService } from '../../../../data/preview.service';

@Component({
  selector: 'app-option-card',
  templateUrl: './option-card.component.html',
  styleUrl: './option-card.component.css',
  imports: [FormsModule, DsIconComponent, DsInputComponent, DsButtonComponent, DsCardComponent, DsTextareaComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardComponent {
  option = input.required<OptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  readonly = input<boolean>(false);
  remove = output<void>();

  showDescription = signal(false);
  showLink = signal(false);
  urlError = signal(false);
  previewLoading = signal(false);
  urlLoading = signal(false);
  previewData = signal<PreviewData | undefined>(undefined);
  _linkUrl = signal('');

  private descriptionInput = viewChild.required<DsTextareaComponent>('descriptionInput');
  private linkInput = viewChild.required<DsInputComponent>('linkInput');
  private initialUrl?: string = undefined;

  private injector = inject(Injector);
  private urlValidation = inject(UrlValidationService);
  private previewService = inject(PreviewService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const option = this.option();
      if (option) {
        this.showDescription.set(!!option.description);
        this.showLink.set(!!option.meta?.url);
        this._linkUrl.set(option.meta?.url ?? '');
        if (option.meta?.title) {
          this.previewData.set({
            title: option.meta.title,
            description: option.meta.description ?? '',
            imageUrl: option.meta.imageUrl ?? '',
            siteName: option.meta.siteName ?? '',
          });
          this.initialUrl = option.meta.url;
        }
      }
    });
  }

  toggleDescription() {
    this.showDescription.set(true);
    afterNextRender(() => this.descriptionInput().focus(), {
      injector: this.injector,
    });
  }

  toggleLink() {
    if (!this.option().meta) {
      this.option().meta = { url: '' };
    }
    this._linkUrl.set(this.option().meta!.url);
    this.showLink.set(true);
    afterNextRender(() => this.linkInput().focus(), {
      injector: this.injector,
    });
  }

  onLinkUrlChange(value: string) {
    if (!this.option().meta) { this.option().meta = { url: '' }; }
    this.option().meta!.url = value;
    this._linkUrl.set(value);
  }

  onDescriptionBlur() {
    if (!this.option().description) {
      this.showDescription.set(false);
    }
  }

  onTitleBlur() {
    const text = this.option().text.trim();
    if (!text || !this.urlValidation.isValid(text) || this.urlLoading()) { return; }

    this.urlLoading.set(true);
    const normalized = this.urlValidation.normalize(text);

    this.previewService
      .getPreview(normalized)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          const entry = this.option();
          if (preview.title) { entry.text = preview.title; }
          if (preview.description && !entry.description) {
            entry.description = preview.description;
            this.showDescription.set(true);
          }
          if (!entry.meta) {
            entry.meta = { url: normalized };
          }
          entry.meta = { url: normalized, ...preview };
          this._linkUrl.set(normalized);
          this.previewData.set(preview);
          this.showLink.set(true);
          this.initialUrl = normalized;
          this.urlLoading.set(false);
        },
        error: () => {
          this.urlLoading.set(false);
        },
      });
  }

  onUrlBlur() {
    const url = this.option().meta?.url;
    if (!url) {
      this.showLink.set(false);
      this.urlError.set(false);
      this.previewData.set(undefined);
      return;
    }
    if (!this.urlValidation.isValid(url)) {
      this.urlError.set(true);
      return;
    }

    this.urlError.set(false);
    const normalized = this.urlValidation.normalize(url);
    if (normalized !== url) {
      this.option().meta!.url = normalized;
      this._linkUrl.set(normalized);
    }

    if (normalized === this.initialUrl) {
      return;
    }

    this.previewLoading.set(true);
    this.previewService
      .getPreview(normalized)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          if (preview.imageUrl) {
            const entry = this.option();
            entry.meta = { url: entry.meta!.url, ...preview };
            this.previewData.set(preview);
            this.previewLoading.set(false);

            if (!this.option().text) {
              this.option().text = preview.title ?? '';
            }
            this.initialUrl = normalized;
          }
        },
        error: () => {
          this.previewLoading.set(false);
        },
      });
  }
}
