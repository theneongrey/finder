import { ProjectRole } from './project-role.enum';

export enum OptionType {
  YesNo,
  Rating,
  Date,
}

export interface Option {
  id: string;
  text: string;
  votes: number;
  choice: string;
}

export interface Topic {
  id: string;
  name: string;
  optionType: OptionType;
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
