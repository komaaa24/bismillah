import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionMethods } from './constants/transaction-methods';
import { CheckPerformTransactionDto } from './dto/check-perform-transaction.dto';
import { RequestBody } from './types/incoming-request-body';
import { GetStatementDto } from './dto/get-statement.dto';
import { CancelTransactionDto } from './dto/cancel-transaction.dto';
import { PerformTransactionDto } from './dto/perform-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ErrorStatusCodes } from './constants/error-status-codes';
import { TransactionState } from './constants/transaction-state';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { PaymeError } from './constants/payme-error';
import { CancelingReasons } from './constants/canceling-reasons';
import { getCancelReasonText } from './constants/canceling-reason-message';
import logger from '../../shared/utils/logger';
import { ValidationHelper } from '../../shared/utils/validation.helper';
import {
  PlanEntity,
  TransactionEntity,
  UserEntity,
  UserPaymentEntity,
  SubscriptionType,
  PaymentProvider,
  PaymentType,
  TransactionStatus,
  PaymentStatus,
} from '../../shared/database/entities';

function hasActiveSubscription(user?: { isActive?: boolean; subscriptionEnd?: Date | null }): boolean {
  if (!user || !user.isActive || !user.subscriptionEnd) return false;
  const endDate = user.subscriptionEnd instanceof Date ? user.subscriptionEnd : new Date(user.subscriptionEnd);
  return endDate.getTime() > Date.now();
}

// These are placeholders to satisfy NOT NULL constraints in `transactions` table
// when processing donation-only payments.
const DONATION_USER_ID = '00000000-0000-4000-8000-000000000000';
const DONATION_PLAN_ID = '00000000-0000-4000-8000-000000000001';

