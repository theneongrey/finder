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
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionEntry } from '../topic-options-yes-no.component';
import { SideColorCardComponent } from '../../../../../../common/ui/components/side-color-card/side-color-card.component';

@Component({
  selector: 'app-option-card',
  templateUrl: './option-card.component.html',
  styleUrl: './option-card.component.css',
  imports: [
    FormsModule,
    InputText,
    Button,
    SideColorCardComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardComponent implements OnInit {
  option = input.required<OptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  remove = output<void>();

  showDescription = signal(false);
  showLink = signal(false);

  @ViewChild('descriptionInput')
  private descriptionInput?: ElementRef<HTMLInputElement>;
  @ViewChild('linkInput') private linkInput?: ElementRef<HTMLInputElement>;

  private injector = inject(Injector);

  ngOnInit() {
    this.showDescription.set(!!this.option().description);
    this.showLink.set(!!this.option().url);
  }

  toggleDescription() {
    this.showDescription.set(true);
    afterNextRender(() => this.descriptionInput?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  toggleLink() {
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
    if (!this.option().url) {
      this.showLink.set(false);
    }
  }
}
