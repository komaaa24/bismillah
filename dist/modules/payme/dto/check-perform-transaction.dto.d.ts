import { TransactionMethods } from '../constants/transaction-methods';
export declare class CheckPerformTransactionDto {
    method: TransactionMethods;
    params: {
        amount: number | string;
        account: {
            user_id?: string;
            plan_id?: string;
            donation_id?: string;
            selected_service?: string;
        };
    };
}
