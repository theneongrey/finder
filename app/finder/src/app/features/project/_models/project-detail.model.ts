import { ProjectRole } from './project-role.enum';

export enum OptionType {
  YesNo = 0,
  Rating = 1,
}

export interface Option {
  id: string;
  text: string;
  optionType: OptionType;
  votes: number;
  choice: string;
}

export type TopicType = 'selection' | 'appointment' | 'rating';

export interface Topic {
  id: string;
  name: string;
  type: TopicType;
  options: Option[];
}

export interface SharedWith {
  name: string;
  role: ProjectRole;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
  creator: string;
  role: ProjectRole;
  sharedWith: SharedWith[];
}
