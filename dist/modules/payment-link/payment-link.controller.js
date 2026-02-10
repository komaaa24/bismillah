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
exports.PaymentLinkController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../shared/database/entities");
const node_crypto_1 = require("node:crypto");
const DONATION_USER_ID = '00000000-0000-4000-8000-000000000000';
const DONATION_PLAN_ID = '00000000-0000-4000-8000-000000000001';
let PaymentLinkController = class PaymentLinkController {
    constructor(configService, userRepository, planRepository) {
        this.configService = configService;
        this.userRepository = userRepository;
        this.planRepository = planRepository;
    }
    redirectToPayme(amount, userId = '', planId = '', donationId = '', returnUrl = '', redirect = '1', res) {
        const merchantId = this.configService.get('PAYME_MERCHANT_ID');
        if (!merchantId) {
            throw new common_1.BadRequestException('PAYME_MERCHANT_ID is not configured');
        }
        const numericAmount = Number(amount);
        if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
            throw new common_1.BadRequestException('amount is required and must be > 0');
        }
        const amountTiyns = Math.round(numericAmount * 100);
        const accountParts = [];
        const isDonationAuto = !userId && !planId;
        const finalUserId = userId || (isDonationAuto ? DONATION_USER_ID : '');
        const finalPlanId = planId || (isDonationAuto ? DONATION_PLAN_ID : '');
        if (finalUserId)
            accountParts.push(`ac.user_id=${finalUserId}`);
        if (finalPlanId)
            accountParts.push(`ac.plan_id=${finalPlanId}`);
        const finalDonationId = donationId || (0, node_crypto_1.randomUUID)();
        accountParts.push(`ac.donation_id=${finalDonationId}`);
        const parts = [`m=${merchantId}`, ...accountParts, `a=${amountTiyns}`];
        if (returnUrl) {
            parts.push(`c=${encodeURIComponent(returnUrl)}`);
        }
        const paramString = parts.join(';');
        const encoded = Buffer.from(paramString).toString('base64');
        const checkoutUrl = `https://checkout.paycom.uz/${encoded}`;
        logger_1.default.info('Generated Payme checkout link', {
            amount: numericAmount,
            amountTiyns,
            userId: finalUserId,
            planId: finalPlanId,
            donationId: finalDonationId || donationId,
            returnUrl,
            checkoutUrl,
        });
        if (redirect === '1' || redirect === 'true') {
            return res.redirect(checkoutUrl);
        }
        return res.json({ url: checkoutUrl, donation_id: finalDonationId });
    }
    async subscription(query, res) {
        const merchantId = this.configService.get('PAYME_MERCHANT_ID');
        if (!merchantId) {
            throw new common_1.BadRequestException('PAYME_MERCHANT_ID is not configured');
        }
        const telegramRaw = (query.telegram_id || query.telegramId || '').trim();
        if (!telegramRaw) {
            throw new common_1.BadRequestException('telegram_id is required');
        }
        const telegramId = Number(telegramRaw);
        if (Number.isNaN(telegramId) || telegramId <= 0) {
            throw new common_1.BadRequestException('telegram_id must be a positive number');
        }
        const planKey = (query.plan || query.plan_id || query.planId || 'default').trim();
        let user = await this.userRepository.findOne({ where: { telegramId } });
        if (!user) {
            user = await this.userRepository.save(this.userRepository.create({ telegramId, isActive: false }));
        }
        let plan = (await this.planRepository.findOne({ where: { id: planKey } })) ||
            (await this.planRepository.findOne({ where: { selectedName: planKey } })) ||
            (await this.planRepository.findOne({ where: { name: planKey } }));
        if (!plan) {
            throw new common_1.BadRequestException(`Plan not found: ${planKey}`);
        }
        const requestedAmount = (query.amount || '').trim();
        const amountSom = requestedAmount ? Number(requestedAmount) : Number(plan.price);
        if (Number.isNaN(amountSom) || amountSom <= 0) {
            throw new common_1.BadRequestException('amount must be > 0');
        }
        const amountTiyns = Math.round(amountSom * 100);
        const donationId = (query.donation_id || query.donationId || '').trim() || (0, node_crypto_1.randomUUID)();
        const parts = [
            `m=${merchantId}`,
            `ac.user_id=${user.id}`,
            `ac.plan_id=${plan.id}`,
            `ac.donation_id=${donationId}`,
            `a=${amountTiyns}`,
        ];
        const returnUrl = (query.returnUrl || '').trim();
        if (returnUrl) {
            parts.push(`c=${encodeURIComponent(returnUrl)}`);
        }
        const encoded = Buffer.from(parts.join(';')).toString('base64');
        const checkoutUrl = `https://checkout.paycom.uz/${encoded}`;
        logger_1.default.info('Generated Payme subscription link', {
            telegramId,
            userId: user.id,
            planId: plan.id,
            planKey,
            amountSom,
            amountTiyns,
            checkoutUrl,
        });
        const redirect = (query.redirect || '1').trim();
        if (redirect === '1' || redirect === 'true') {
            return res.redirect(checkoutUrl);
        }
        return res.json({ url: checkoutUrl, userId: user.id, planId: plan.id, planKey, donation_id: donationId });
    }
};
exports.PaymentLinkController = PaymentLinkController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('amount')),
    __param(1, (0, common_1.Query)('user_id')),
    __param(2, (0, common_1.Query)('plan_id')),
    __param(3, (0, common_1.Query)('donation_id')),
    __param(4, (0, common_1.Query)('returnUrl')),
    __param(5, (0, common_1.Query)('redirect')),
    __param(6, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentLinkController.prototype, "redirectToPayme", null);
__decorate([
    (0, common_1.Get)('subscription'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentLinkController.prototype, "subscription", null);
exports.PaymentLinkController = PaymentLinkController = __decorate([
    (0, common_1.Controller)('pay'),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.UserEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.PlanEntity)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PaymentLinkController);
//# sourceMappingURL=payment-link.controller.js.map