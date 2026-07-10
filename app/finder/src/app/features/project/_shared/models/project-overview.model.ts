import { SharedWith, VisibilityType } from './project-detail.model';

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
}
