import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PlanEntity, UserEntity } from '../../shared/database/entities';
export declare class PaymentLinkController {
    private readonly configService;
    private readonly userRepository;
    private readonly planRepository;
    constructor(configService: ConfigService, userRepository: Repository<UserEntity>, planRepository: Repository<PlanEntity>);
    redirectToPayme(amount: string, userId: string | undefined, planId: string | undefined, donationId: string | undefined, returnUrl: string | undefined, redirect: string | undefined, res: Response): void | Response<any, Record<string, any>>;
    subscription(query: Record<string, string | undefined>, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
