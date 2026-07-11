import { SharedWith, VisibilityType } from './project-detail.model';
import { ProjectRole } from './project-role.enum';

export interface ProjectOverview {
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
  role: ProjectRole;
}
