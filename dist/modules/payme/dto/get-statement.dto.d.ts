import { TransactionMethods } from '../constants/transaction-methods';
export declare class GetStatementDto {
    method: TransactionMethods;
    params: {
        from: number;
        to: number;
    };
}
