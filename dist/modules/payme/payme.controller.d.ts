import { PaymeService } from './payme.service';
import { RequestBody } from './types/incoming-request-body';
export declare class PaymeController {
    private readonly paymeService;
    constructor(paymeService: PaymeService);
    handle(body: RequestBody): Promise<{
        result: any;
        error: any;
        jsonrpc: string;
        id: any;
    } | {
        result: never;
        jsonrpc: string;
        id: any;
    }>;
}
