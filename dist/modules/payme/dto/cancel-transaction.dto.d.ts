import { TransactionMethods } from '../constants/transaction-methods';
export declare class CancelTransactionDto {
    method: TransactionMethods;
    params: {
        id: string;
        reason: number;
    };
}
