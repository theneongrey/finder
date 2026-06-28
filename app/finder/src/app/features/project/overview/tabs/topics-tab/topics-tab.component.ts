import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectStore } from '../../../_data/project.store';
import { TopicItemComponent } from '../../../topic-item/topic-item.component';
import { TopicItem } from '../../../topic-item/topic-item.model';
import { AddCardComponent } from '../../../../../common/ui/components/add-card/add-card.component';
import { OptionType } from '../../../_models/project-detail.model';

@Component({
  selector: 'app-topics-tab',
  imports: [TranslatePipe, TopicItemComponent, AddCardComponent],
  templateUrl: './topics-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicsTabComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);

  deletionRequested = output<TopicItem>();

  standaloneTopics = computed(() =>
    this.projectStore.standaloneTopics().map((t) => ({
      ...t,
      optionType: t.optionType as OptionType,
    })),
  );

  navigateToAdd() {
    this.router.navigate(['/project/add-standalone']);
  }
}
