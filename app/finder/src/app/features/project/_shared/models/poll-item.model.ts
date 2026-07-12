import { OptionType } from './project-detail.model';
import { ProjectRole } from './project-role.enum';

export interface PollItem {
  pollId: string;
  projectId: string;
  name: string;
  description: string;
  optionType: OptionType;
  optionCount: number;
  commentCount: number;
  nextOpenOptionId?: string;
  role: ProjectRole;
}
