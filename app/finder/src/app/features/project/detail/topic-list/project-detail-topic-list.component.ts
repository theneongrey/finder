import { Component, input } from '@angular/core';
import { Button } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { Topic } from '../../_models/project-detail.model';

@Component({
  selector: 'app-project-detail-topic-list',
  imports: [Button, FormsModule],
  templateUrl: './project-detail-topic-list.component.html',
  styleUrl: './project-detail-topic-list.component.css',
})
export class ProjectDetailTopicListComponent {
  topics = input.required<Topic[]>();
}
