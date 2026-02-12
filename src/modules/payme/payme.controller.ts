import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { PaymeService } from './payme.service';
import { RequestBody } from './types/incoming-request-body';
import { PaymeBasicAuthGuard } from './auth/guards/payme.guard';
import logger from '../../shared/utils/logger';

@Controller('payme')
export class PaymeController {
  constructor(private readonly paymeService: PaymeService) {}

  @Post()
  @UseGuards(PaymeBasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: RequestBody) {
    logger.debug('Payme request received', body as any);
    const payload = await this.paymeService.handleTransactionMethods(body);
    const base = { jsonrpc: '2.0', id: (body as any)?.id ?? null };

    // Agar servis result/error bilan object qaytargan bo'lsa — JSON‑RPC formatida jo'natamiz.
    if (payload && typeof payload === 'object' && ('result' in payload || 'error' in payload)) {
      // Keep JSON-RPC id from request; do not let service payload override it.
      return {
        ...base,
        result: (payload as any).result,
        error: (payload as any).error
      };
    }

    // Fallback: boshqa tipdagi javoblar uchun ham minimal JSON‑RPC o'rami
    return { ...base, result: payload };
  }
}
