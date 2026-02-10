import { TransactionMethods } from '../constants/transaction-methods';
export declare class CreateTransactionDto {
    method: TransactionMethods;
    params: {
        id: string;
        time: number;
        amount: number | string;
        account: {
            user_id?: string;
            plan_id?: string;
            donation_id?: string;
            selected_service?: string;
        };
    };
}
