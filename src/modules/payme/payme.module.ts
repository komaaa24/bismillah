import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymeController } from './payme.controller';
import { PaymeService } from './payme.service';
import { UserEntity, PlanEntity, TransactionEntity, UserPaymentEntity } from '../../shared/database/entities';
import { PaymeBasicAuthGuard } from './auth/guards/payme.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, PlanEntity, TransactionEntity, UserPaymentEntity])],
  controllers: [PaymeController],
  providers: [PaymeService, PaymeBasicAuthGuard],
})
export class PaymeModule {}
