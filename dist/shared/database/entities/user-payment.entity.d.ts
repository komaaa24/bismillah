import { PaymentStatus } from './enums';
export declare class UserPaymentEntity {
    id: string;
    userId: string;
    planId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId?: string;
    status: PaymentStatus;
    paymentDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
