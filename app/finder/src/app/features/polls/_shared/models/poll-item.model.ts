import { OptionType } from './poll-detail.model';
import { PollRole } from './poll-role.enum';

export interface PollItem {
  pollId: string;
  projectId: string;
  name: string;
  description: string;
  optionType: OptionType;
  optionCount: number;
  commentCount: number;
  nextOpenOptionId?: string;
  role: PollRole;
}
