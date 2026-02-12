import { Repository } from 'typeorm';
import { CheckPerformTransactionDto } from './dto/check-perform-transaction.dto';
import { RequestBody } from './types/incoming-request-body';
import { GetStatementDto } from './dto/get-statement.dto';
import { CancelTransactionDto } from './dto/cancel-transaction.dto';
import { PerformTransactionDto } from './dto/perform-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { PlanEntity, TransactionEntity, UserEntity, UserPaymentEntity } from '../../shared/database/entities';
export declare class PaymeService {
    private readonly userRepository;
    private readonly planRepository;
    private readonly transactionRepository;
    private readonly userPaymentRepository;
    constructor(userRepository: Repository<UserEntity>, planRepository: Repository<PlanEntity>, transactionRepository: Repository<TransactionEntity>, userPaymentRepository: Repository<UserPaymentEntity>);
    handleTransactionMethods(reqBody: RequestBody): Promise<{
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
    } | {
        result: {
            allow: boolean;
        };
        error?: undefined;
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
    } | {
        result: {
            transaction: string;
            state: number;
            create_time: number;
        };
        error?: undefined;
        id?: undefined;
    } | {
        result: {
            state: number | undefined;
            transaction: string;
            perform_time: number | null;
        };
        error?: undefined;
        id?: undefined;
    } | {
        result: {
            transaction: string | undefined;
            perform_time: number;
            state: number;
        };
        error?: undefined;
        id?: undefined;
    } | {
        result: {
            cancel_time: number | undefined;
            transaction: string | undefined;
            state: number;
        };
        id?: undefined;
        error?: undefined;
    } | {
        result: {
            state: number | undefined;
            transaction: string;
            cancel_time: number | undefined;
        };
        id?: undefined;
        error?: undefined;
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
    }>;
    checkPerformTransaction(dto: CheckPerformTransactionDto): Promise<{
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
    } | {
        result: {
            allow: boolean;
        };
        error?: undefined;
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
    }>;
    createTransaction(dto: CreateTransactionDto): Promise<{
        error: {
            name: string;
            code: number;
            message: {
                uz: string;
                ru: string;
                en: string;
            };
        };
        id: string;
        result?: undefined;
    } | {
        result: {
            transaction: string;
            state: number;
            create_time: number;
        };
        error?: undefined;
        id?: undefined;
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
        id: string;
        result?: undefined;
    }>;
    performTransaction(dto: PerformTransactionDto): Promise<{
        error: {
            name: string;
            code: number;
            message: {
                uz: string;
                ru: string;
                en: string;
            };
        };
        id: string;
        result?: undefined;
    } | {
        result: {
            state: number | undefined;
            transaction: string;
            perform_time: number | null;
        };
        error?: undefined;
        id?: undefined;
    } | {
        error: {
            name: string;
            code: number;
            message: {
                uz: string;
                ru: string;
                en: string;
            };
            state: number;
            reason: number;
        };
        id: string;
        result?: undefined;
    } | {
        result: {
            transaction: string | undefined;
            perform_time: number;
            state: number;
        };
        error?: undefined;
        id?: undefined;
    }>;
    cancelTransaction(dto: CancelTransactionDto): Promise<{
        id: string;
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
    } | {
        result: {
            cancel_time: number | undefined;
            transaction: string | undefined;
            state: number;
        };
        id?: undefined;
        error?: undefined;
    } | {
        result: {
            state: number | undefined;
            transaction: string;
            cancel_time: number | undefined;
        };
        id?: undefined;
        error?: undefined;
    }>;
    checkTransaction(dto: CheckTransactionDto): Promise<{
        error: {
            name: string;
            code: number;
            message: {
                uz: string;
                ru: string;
                en: string;
            };
        };
        id: string;
        result?: undefined;
    } | {
        result: {
            create_time: number;
            perform_time: number;
            cancel_time: number;
            transaction: string;
            state: number | undefined;
            reason: number | null;
        };
        error?: undefined;
        id?: undefined;
    }>;
    getStatement(dto: GetStatementDto): Promise<{
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
    }>;
    private normalizeAmount;
    private toEpochMs;
    private isExpired;
}
