import { UserRole } from '../enums/user-role.enum';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}