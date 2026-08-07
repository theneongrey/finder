import { SharedWith, VisibilityType } from './poll-detail.model';
import { PollRole } from './poll-role.enum';

export interface PollOverview {
  id: string;
  name: string;
  description: string;
  polls: {
    id: string;
    name: string;
  }[];
  pollCount: number;
  creator: string;
  lastUpdated: string;
  visibilityType: VisibilityType;
  sharedWith: SharedWith[];
  role: PollRole;
}
