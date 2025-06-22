import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-project-vote',
  templateUrl: './project-vote.component.html',
  styleUrl: './project-vote.component.css',
  imports: [Button, Card],
})
export class ProjectVoteComponent implements OnInit {
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);

  id = input('');
  topicId = input('');
  action = input('');
  optionId = input('');
  project = this.projectStore.currentProject;
  topic = computed(() =>
    this.project()?.topics.find((t) => t.id === this.topicId()),
  );
  option = computed(() =>
    this.topic()?.options.find((o) => o.id === this.optionId()),
  );

  constructor() {
    effect(() => {
      this.projectStore.getProject(this.id());
    });
  }

  ngOnInit(): void {
    if (!this.optionId()) {
      if (this.id() && this.topic()) {
        void this.router.navigate([
          '/project/detail/',
          this.id(),
          'vote',
          this.topicId()!,
          this.topic()!.options[0].id,
        ]);
      } else {
        void this.router.navigate(['/project']);
      }
    }
  }

  voteYes() {}

  voteNo() {}
}
