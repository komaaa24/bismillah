import { Repository } from 'typeorm';
import { TransactionEntity } from '../../shared/database/entities';
export declare class DonationsController {
    private readonly transactionRepository;
    constructor(transactionRepository: Repository<TransactionEntity>);
    getDonationStatus(donationId: string): Promise<{
        donation_id: string | undefined;
        status: import("../../shared/database/entities").TransactionStatus;
        state: number | null;
        reason: number | null;
        cancelReasonText: import("../payme/constants/canceling-reason-message").CancelReasonText | null;
        amount: number;
        transId: string | null;
        performTime: string | null;
        cancelTime: string | null;
        createdAt: string | null;
        updatedAt: string | null;
    }>;
}
