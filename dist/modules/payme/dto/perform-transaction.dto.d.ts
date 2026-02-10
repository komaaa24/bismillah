import { TransactionMethods } from '../constants/transaction-methods';
export declare class PerformTransactionDto {
    method: TransactionMethods;
    params: {
        id: string;
    };
}
