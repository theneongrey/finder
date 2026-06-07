import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TitleService } from '../../../common/services/title.service';
import { RoutingService } from '../../../common/services/routing.service';

interface Comment {
  author: string;
  initials: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-votes-overview',
  templateUrl: './votes-overview.component.html',
  styleUrl: './votes-overview.component.css',
  imports: [RouterLink, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotesOverviewComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly routingService = inject(RoutingService);

  currentUrl = this.routingService.currentUrl();

  id = input('');
  topicId = input('');

  project = this.projectStore.currentProject;

  topic = computed(() =>
    this.project()?.topics.find((t) => t.id === this.topicId()),
  );

  sortedOptions = computed(() => {
    const options = this.topic()?.options ?? [];
    return [...options].sort((a, b) => b.votes - a.votes);
  });

  votedCount = computed(
    () => this.topic()?.options.filter((o) => o.choice).length ?? 0,
  );

  totalCount = computed(() => this.topic()?.options.length ?? 0);

  progressPercent = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.votedCount() / total) * 100) : 0;
  });

  comments: Comment[] = [
    {
      author: 'Bob',
      initials: 'B',
      text: 'The color really matches our living room!',
      time: '2h ago',
    },
    {
      author: 'Mike',
      initials: 'M',
      text: 'Looks very comfortable.',
      time: '10min ago',
    },
    {
      author: 'Anna',
      initials: 'A',
      text: 'Might be too delicate for everyday use.',
      time: 'Yesterday',
    },
  ];

  constructor() {
    const titleService = inject(TitleService);

    effect(() => {
      this.projectStore.getProject(this.id());
    });

    effect(() => {
      const topic = this.topic();
      if (topic) {
        titleService.setBackroute('/project/detail/' + this.id());
        titleService.setTitle('Voting overview');
      }
    });
  }

  voteIcon(choice: string): string {
    if (choice === '1') {
      return 'pi-check-circle';
    }
    if (choice === '2') {
      return 'pi-times-circle';
    }
    return 'pi-question-circle';
  }

  voteLabel(choice: string): string {
    if (choice === '1') {
      return 'Yes';
    }
    if (choice === '2') {
      return 'No';
    }
    return 'Open';
  }

  voteColorClass(choice: string): string {
    if (choice === '1') {
      return 'tw:text-green-600';
    }
    if (choice === '2') {
      return 'tw:text-red-600';
    }
    return 'tw:text-gray-400';
  }
}
