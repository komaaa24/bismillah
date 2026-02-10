import { PaymeService } from './payme.service';
import { RequestBody } from './types/incoming-request-body';
export declare class PaymeController {
    private readonly paymeService;
    constructor(paymeService: PaymeService);
    handle(body: RequestBody): Promise<{
        error: {
            name: string;
            code: number;
            message: {
                uz: string;
                ru: string;
                en: string;
            };
        };
        result?: undefined;
        jsonrpc: string;
        id: any;
    } | {
        result: {
            allow: boolean;
        };
        error?: undefined;
        jsonrpc: string;
        id: any;
    } | {
        error: {
            code: number;
            message: {
                uz: string;
                en: string;
                ru: string;
            };
            data: null;
        };
        result?: undefined;
        jsonrpc: string;
        id: any;
    } | {
        error: {
            code: number;
            message: {
                uz: string;
                en: string;
                ru: string;
            };
            data: string;
        };
        result?: undefined;
        jsonrpc: string;
        id: any;
    } | {
        result: {
            transaction: string;
            state: number;
            create_time: number;
        };
        error?: undefined;
        id: any;
        jsonrpc: string;
    } | {
        result: {
            state: number | undefined;
            transaction: string;
            perform_time: number | null;
        };
        error?: undefined;
        id: any;
        jsonrpc: string;
    } | {
        result: {
            transaction: string | undefined;
            perform_time: number;
            state: number;
        };
        error?: undefined;
        id: any;
        jsonrpc: string;
    } | {
        result: {
            cancel_time: number | undefined;
            transaction: string | undefined;
            state: number;
        };
        id: any;
        error?: undefined;
        jsonrpc: string;
    } | {
        result: {
            state: number | undefined;
            transaction: string;
            cancel_time: number | undefined;
        };
        id: any;
        error?: undefined;
        jsonrpc: string;
    } | {
        result: {
            transactions: {
                id: string | undefined;
                time: number;
                amount: number;
                account: {
                    user_id: string;
                    plan_id: string;
                    donation_id: string;
                } | {
                    user_id: string;
                    plan_id: string;
                    donation_id?: undefined;
                };
                create_time: number;
                perform_time: number;
                cancel_time: number | null;
                transaction: string;
                state: number | undefined;
                reason: number | null;
            }[];
        };
        jsonrpc: string;
        id: any;
    }>;
}
