import { PaymentProvider, PaymentType, TransactionStatus } from './enums';
export declare class TransactionEntity {
    id: string;
    provider: PaymentProvider;
    paymentType: PaymentType;
    transId?: string;
    amount: number;
    donationId?: string;
    performTime?: Date;
    cancelTime?: Date;
    reason?: number;
    state?: number;
    status: TransactionStatus;
    userId: string;
    planId: string;
    createdAt: Date;
    updatedAt: Date;
}
