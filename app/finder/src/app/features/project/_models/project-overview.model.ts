export interface ProjectOverview {
  id: string;
  name: string;
  topics: {
    id: string;
    name: string;
  }[];
  topicCount: number;
  creator: string;
  lastUpdated: string;
}
