import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentLinkController } from './payment-link.controller';
import { PlanEntity, UserEntity } from '../../shared/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, PlanEntity])],
  controllers: [PaymentLinkController],
})
export class PaymentLinkModule {}
