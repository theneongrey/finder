import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionEntry } from '../poll-options.component';
import { UrlValidationService } from '../../../../../../../common/utils/url-validation.service';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { PreviewData, PreviewService } from '../../../../data/preview.service';

@Component({
  selector: 'app-option-card',
  templateUrl: './option-card.component.html',
  styleUrl: './option-card.component.css',
  imports: [FormsModule, HlmInput, ...HlmAlertImports, Button, TranslatePipe, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardComponent {
  option = input.required<OptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  remove = output<void>();

  showDescription = signal(false);
  showLink = signal(false);
  urlError = signal(false);
  previewLoading = signal(false);
  previewData = signal<PreviewData | undefined>(undefined);

  private descriptionInput =
    viewChild.required<ElementRef<HTMLInputElement>>('descriptionInput');
  private linkInput =
    viewChild.required<ElementRef<HTMLInputElement>>('linkInput');
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
    afterNextRender(() => this.descriptionInput().nativeElement.focus(), {
      injector: this.injector,
    });
  }

  toggleLink() {
    if (!this.option().meta) {
      this.option().meta = { url: '' };
    }
    this.showLink.set(true);
    afterNextRender(() => this.linkInput().nativeElement.focus(), {
      injector: this.injector,
    });
  }

  onDescriptionBlur() {
    if (!this.option().description) {
      this.showDescription.set(false);
    }
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
      this.linkInput().nativeElement.value = normalized;
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
