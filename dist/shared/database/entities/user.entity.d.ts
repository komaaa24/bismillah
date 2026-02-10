import { SubscriptionType } from './enums';
export declare class UserEntity {
    id: string;
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    subscriptionType?: SubscriptionType;
    subscriptionStart?: Date;
    subscriptionEnd?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
