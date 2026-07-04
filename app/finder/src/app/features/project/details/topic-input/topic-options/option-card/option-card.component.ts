import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  ViewChild,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  AfterViewInit,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionEntry } from '../topic-options.component';
import { SideColorCardComponent } from '../../../../../../common/ui/components/side-color-card/side-color-card.component';
import { UrlValidationService } from '../../../../../../common/utils/url-validation.service';

@Component({
  selector: 'app-option-card',
  templateUrl: './option-card.component.html',
  styleUrl: './option-card.component.css',
  imports: [
    FormsModule,
    InputText,
    Button,
    Message,
    SideColorCardComponent,
    TranslatePipe,
  ],
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

  @ViewChild('descriptionInput')
  private descriptionInput?: ElementRef<HTMLInputElement>;
  @ViewChild('linkInput') private linkInput?: ElementRef<HTMLInputElement>;

  private injector = inject(Injector);
  private urlValidation = inject(UrlValidationService);

  constructor() {
    effect(() => {
      const option = this.option();
      if (option) {
        this.showDescription.set(!!option.description);
        this.showLink.set(!!option.meta?.url);
      }
    });
  }

  toggleDescription() {
    this.showDescription.set(true);
    afterNextRender(() => this.descriptionInput?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  toggleLink() {
    if (!this.option().meta) {
      this.option().meta = { url: '' };
    }
    this.showLink.set(true);
    afterNextRender(() => this.linkInput?.nativeElement.focus(), {
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
      if (this.linkInput) {
        this.linkInput.nativeElement.value = normalized;
      }
    }
  }
}
