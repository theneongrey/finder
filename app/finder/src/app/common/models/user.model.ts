export type UserRole = 'Admin' | 'Free' | 'Upgraded';

export interface User {
    email: string;
    name: string | undefined;
    role: UserRole;
    isAuthenticated: boolean;
    language: string;
}
