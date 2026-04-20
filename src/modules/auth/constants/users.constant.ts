import { UserRole } from '../../../common/enums/user-role.enum';

export interface PredefinedUser {
    id: number;
    username: string;
    passwordHash: string;
    role: UserRole;
}

export const PREDEFINED_USERS: ReadonlyArray<PredefinedUser> = [
    {
        id: 1,
        username: 'admin',
        passwordHash: '$2b$10$WfFPuDf2mZWSBl2r/iB3SOfhWleahyw9FA59Z9.hE6jmuVuPu2uYm',
        role: UserRole.ADMIN,
    },
    {
        id: 2,
        username: 'normal',
        passwordHash: '$2b$10$ICxuVm8VFGoDM/i.dl3WLu..TWXERFalYtl0mYs4OvpOWcvyoEr2u',
        role: UserRole.NORMAL,
    },
    {
        id: 3,
        username: 'limited',
        passwordHash: '$2b$10$NR5QyEn9HUZjbUXEO2Pix.sX2Bvscb9/EoPdsv5f/b2ihotTQuLkG',
        role: UserRole.LIMITED,
    },
];