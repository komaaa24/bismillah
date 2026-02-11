import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentLinkController } from './payment-link.controller';
import { DonationsController } from './donations.controller';
import { PlanEntity, TransactionEntity, UserEntity } from '../../shared/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, PlanEntity, TransactionEntity])],
  controllers: [PaymentLinkController, DonationsController],
})
export class PaymentLinkModule {}
