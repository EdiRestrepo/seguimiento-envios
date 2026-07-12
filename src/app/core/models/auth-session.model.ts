import { User } from './user.model';

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: string;
}
