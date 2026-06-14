import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InputGroup } from 'primeng/inputgroup';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';

export interface Comment {
  author: string;
  initials: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-comments-section',
  templateUrl: './comments-section.component.html',
  styleUrl: './comments-section.component.css',
  imports: [InputGroup, InputText, Button, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsSectionComponent {
  comments = input<Comment[]>([]);
}
