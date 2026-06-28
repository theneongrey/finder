import { OptionType } from '../_models/project-detail.model';

export interface TopicItem {
  topicId: string;
  projectId: string;
  name: string;
  description: string;
  optionType: OptionType;
  optionCount: number;
  commentCount: number;
  nextOpenOptionId?: string;
}