@Injectable()
export class PaymeService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PlanEntity) private readonly planRepository: Repository<PlanEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    @InjectRepository(UserPaymentEntity)
    private readonly userPaymentRepository: Repository<UserPaymentEntity>,
  ) {}

  async handleTransactionMethods(reqBody: RequestBody) {
    switch (reqBody.method) {
      case TransactionMethods.CheckPerformTransaction:
        return this.checkPerformTransaction(reqBody as CheckPerformTransactionDto);
      case TransactionMethods.CreateTransaction:
        return this.createTransaction(reqBody as CreateTransactionDto);
      case TransactionMethods.CheckTransaction:
        return this.checkTransaction(reqBody as CheckTransactionDto);
      case TransactionMethods.PerformTransaction:
        return this.performTransaction(reqBody as PerformTransactionDto);
      case TransactionMethods.CancelTransaction:
        return this.cancelTransaction(reqBody as CancelTransactionDto);
      case TransactionMethods.GetStatement:
        return this.getStatement(reqBody as GetStatementDto);
      default:
        return { error: PaymeError.CantDoOperation };
    }
  }

  async checkPerformTransaction(dto: CheckPerformTransactionDto) {
    try {
      const planId = dto.params?.account?.plan_id;
      const userId = dto.params?.account?.user_id;
      const donationId = dto.params?.account?.donation_id;
      const selectedService = dto.params?.account?.selected_service;
      logger.info('🔵 CheckPerformTransaction', {
        planId,
        userId,
        donationId,
        selectedService,
        amount: dto.params?.amount,
      });

      // Donation flow:
      // - Either Payme Business requisites only include donation_id (no user_id/plan_id)
      // - Or requisites are locked and require user_id/plan_id: then /pay injects fixed UUIDs
      //   and we treat that combination as donation as well.
      const isLockedDonationAccount = userId === DONATION_USER_ID && planId === DONATION_PLAN_ID;
      const isDonationAccount = (!!donationId && (!userId && !planId)) || (!!donationId && isLockedDonationAccount) || isLockedDonationAccount;

      if (isDonationAccount) {
        const { amountInSom } = this.normalizeAmount(dto.params.amount);
        if (!Number.isFinite(amountInSom) || amountInSom <= 0) {
          return { error: PaymeError.InvalidAmount };
        }

        // If donation_id isn't provided (some locked-requisite setups), we can't de-duplicate reliably.
        if (donationId) {
          const paid = await this.transactionRepository.findOne({
            where: { provider: PaymentProvider.PAYME, donationId, status: TransactionStatus.PAID },
          });
          if (paid) {
            return { error: PaymeError.AlreadyDone };
          }
        }

        return { result: { allow: true } };
      }

      if (!ValidationHelper.isValidObjectId(planId) || !ValidationHelper.isValidObjectId(userId)) {
        return {
          error: {
            code: ErrorStatusCodes.TransactionNotAllowed,
            message: {
              uz: 'Tarif yoki foydalanuvchi topilmadi',
              en: 'Plan or user not found',
              ru: 'Тариф или пользователь не найден',
            },
            data: null,
          },
        };
      }

      const plan = await this.planRepository.findOne({ where: { id: planId } });
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!plan || !user) {
        return { error: PaymeError.ProductNotFound };
      }

      if (hasActiveSubscription(user)) {
        return { error: PaymeError.AlreadyDone };
      }

      const { amountInSom } = this.normalizeAmount(dto.params.amount);
      const planPrice = Number(plan.price);

      if (Number.isNaN(planPrice) || amountInSom !== planPrice) {
        logger.warn('❌ Invalid amount in CheckPerformTransaction', {
          expected: planPrice,
          receivedSom: amountInSom,
          raw: dto.params.amount,
        });
        return { error: PaymeError.InvalidAmount };
      }

      return { result: { allow: true } };
    } catch (error) {
      logger.error('❌ checkPerformTransaction failed', error as any);
      return {
        error: {
          code: ErrorStatusCodes.SystemError,
          message: {
            uz: 'Tizimda xatolik yuz berdi',
            en: 'System error occurred',
            ru: 'Произошла системная ошибка',
          },
          data: (error as Error).message,
        },
      };
    }
  }

  async createTransaction(dto: CreateTransactionDto) {
    const planId = dto.params?.account?.plan_id;
    const userId = dto.params?.account?.user_id;
    const donationId = dto.params?.account?.donation_id;
    const transId = dto.params?.id;

    try {
      logger.info('🔵 CreateTransaction', { planId, userId, donationId, transId });

      // Donation-only flow
      const isLockedDonationAccount = userId === DONATION_USER_ID && planId === DONATION_PLAN_ID;
      const isDonationAccount = (!!donationId && (!userId && !planId)) || (!!donationId && isLockedDonationAccount) || isLockedDonationAccount;

      if (isDonationAccount) {
        const { amountInSom } = this.normalizeAmount(dto.params.amount);
        if (!Number.isFinite(amountInSom) || amountInSom <= 0) {
          return { error: PaymeError.InvalidAmount, id: transId };
        }

        const effectiveDonationId = donationId || transId;

        const alreadyPaid = await this.transactionRepository.findOne({
          where: { provider: PaymentProvider.PAYME, donationId: effectiveDonationId, status: TransactionStatus.PAID },
        });
        if (alreadyPaid) {
          return { error: PaymeError.AlreadyDone, id: transId };
        }

        const pending = await this.transactionRepository.findOne({
          where: { provider: PaymentProvider.PAYME, donationId: effectiveDonationId, status: TransactionStatus.PENDING },
        });
        if (pending) {
          if (this.isExpired(pending.createdAt)) {
            await this.transactionRepository.update(
              { id: pending.id },
              {
                status: TransactionStatus.CANCELED,
                state: TransactionState.PendingCanceled,
                cancelTime: new Date(),
                reason: CancelingReasons.CanceledDueToTimeout,
              },
            );
          } else if (pending.transId === transId) {
            return {
              result: {
                transaction: pending.id,
                state: TransactionState.Pending,
                create_time: new Date(pending.createdAt).getTime(),
              },
            };
          } else {
            return { error: PaymeError.TransactionInProcess, id: transId };
          }
        }

        const existingById = await this.transactionRepository.findOne({ where: { transId } });
        if (existingById) {
          if (this.isExpired(existingById.createdAt)) {
            await this.transactionRepository.update(
              { id: existingById.id },
              {
                status: TransactionStatus.CANCELED,
                state: TransactionState.PendingCanceled,
                cancelTime: new Date(),
                reason: CancelingReasons.CanceledDueToTimeout,
              },
            );
          } else {
            return {
              result: {
                transaction: existingById.id,
                state: TransactionState.Pending,
                create_time: new Date(existingById.createdAt).getTime(),
              },
            };
          }
        }

        const transaction = this.transactionRepository.create({
          transId,
          userId: DONATION_USER_ID,
          planId: DONATION_PLAN_ID,
          donationId: effectiveDonationId,
          amount: amountInSom,
          provider: PaymentProvider.PAYME,
          paymentType: PaymentType.ONETIME,
          status: TransactionStatus.PENDING,
          state: TransactionState.Pending,
        });

        await this.transactionRepository.save(transaction);

        return {
          result: {
            transaction: transaction.id,
            state: TransactionState.Pending,
            create_time: new Date(transaction.createdAt).getTime(),
          },
        };
      }

      if (!ValidationHelper.isValidObjectId(planId) || !ValidationHelper.isValidObjectId(userId)) {
        return { error: PaymeError.ProductNotFound, id: transId };
      }

      const plan = await this.planRepository.findOne({ where: { id: planId } });
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!plan) return { error: PaymeError.ProductNotFound, id: transId };
      if (!user) return { error: PaymeError.UserNotFound, id: transId };

      if (hasActiveSubscription(user)) {
        return { error: PaymeError.AlreadyDone, id: transId };
      }

      const { amountInSom } = this.normalizeAmount(dto.params.amount);
      const planPrice = Number(plan.price);
      if (Number.isNaN(planPrice) || amountInSom !== planPrice) {
        return { error: PaymeError.InvalidAmount, id: transId };
      }

      // Active pending transaction for same user+plan
      const pending = await this.transactionRepository.findOne({
        where: { userId, planId, status: TransactionStatus.PENDING },
      });

      if (pending) {
        if (this.isExpired(pending.createdAt)) {
          await this.transactionRepository.update(
            { id: pending.id },
            {
              status: TransactionStatus.CANCELED,
              state: TransactionState.PendingCanceled,
              cancelTime: new Date(),
              reason: CancelingReasons.CanceledDueToTimeout,
            },
          );
        } else {
          return {
            error: PaymeError.TransactionInProcess,
            id: transId,
          };
        }
      }

      // If same transId already exists
      const existingById = await this.transactionRepository.findOne({ where: { transId } });
      if (existingById) {
        if (this.isExpired(existingById.createdAt)) {
          await this.transactionRepository.update(
            { id: existingById.id },
            {
              status: TransactionStatus.CANCELED,
              state: TransactionState.PendingCanceled,
              cancelTime: new Date(),
              reason: CancelingReasons.CanceledDueToTimeout,
            },
          );
        } else {
          return {
            result: {
              transaction: existingById.id,
              state: TransactionState.Pending,
              create_time: new Date(existingById.createdAt).getTime(),
            },
          };
        }
      }

      const transaction = this.transactionRepository.create({
        transId,
        userId,
        planId,
        amount: amountInSom,
        provider: PaymentProvider.PAYME,
        paymentType: PaymentType.ONETIME,
        status: TransactionStatus.PENDING,
        state: TransactionState.Pending,
      });

      await this.transactionRepository.save(transaction);

      return {
        result: {
          transaction: transaction.id,
          state: TransactionState.Pending,
          create_time: new Date(transaction.createdAt).getTime(),
        },
      };
    } catch (error) {
      logger.error('❌ createTransaction failed', error as any);
      return {
        error: {
          code: ErrorStatusCodes.SystemError,
          message: {
            uz: 'Tizimda xatolik yuz berdi',
            en: 'System error occurred',
            ru: 'Произошла системная ошибка',
          },
          data: (error as Error).message,
        },
        id: transId,
      };
    }
  }

  async performTransaction(dto: PerformTransactionDto) {
    const transId = dto.params.id;
    const transaction = await this.transactionRepository.findOne({ where: { transId } });

    if (!transaction) {
      return { error: PaymeError.TransactionNotFound, id: transId };
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      if (transaction.status !== TransactionStatus.PAID) {
        return { error: PaymeError.CantDoOperation, id: transId };
      }

      return {
        result: {
          state: transaction.state,
          transaction: transaction.id,
          perform_time: transaction.performTime
            ? new Date(transaction.performTime).getTime()
            : null,
        },
      };
    }

    if (this.isExpired(transaction.createdAt)) {
      await this.transactionRepository.update(
        { id: transaction.id },
        {
          status: TransactionStatus.CANCELED,
          state: TransactionState.PendingCanceled,
          cancelTime: new Date(),
          reason: CancelingReasons.CanceledDueToTimeout,
        },
      );

      return {
        error: {
          state: TransactionState.PendingCanceled,
          reason: CancelingReasons.CanceledDueToTimeout,
          ...PaymeError.CantDoOperation,
        },
        id: transId,
      };
    }

    // Donation-only transaction: no subscription activation required
    if (transaction.donationId) {
      const performTime = new Date();
      await this.transactionRepository.update(
        { id: transaction.id },
        {
          status: TransactionStatus.PAID,
          state: TransactionState.Paid,
          performTime,
        },
      );

      const updated = await this.transactionRepository.findOne({ where: { id: transaction.id } });
      return {
        result: {
          transaction: updated?.id,
          perform_time: performTime.getTime(),
          state: TransactionState.Paid,
        },
      };
    }

    const plan = await this.planRepository.findOne({ where: { id: transaction.planId } });
    const user = await this.userRepository.findOne({ where: { id: transaction.userId } });
    if (!plan) return { error: PaymeError.ProductNotFound, id: transId };
    if (!user) return { error: PaymeError.UserNotFound, id: transId };

    const performTime = new Date();

    await this.transactionRepository.update(
      { id: transaction.id },
      {
        status: TransactionStatus.PAID,
        state: TransactionState.Paid,
        performTime,
      },
    );

    // Activate user subscription using plan.duration days
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date(subscriptionStart);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + (plan.duration || 365));

    await this.userRepository.update(
      { id: user.id },
      {
        isActive: true,
        subscriptionType: SubscriptionType.ONETIME,
        subscriptionStart,
        subscriptionEnd,
      },
    );

    await this.userPaymentRepository.save(
      this.userPaymentRepository.create({
        userId: user.id,
        planId: plan.id,
        amount: transaction.amount,
        currency: 'UZS',
        paymentMethod: PaymentProvider.PAYME,
        transactionId: transId,
        status: PaymentStatus.COMPLETED,
        paymentDate: performTime,
      }),
    );

    const updated = await this.transactionRepository.findOne({ where: { id: transaction.id } });

    return {
      result: {
        transaction: updated?.id,
        perform_time: performTime.getTime(),
        state: TransactionState.Paid,
      },
    };
  }

  async cancelTransaction(dto: CancelTransactionDto) {
    const transId = dto.params.id;
    const reason = dto.params.reason;
    const reasonText = getCancelReasonText(reason);
    logger.info('🟠 CancelTransaction received', { transId, reason, reasonText });
    const transaction = await this.transactionRepository.findOne({ where: { transId } });

    if (!transaction) {
      return { id: transId, error: PaymeError.TransactionNotFound };
    }

    if (transaction.status === TransactionStatus.PENDING) {
      await this.transactionRepository.update(
        { id: transaction.id },
        {
          status: TransactionStatus.CANCELED,
          state: TransactionState.PendingCanceled,
          cancelTime: new Date(),
          reason,
        },
      );

      const canceled = await this.transactionRepository.findOne({ where: { id: transaction.id } });
      logger.warn('⚠️ Transaction canceled by CancelTransaction', {
        transId,
        transactionId: canceled?.id,
        donationId: transaction.donationId,
        previousStatus: transaction.status,
        nextStatus: TransactionStatus.CANCELED,
        reason,
        reasonText,
      });
      return {
        result: {
          cancel_time: canceled?.cancelTime?.getTime(),
          transaction: canceled?.id,
          state: TransactionState.PendingCanceled,
        },
      };
    }

    if (transaction.state !== TransactionState.Paid) {
      return {
        result: {
          state: transaction.state,
          transaction: transaction.id,
          cancel_time: transaction.cancelTime?.getTime(),
        },
      };
    }

    await this.transactionRepository.update(
      { id: transaction.id },
      {
        status: TransactionStatus.CANCELED,
        state: TransactionState.PaidCanceled,
        cancelTime: new Date(),
        reason,
      },
    );

    const updated = await this.transactionRepository.findOne({ where: { id: transaction.id } });
    logger.warn('⚠️ Paid transaction canceled by CancelTransaction', {
      transId,
      transactionId: updated?.id,
      donationId: transaction.donationId,
      previousState: transaction.state,
      nextState: TransactionState.PaidCanceled,
      reason,
      reasonText,
    });
    return {
      result: {
        cancel_time: updated?.cancelTime?.getTime(),
        transaction: updated?.id,
        state: TransactionState.PaidCanceled,
      },
    };
  }

  async checkTransaction(dto: CheckTransactionDto) {
    const transId = dto.params.id;
    const transaction = await this.transactionRepository.findOne({ where: { transId } });

    if (!transaction) {
      return { error: PaymeError.TransactionNotFound, id: transId };
    }

    return {
      result: {
        create_time: transaction.createdAt.getTime(),
        perform_time: transaction.performTime ? new Date(transaction.performTime).getTime() : 0,
        cancel_time: transaction.cancelTime ? new Date(transaction.cancelTime).getTime() : 0,
        transaction: transaction.id,
        state: transaction.state,
        reason: transaction.reason ?? null,
      },
    };
  }

  async getStatement(dto: GetStatementDto) {
    const all = await this.transactionRepository.find({ where: { provider: PaymentProvider.PAYME } });
    const from = new Date(dto.params.from);
    const to = new Date(dto.params.to);

    const filtered = all.filter((tx) => {
      const createdAt = new Date(tx.createdAt);
      return createdAt >= from && createdAt <= to;
    });

    return {
      result: {
        transactions: filtered.map((tx) => ({
          id: tx.transId,
          time: new Date(tx.createdAt).getTime(),
          // Payme expects amount in tiyin (integer)
          amount: Math.round(Number(tx.amount) * 100),
          account: tx.donationId
            ? {
                user_id: tx.userId,
                plan_id: tx.planId,
                donation_id: tx.donationId,
              }
            : {
                user_id: tx.userId,
                plan_id: tx.planId,
              },
          create_time: new Date(tx.createdAt).getTime(),
          perform_time: tx.performTime ? new Date(tx.performTime).getTime() : 0,
          cancel_time: tx.cancelTime ? new Date(tx.cancelTime).getTime() : null,
          transaction: tx.id,
          state: tx.state,
          reason: tx.reason || null,
        })),
      },
    };
  }

  private normalizeAmount(amount: number | string): { requestTiyns: number; amountInSom: number } {
    /**
     * Payme odatda `amount`ni tiyinlarda integer ko'rinishida yuboradi.
     * Ba'zan string bo'lishi mumkin. Agar string bo'lsa ham integer deb qabul qilamiz,
     * faqat nuqta/vergul bo'lsa somdagi qiymat deb 100 ga ko'paytiramiz.
     */
    let requestTiyns: number;
    if (typeof amount === 'string') {
      const normalized = amount.replace(',', '.');
      const parsed = parseFloat(normalized);
      if (Number.isNaN(parsed)) throw new Error('Invalid amount format');
      const isFractional = normalized.includes('.');
      requestTiyns = Math.round(parsed * (isFractional ? 100 : 1));
    } else {
      requestTiyns = Math.round(Number(amount));
    }

    const amountInSom = requestTiyns / 100;
    return { requestTiyns, amountInSom };
  }

  private isExpired(createdAt: Date) {
    const timeoutMs = 15 * 60 * 1000; // 15 minutes
    return new Date(createdAt).getTime() < Date.now() - timeoutMs;
  }
}
