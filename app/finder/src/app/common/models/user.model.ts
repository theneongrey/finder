export type UserRole = 'Admin' | 'Free' | 'Upgraded';

export interface User {
  email: string;
  name: string;
  role: UserRole;
  isAuthenticated: boolean;
}
