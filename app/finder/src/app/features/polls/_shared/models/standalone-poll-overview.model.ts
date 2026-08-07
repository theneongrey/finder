import { SharedWith, VisibilityType } from './poll-detail.model';
import { PollRole } from './poll-role.enum';

export interface StandalonePollOverview {
  projectId: string;
  pollId: string;
  name: string;
  description: string;
  optionType: number;
  optionCount: number;
  commentCount: number;
  lastUpdated: string;
  nextOpenOptionId?: string;
  visibilityType: VisibilityType;
  sharedWith: SharedWith[];
  role: PollRole;
}
