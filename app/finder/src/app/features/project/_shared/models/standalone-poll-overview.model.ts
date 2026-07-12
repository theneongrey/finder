import { SharedWith, VisibilityType } from './project-detail.model';
import { ProjectRole } from './project-role.enum';

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
  role: ProjectRole;
}
