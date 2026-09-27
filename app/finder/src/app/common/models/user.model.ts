export type UserRole = 'Admin' | 'Free' | 'Upgraded';

export interface User {
    id: string | undefined;
    email: string;
    name: string | undefined;
    role: UserRole;
    isAuthenticated: boolean;
    language: string;
}
