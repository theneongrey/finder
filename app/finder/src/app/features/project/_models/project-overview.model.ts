import { ProjectRole } from './project-role.enum';

export interface ProjectOverview {
  id: string;
  name: string;
  topicCount: number;
  creator: string;
  role: ProjectRole;
}
