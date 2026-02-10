import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { PaymeError } from '../../constants/payme-error';

@Injectable()
export class PaymeBasicAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const token = this.extractTokenFromHeader(request);
    const transId = (request?.body as any)?.id;

    if (!token) {
      response.status(200).send({ jsonrpc: '2.0', id: transId ?? null, error: PaymeError.InvalidAuthorization });
      return false;
    }

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      if (!decoded.includes(':')) {
        response.status(200).send({ id: transId, error: PaymeError.InvalidAuthorization });
        return false;
      }

      const [username, password] = decoded.split(':');
      const allowedLogin = this.configService.get<string>('PAYME_LOGIN');
      const merchantId = this.configService.get<string>('PAYME_MERCHANT_ID');
      const prodPassword = this.configService.get<string>('PAYME_PASSWORD');
      const testPassword = this.configService.get<string>('PAYME_PASSWORD_TEST');

      const isUsernameOk = (!!allowedLogin && username === allowedLogin) || (!!merchantId && username === merchantId);
      const isPasswordOk = (!!prodPassword && password === prodPassword) || (!!testPassword && testPassword === password);

      if (!isUsernameOk || !isPasswordOk) {
        response.status(200).send({ jsonrpc: '2.0', id: transId ?? null, error: PaymeError.InvalidAuthorization });
        return false;
      }
    } catch (error) {
      response.status(200).send({ jsonrpc: '2.0', id: transId ?? null, error: PaymeError.InvalidAuthorization });
      return false;
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Basic' ? token : undefined;
  }
}
