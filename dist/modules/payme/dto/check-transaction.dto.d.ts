import { TransactionMethods } from '../constants/transaction-methods';
export declare class CheckTransactionDto {
    method: TransactionMethods;
    params: {
        id: string;
    };
}
