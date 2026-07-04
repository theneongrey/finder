import { OptionType } from '../_models/project-detail.model';

export interface PollItem {
  pollId: string;
  projectId: string;
  name: string;
  description: string;
  optionType: OptionType;
  optionCount: number;
  commentCount: number;
  nextOpenOptionId?: string;
}
