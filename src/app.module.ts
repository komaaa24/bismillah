import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymeModule } from './modules/payme/payme.module';
import { dataSourceOptions } from './shared/database/typeorm.config';
import { PaymentLinkModule } from './modules/payment-link/payment-link.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot(dataSourceOptions),
    PaymeModule,
    PaymentLinkModule,
  ],
})
export class AppModule {}
