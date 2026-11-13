import { User } from './user.entity';
import { Role } from './role.entity';
export declare class UserRole {
    id: number;
    user_id: number;
    role_id: number;
    user: User;
    role: Role;
}
