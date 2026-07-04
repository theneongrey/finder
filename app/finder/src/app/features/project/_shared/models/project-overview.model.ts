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
}
