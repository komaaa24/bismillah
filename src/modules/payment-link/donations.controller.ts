import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../../shared/database/entities';

@Controller('donations')
export class DonationsController {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  /**
   * Frontend polling endpoint:
   * GET /donations/:donation_id
   */
  @Get(':donation_id')
  async getDonationStatus(@Param('donation_id') donationId: string) {
    const normalized = (donationId || '').trim();
    if (!normalized) {
      throw new NotFoundException('donation_id is required');
    }

    const tx = await this.transactionRepository.findOne({
      where: { donationId: normalized },
      order: { createdAt: 'DESC' },
    });

    if (!tx) {
      throw new NotFoundException('Donation not found');
    }

    return {
      donation_id: tx.donationId,
      status: tx.status,
      state: tx.state ?? null,
      amount: Number(tx.amount),
      transId: tx.transId ?? null,
      performTime: tx.performTime ? new Date(tx.performTime).toISOString() : null,
      cancelTime: tx.cancelTime ? new Date(tx.cancelTime).toISOString() : null,
      createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : null,
      updatedAt: tx.updatedAt ? new Date(tx.updatedAt).toISOString() : null,
    };
  }
}

