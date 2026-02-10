import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import logger from '../../shared/utils/logger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity, UserEntity } from '../../shared/database/entities';
import { randomUUID } from 'node:crypto';

// If Payme Business requisites are locked and include user_id/plan_id,
// we must still send those fields in checkout parameters. We use fixed UUIDs
// to route such payments through the donation flow in our Merchant API.
const DONATION_USER_ID = '00000000-0000-4000-8000-000000000000';
const DONATION_PLAN_ID = '00000000-0000-4000-8000-000000000001';

@Controller('pay')
export class PaymentLinkController {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  /**
   * GET /pay?amount=10000&user_id=<uuid>&plan_id=<uuid>&donation_id=DON123&returnUrl=https://example.com&redirect=1
   * - amount: so'mda (integer yoki float), majburiy
   * - user_id/plan_id/donation_id: ixtiyoriy.
   *   Payme Business rekvizitlari "locked" bo'lsa, biz baribir uchalasini ham yuboramiz.
   *   donation_id berilmasa — har doim avtomatik yaratiladi.
   * - returnUrl: optional, Payme checkoutdan qaytish URL
   * - redirect: 1|0 — 1 bo'lsa 302 redirect, 0 bo'lsa JSON { url }
   */
  @Get()
  redirectToPayme(
    @Query('amount') amount: string,
    @Query('user_id') userId = '',
    @Query('plan_id') planId = '',
    @Query('donation_id') donationId = '',
    @Query('returnUrl') returnUrl = '',
    @Query('redirect') redirect = '1',
    @Res() res: Response,
  ) {
    const merchantId = this.configService.get<string>('PAYME_MERCHANT_ID');
    if (!merchantId) {
      throw new BadRequestException('PAYME_MERCHANT_ID is not configured');
    }

    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw new BadRequestException('amount is required and must be > 0');
    }

    const amountTiyns = Math.round(numericAmount * 100);

    // account parametrlari: donation oqimi uchun donation_id kifoya.
    const accountParts: string[] = [];
    const isDonationAuto = !userId && !planId;
    const finalUserId = userId || (isDonationAuto ? DONATION_USER_ID : '');
    const finalPlanId = planId || (isDonationAuto ? DONATION_PLAN_ID : '');

    if (finalUserId) accountParts.push(`ac.user_id=${finalUserId}`);
    if (finalPlanId) accountParts.push(`ac.plan_id=${finalPlanId}`);
    // If Payme requisites include donation_id, checkout will fail without it.
    // We always provide donation_id (random) when caller doesn't pass one.
    const finalDonationId = donationId || randomUUID();
    accountParts.push(`ac.donation_id=${finalDonationId}`);

    const parts = [`m=${merchantId}`, ...accountParts, `a=${amountTiyns}`];
    if (returnUrl) {
      parts.push(`c=${encodeURIComponent(returnUrl)}`);
    }

    const paramString = parts.join(';');
    const encoded = Buffer.from(paramString).toString('base64');
    const checkoutUrl = `https://checkout.paycom.uz/${encoded}`;

    logger.info('Generated Payme checkout link', {
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

  /**
   * Convenience: build subscription checkout link from telegram_id + plan key.
   *
   * GET /pay/subscription?telegram_id=123456789&plan=default&redirect=1
   * - plan: plan.id (uuid) yoki plan.selectedName yoki plan.name (default: "default")
   * - amount: optional (so'm). default plan.price
   */
  @Get('subscription')
  async subscription(
    @Query() query: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const merchantId = this.configService.get<string>('PAYME_MERCHANT_ID');
    if (!merchantId) {
      throw new BadRequestException('PAYME_MERCHANT_ID is not configured');
    }

    const telegramRaw = (query.telegram_id || query.telegramId || '').trim();
    if (!telegramRaw) {
      throw new BadRequestException('telegram_id is required');
    }
    const telegramId = Number(telegramRaw);
    if (Number.isNaN(telegramId) || telegramId <= 0) {
      throw new BadRequestException('telegram_id must be a positive number');
    }

    const planKey = (query.plan || query.plan_id || query.planId || 'default').trim();

    // Find or create user (makes API usable without manual SQL seeding)
    let user = await this.userRepository.findOne({ where: { telegramId } });
    if (!user) {
      user = await this.userRepository.save(
        this.userRepository.create({ telegramId, isActive: false }),
      );
    }

    // Plan lookup: id -> selectedName -> name
    let plan =
      (await this.planRepository.findOne({ where: { id: planKey } })) ||
      (await this.planRepository.findOne({ where: { selectedName: planKey } })) ||
      (await this.planRepository.findOne({ where: { name: planKey } }));
    if (!plan) {
      throw new BadRequestException(`Plan not found: ${planKey}`);
    }

    const requestedAmount = (query.amount || '').trim();
    const amountSom = requestedAmount ? Number(requestedAmount) : Number(plan.price);
    if (Number.isNaN(amountSom) || amountSom <= 0) {
      throw new BadRequestException('amount must be > 0');
    }

    const amountTiyns = Math.round(amountSom * 100);
    const donationId = (query.donation_id || query.donationId || '').trim() || randomUUID();
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

    logger.info('Generated Payme subscription link', {
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
}
