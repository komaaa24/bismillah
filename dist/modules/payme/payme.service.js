"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_methods_1 = require("./constants/transaction-methods");
const error_status_codes_1 = require("./constants/error-status-codes");
const transaction_state_1 = require("./constants/transaction-state");
const payme_error_1 = require("./constants/payme-error");
const canceling_reasons_1 = require("./constants/canceling-reasons");
const canceling_reason_message_1 = require("./constants/canceling-reason-message");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
const validation_helper_1 = require("../../shared/utils/validation.helper");
const entities_1 = require("../../shared/database/entities");
function hasActiveSubscription(user) {
    if (!user || !user.isActive || !user.subscriptionEnd)
        return false;
    const endDate = user.subscriptionEnd instanceof Date ? user.subscriptionEnd : new Date(user.subscriptionEnd);
    return endDate.getTime() > Date.now();
}
const DONATION_USER_ID = '00000000-0000-4000-8000-000000000000';
const DONATION_PLAN_ID = '00000000-0000-4000-8000-000000000001';
let PaymeService = class PaymeService {
    constructor(userRepository, planRepository, transactionRepository, userPaymentRepository) {
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.transactionRepository = transactionRepository;
        this.userPaymentRepository = userPaymentRepository;
    }
    async handleTransactionMethods(reqBody) {
        switch (reqBody.method) {
            case transaction_methods_1.TransactionMethods.CheckPerformTransaction:
                return this.checkPerformTransaction(reqBody);
            case transaction_methods_1.TransactionMethods.CreateTransaction:
                return this.createTransaction(reqBody);
            case transaction_methods_1.TransactionMethods.CheckTransaction:
                return this.checkTransaction(reqBody);
            case transaction_methods_1.TransactionMethods.PerformTransaction:
                return this.performTransaction(reqBody);
            case transaction_methods_1.TransactionMethods.CancelTransaction:
                return this.cancelTransaction(reqBody);
            case transaction_methods_1.TransactionMethods.GetStatement:
                return this.getStatement(reqBody);
            default:
                return { error: payme_error_1.PaymeError.CantDoOperation };
        }
    }
    async checkPerformTransaction(dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            const planId = (_b = (_a = dto.params) === null || _a === void 0 ? void 0 : _a.account) === null || _b === void 0 ? void 0 : _b.plan_id;
            const userId = (_d = (_c = dto.params) === null || _c === void 0 ? void 0 : _c.account) === null || _d === void 0 ? void 0 : _d.user_id;
            const donationId = (_f = (_e = dto.params) === null || _e === void 0 ? void 0 : _e.account) === null || _f === void 0 ? void 0 : _f.donation_id;
            const selectedService = (_h = (_g = dto.params) === null || _g === void 0 ? void 0 : _g.account) === null || _h === void 0 ? void 0 : _h.selected_service;
            logger_1.default.info('🔵 CheckPerformTransaction', {
                planId,
                userId,
                donationId,
                selectedService,
                amount: (_j = dto.params) === null || _j === void 0 ? void 0 : _j.amount,
            });
            const isLockedDonationAccount = userId === DONATION_USER_ID && planId === DONATION_PLAN_ID;
            const isDonationAccount = (!!donationId && (!userId && !planId)) || (!!donationId && isLockedDonationAccount) || isLockedDonationAccount;
            if (isDonationAccount) {
                const { amountInSom } = this.normalizeAmount(dto.params.amount);
                if (!Number.isFinite(amountInSom) || amountInSom <= 0) {
                    return { error: payme_error_1.PaymeError.InvalidAmount };
                }
                if (donationId) {
                    const paid = await this.transactionRepository.findOne({
                        where: { provider: entities_1.PaymentProvider.PAYME, donationId, status: entities_1.TransactionStatus.PAID },
                    });
                    if (paid) {
                        return { error: payme_error_1.PaymeError.AlreadyDone };
                    }
                }
                return { result: { allow: true } };
            }
            if (!validation_helper_1.ValidationHelper.isValidObjectId(planId) || !validation_helper_1.ValidationHelper.isValidObjectId(userId)) {
                return {
                    error: {
                        code: error_status_codes_1.ErrorStatusCodes.TransactionNotAllowed,
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
                return { error: payme_error_1.PaymeError.ProductNotFound };
            }
            if (hasActiveSubscription(user)) {
                return { error: payme_error_1.PaymeError.AlreadyDone };
            }
            const { amountInSom } = this.normalizeAmount(dto.params.amount);
            const planPrice = Number(plan.price);
            if (Number.isNaN(planPrice) || amountInSom !== planPrice) {
                logger_1.default.warn('❌ Invalid amount in CheckPerformTransaction', {
                    expected: planPrice,
                    receivedSom: amountInSom,
                    raw: dto.params.amount,
                });
                return { error: payme_error_1.PaymeError.InvalidAmount };
            }
            return { result: { allow: true } };
        }
        catch (error) {
            logger_1.default.error('❌ checkPerformTransaction failed', error);
            return {
                error: {
                    code: error_status_codes_1.ErrorStatusCodes.SystemError,
                    message: {
                        uz: 'Tizimda xatolik yuz berdi',
                        en: 'System error occurred',
                        ru: 'Произошла системная ошибка',
                    },
                    data: error.message,
                },
            };
        }
    }
    async createTransaction(dto) {
        var _a, _b, _c, _d, _e, _f, _g;
        const planId = (_b = (_a = dto.params) === null || _a === void 0 ? void 0 : _a.account) === null || _b === void 0 ? void 0 : _b.plan_id;
        const userId = (_d = (_c = dto.params) === null || _c === void 0 ? void 0 : _c.account) === null || _d === void 0 ? void 0 : _d.user_id;
        const donationId = (_f = (_e = dto.params) === null || _e === void 0 ? void 0 : _e.account) === null || _f === void 0 ? void 0 : _f.donation_id;
        const transId = (_g = dto.params) === null || _g === void 0 ? void 0 : _g.id;
        try {
            logger_1.default.info('🔵 CreateTransaction', { planId, userId, donationId, transId });
            const isLockedDonationAccount = userId === DONATION_USER_ID && planId === DONATION_PLAN_ID;
            const isDonationAccount = (!!donationId && (!userId && !planId)) || (!!donationId && isLockedDonationAccount) || isLockedDonationAccount;
            if (isDonationAccount) {
                const { amountInSom } = this.normalizeAmount(dto.params.amount);
                if (!Number.isFinite(amountInSom) || amountInSom <= 0) {
                    return { error: payme_error_1.PaymeError.InvalidAmount, id: transId };
                }
                const effectiveDonationId = donationId || transId;
                const alreadyPaid = await this.transactionRepository.findOne({
                    where: { provider: entities_1.PaymentProvider.PAYME, donationId: effectiveDonationId, status: entities_1.TransactionStatus.PAID },
                });
                if (alreadyPaid) {
                    return { error: payme_error_1.PaymeError.AlreadyDone, id: transId };
                }
                const pending = await this.transactionRepository.findOne({
                    where: { provider: entities_1.PaymentProvider.PAYME, donationId: effectiveDonationId, status: entities_1.TransactionStatus.PENDING },
                });
                if (pending) {
                    if (this.isExpired(pending.createdAt)) {
                        await this.transactionRepository.update({ id: pending.id }, {
                            status: entities_1.TransactionStatus.CANCELED,
                            state: transaction_state_1.TransactionState.PendingCanceled,
                            cancelTime: new Date(),
                            reason: canceling_reasons_1.CancelingReasons.CanceledDueToTimeout,
                        });
                    }
                    else if (pending.transId === transId) {
                        return {
                            result: {
                                transaction: pending.id,
                                state: transaction_state_1.TransactionState.Pending,
                                create_time: new Date(pending.createdAt).getTime(),
                            },
                        };
                    }
                    else {
                        return { error: payme_error_1.PaymeError.TransactionInProcess, id: transId };
                    }
                }
                const existingById = await this.transactionRepository.findOne({ where: { transId } });
                if (existingById) {
                    if (this.isExpired(existingById.createdAt)) {
                        await this.transactionRepository.update({ id: existingById.id }, {
                            status: entities_1.TransactionStatus.CANCELED,
                            state: transaction_state_1.TransactionState.PendingCanceled,
                            cancelTime: new Date(),
                            reason: canceling_reasons_1.CancelingReasons.CanceledDueToTimeout,
                        });
                    }
                    else {
                        return {
                            result: {
                                transaction: existingById.id,
                                state: transaction_state_1.TransactionState.Pending,
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
                    provider: entities_1.PaymentProvider.PAYME,
                    paymentType: entities_1.PaymentType.ONETIME,
                    status: entities_1.TransactionStatus.PENDING,
                    state: transaction_state_1.TransactionState.Pending,
                });
                await this.transactionRepository.save(transaction);
                return {
                    result: {
                        transaction: transaction.id,
                        state: transaction_state_1.TransactionState.Pending,
                        create_time: new Date(transaction.createdAt).getTime(),
                    },
                };
            }
            if (!validation_helper_1.ValidationHelper.isValidObjectId(planId) || !validation_helper_1.ValidationHelper.isValidObjectId(userId)) {
                return { error: payme_error_1.PaymeError.ProductNotFound, id: transId };
            }
            const plan = await this.planRepository.findOne({ where: { id: planId } });
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!plan)
                return { error: payme_error_1.PaymeError.ProductNotFound, id: transId };
            if (!user)
                return { error: payme_error_1.PaymeError.UserNotFound, id: transId };
            if (hasActiveSubscription(user)) {
                return { error: payme_error_1.PaymeError.AlreadyDone, id: transId };
            }
            const { amountInSom } = this.normalizeAmount(dto.params.amount);
            const planPrice = Number(plan.price);
            if (Number.isNaN(planPrice) || amountInSom !== planPrice) {
                return { error: payme_error_1.PaymeError.InvalidAmount, id: transId };
            }
            const pending = await this.transactionRepository.findOne({
                where: { userId, planId, status: entities_1.TransactionStatus.PENDING },
            });
            if (pending) {
                if (this.isExpired(pending.createdAt)) {
                    await this.transactionRepository.update({ id: pending.id }, {
                        status: entities_1.TransactionStatus.CANCELED,
                        state: transaction_state_1.TransactionState.PendingCanceled,
                        cancelTime: new Date(),
                        reason: canceling_reasons_1.CancelingReasons.CanceledDueToTimeout,
                    });
                }
                else {
                    return {
                        error: payme_error_1.PaymeError.TransactionInProcess,
                        id: transId,
                    };
                }
            }
            const existingById = await this.transactionRepository.findOne({ where: { transId } });
            if (existingById) {
                if (this.isExpired(existingById.createdAt)) {
                    await this.transactionRepository.update({ id: existingById.id }, {
                        status: entities_1.TransactionStatus.CANCELED,
                        state: transaction_state_1.TransactionState.PendingCanceled,
                        cancelTime: new Date(),
                        reason: canceling_reasons_1.CancelingReasons.CanceledDueToTimeout,
                    });
                }
                else {
                    return {
                        result: {
                            transaction: existingById.id,
                            state: transaction_state_1.TransactionState.Pending,
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
                provider: entities_1.PaymentProvider.PAYME,
                paymentType: entities_1.PaymentType.ONETIME,
                status: entities_1.TransactionStatus.PENDING,
                state: transaction_state_1.TransactionState.Pending,
            });
            await this.transactionRepository.save(transaction);
            return {
                result: {
                    transaction: transaction.id,
                    state: transaction_state_1.TransactionState.Pending,
                    create_time: new Date(transaction.createdAt).getTime(),
                },
            };
        }
        catch (error) {
            logger_1.default.error('❌ createTransaction failed', error);
            return {
                error: {
                    code: error_status_codes_1.ErrorStatusCodes.SystemError,
                    message: {
                        uz: 'Tizimda xatolik yuz berdi',
                        en: 'System error occurred',
                        ru: 'Произошла системная ошибка',
                    },
                    data: error.message,
                },
                id: transId,
            };
        }
    }
    async performTransaction(dto) {
        const transId = dto.params.id;
        const transaction = await this.transactionRepository.findOne({ where: { transId } });
        if (!transaction) {
            return { error: payme_error_1.PaymeError.TransactionNotFound, id: transId };
        }
        if (transaction.status !== entities_1.TransactionStatus.PENDING) {
            if (transaction.status !== entities_1.TransactionStatus.PAID) {
                return { error: payme_error_1.PaymeError.CantDoOperation, id: transId };
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
            await this.transactionRepository.update({ id: transaction.id }, {
                status: entities_1.TransactionStatus.CANCELED,
                state: transaction_state_1.TransactionState.PendingCanceled,
                cancelTime: new Date(),
                reason: canceling_reasons_1.CancelingReasons.CanceledDueToTimeout,
            });
            return {
                error: Object.assign({ state: transaction_state_1.TransactionState.PendingCanceled, reason: canceling_reasons_1.CancelingReasons.CanceledDueToTimeout }, payme_error_1.PaymeError.CantDoOperation),
                id: transId,
            };
        }
        if (transaction.donationId) {
            const performTime = new Date();
            await this.transactionRepository.update({ id: transaction.id }, {
                status: entities_1.TransactionStatus.PAID,
                state: transaction_state_1.TransactionState.Paid,
                performTime,
            });
            const updated = await this.transactionRepository.findOne({ where: { id: transaction.id } });
            return {
                result: {
                    transaction: updated === null || updated === void 0 ? void 0 : updated.id,
                    perform_time: performTime.getTime(),
                    state: transaction_state_1.TransactionState.Paid,
                },
            };
        }
        const plan = await this.planRepository.findOne({ where: { id: transaction.planId } });
        const user = await this.userRepository.findOne({ where: { id: transaction.userId } });
        if (!plan)
            return { error: payme_error_1.PaymeError.ProductNotFound, id: transId };
        if (!user)
            return { error: payme_error_1.PaymeError.UserNotFound, id: transId };
        const performTime = new Date();
        await this.transactionRepository.update({ id: transaction.id }, {
            status: entities_1.TransactionStatus.PAID,
            state: transaction_state_1.TransactionState.Paid,
            performTime,
        });
        const subscriptionStart = new Date();
        const subscriptionEnd = new Date(subscriptionStart);
        subscriptionEnd.setDate(subscriptionEnd.getDate() + (plan.duration || 365));
        await this.userRepository.update({ id: user.id }, {
            isActive: true,
            subscriptionType: entities_1.SubscriptionType.ONETIME,
            subscriptionStart,
            subscriptionEnd,
        });
        await this.userPaymentRepository.save(this.userPaymentRepository.create({
            userId: user.id,
            planId: plan.id,
            amount: transaction.amount,
            currency: 'UZS',
            paymentMethod: entities_1.PaymentProvider.PAYME,
            transactionId: transId,
            status: entities_1.PaymentStatus.COMPLETED,
            paymentDate: performTime,
        }));
        const updated = await this.transactionRepository.findOne({ where: { id: transaction.id } });
        return {
            result: {
                transaction: updated === null || updated === void 0 ? void 0 : updated.id,
                perform_time: performTime.getTime(),
                state: transaction_state_1.TransactionState.Paid,
            },
        };
    }
    async cancelTransaction(dto) {
        var _a, _b, _c;
        const transId = dto.params.id;
        const reason = dto.params.reason;
        const reasonText = (0, canceling_reason_message_1.getCancelReasonText)(reason);
        logger_1.default.info('🟠 CancelTransaction received', { transId, reason, reasonText });
        const transaction = await this.transactionRepository.findOne({ where: { transId } });
        if (!transaction) {
            return { id: transId, error: payme_error_1.PaymeError.TransactionNotFound };
        }
        if (transaction.status === entities_1.TransactionStatus.PENDING) {
            await this.transactionRepository.update({ id: transaction.id }, {
                status: entities_1.TransactionStatus.CANCELED,
                state: transaction_state_1.TransactionState.PendingCanceled,
                cancelTime: new Date(),
                reason,
            });
            const canceled = await this.transactionRepository.findOne({ where: { id: transaction.id } });
            logger_1.default.warn('⚠️ Transaction canceled by CancelTransaction', {
                transId,
                transactionId: canceled === null || canceled === void 0 ? void 0 : canceled.id,
                donationId: transaction.donationId,
                previousStatus: transaction.status,
                nextStatus: entities_1.TransactionStatus.CANCELED,
                reason,
                reasonText,
            });
            return {
                result: {
                    cancel_time: (_a = canceled === null || canceled === void 0 ? void 0 : canceled.cancelTime) === null || _a === void 0 ? void 0 : _a.getTime(),
                    transaction: canceled === null || canceled === void 0 ? void 0 : canceled.id,
                    state: transaction_state_1.TransactionState.PendingCanceled,
                },
            };
        }
        if (transaction.state !== transaction_state_1.TransactionState.Paid) {
            return {
                result: {
                    state: transaction.state,
                    transaction: transaction.id,
                    cancel_time: (_b = transaction.cancelTime) === null || _b === void 0 ? void 0 : _b.getTime(),
                },
            };
        }
        await this.transactionRepository.update({ id: transaction.id }, {
            status: entities_1.TransactionStatus.CANCELED,
            state: transaction_state_1.TransactionState.PaidCanceled,
            cancelTime: new Date(),
            reason,
        });
        const updated = await this.transactionRepository.findOne({ where: { id: transaction.id } });
        logger_1.default.warn('⚠️ Paid transaction canceled by CancelTransaction', {
            transId,
            transactionId: updated === null || updated === void 0 ? void 0 : updated.id,
            donationId: transaction.donationId,
            previousState: transaction.state,
            nextState: transaction_state_1.TransactionState.PaidCanceled,
            reason,
            reasonText,
        });
        return {
            result: {
                cancel_time: (_c = updated === null || updated === void 0 ? void 0 : updated.cancelTime) === null || _c === void 0 ? void 0 : _c.getTime(),
                transaction: updated === null || updated === void 0 ? void 0 : updated.id,
                state: transaction_state_1.TransactionState.PaidCanceled,
            },
        };
    }
    async checkTransaction(dto) {
        var _a;
        const transId = dto.params.id;
        const transaction = await this.transactionRepository.findOne({ where: { transId } });
        if (!transaction) {
            return { error: payme_error_1.PaymeError.TransactionNotFound, id: transId };
        }
        return {
            result: {
                create_time: this.toEpochMs(transaction.createdAt),
                perform_time: transaction.performTime ? this.toEpochMs(transaction.performTime) : 0,
                cancel_time: transaction.cancelTime ? this.toEpochMs(transaction.cancelTime) : 0,
                transaction: transaction.id,
                state: transaction.state,
                reason: (_a = transaction.reason) !== null && _a !== void 0 ? _a : null,
            },
        };
    }
    async getStatement(dto) {
        const all = await this.transactionRepository.find({ where: { provider: entities_1.PaymentProvider.PAYME } });
        const from = new Date(dto.params.from);
        const to = new Date(dto.params.to);
        const fromMs = from.getTime();
        const toMs = to.getTime();
        const filtered = all.filter((tx) => {
            const createdAtMs = this.toEpochMs(tx.createdAt);
            return createdAtMs >= fromMs && createdAtMs <= toMs;
        });
        return {
            result: {
                transactions: filtered.map((tx) => ({
                    id: tx.transId,
                    time: this.toEpochMs(tx.createdAt),
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
                    create_time: this.toEpochMs(tx.createdAt),
                    perform_time: tx.performTime ? this.toEpochMs(tx.performTime) : 0,
                    cancel_time: tx.cancelTime ? this.toEpochMs(tx.cancelTime) : null,
                    transaction: tx.id,
                    state: tx.state,
                    reason: tx.reason || null,
                })),
            },
        };
    }
    normalizeAmount(amount) {
        let requestTiyns;
        if (typeof amount === 'string') {
            const normalized = amount.replace(',', '.');
            const parsed = parseFloat(normalized);
            if (Number.isNaN(parsed))
                throw new Error('Invalid amount format');
            const isFractional = normalized.includes('.');
            requestTiyns = Math.round(parsed * (isFractional ? 100 : 1));
        }
        else {
            requestTiyns = Math.round(Number(amount));
        }
        const amountInSom = requestTiyns / 100;
        return { requestTiyns, amountInSom };
    }
    toEpochMs(value) {
        const d = new Date(value);
        if (Number.isNaN(d.getTime()))
            return Date.now();
        return d.getTime() - d.getTimezoneOffset() * 60000;
    }
    isExpired(createdAt) {
        const timeoutMs = 15 * 60 * 1000;
        return this.toEpochMs(createdAt) < Date.now() - timeoutMs;
    }
};
exports.PaymeService = PaymeService;
exports.PaymeService = PaymeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.PlanEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TransactionEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.UserPaymentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PaymeService);
//# sourceMappingURL=payme.service.js.map