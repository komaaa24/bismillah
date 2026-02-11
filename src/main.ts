import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import logger from './shared/utils/logger';
import { DataSource } from 'typeorm';
import { PlanEntity } from './shared/database/entities/plan.entity';
import { seedDefaultPlan } from './shared/database/seeders/plan.seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  const port = Number(configService.get<number>('APP_PORT', 9999));
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  // Keep /pay accessible without prefix for simple checkout links
  app.setGlobalPrefix(apiPrefix, {
    // Keep checkout link generators available without prefix:
    // - /pay
    // - /pay/subscription
    exclude: [
      { path: 'pay', method: RequestMethod.GET },
      { path: 'pay/subscription', method: RequestMethod.GET },
      // Frontend polling endpoint for donation status:
      { path: 'donations/:donation_id', method: RequestMethod.GET },
    ],
  });
  app.enableCors({ origin: true, credentials: true });

  // Convenience alias: some deployments expect everything under /<API_PREFIX>.
  // Since /pay is excluded from the global prefix, we redirect /api/pay/* -> /pay/*.
  const normalizedPrefix = (apiPrefix || '').replace(/^\/+|\/+$/g, '');
  if (normalizedPrefix) {
    app.use(`/${normalizedPrefix}/pay`, (req: any, res: any, next: any) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl || req.url || '';
      const base = `/${normalizedPrefix}/pay`;
      if (!url.startsWith(base)) return next();

      // Preserve subpath (e.g. /subscription) and query string.
      const rest = url.slice(base.length); // e.g. "", "/subscription?x=1"
      const qsIndex = rest.indexOf('?');
      const pathPart = qsIndex >= 0 ? rest.slice(0, qsIndex) : rest;
      const qs = qsIndex >= 0 ? rest.slice(qsIndex) : '';
      return res.redirect(`/pay${pathPart}${qs}`);
    });

    app.use(`/${normalizedPrefix}/donations`, (req: any, res: any, next: any) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl || req.url || '';
      const base = `/${normalizedPrefix}/donations`;
      if (!url.startsWith(base)) return next();

      const rest = url.slice(base.length); // e.g. "/<donation_id>?x=1"
      const qsIndex = rest.indexOf('?');
      const pathPart = qsIndex >= 0 ? rest.slice(0, qsIndex) : rest;
      const qs = qsIndex >= 0 ? rest.slice(qsIndex) : '';
      return res.redirect(`/donations${pathPart}${qs}`);
    });
  }

  // Request logger (also logs 404 responses which Nest doesn't print by default)
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    const url = req.originalUrl || req.url;
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const meta = {
        method: req.method,
        url,
        statusCode: res.statusCode,
        durationMs,
      };

      if (res.statusCode >= 500) {
        logger.error('HTTP request failed', meta);
      } else if (res.statusCode >= 400) {
        logger.warn('HTTP request', meta);
      } else {
        logger.info('HTTP request', meta);
      }
    });
    next();
  });

  // seed default plan so that Payme amount check succeeds out of the box
  const dataSource = app.get(DataSource);
  await seedDefaultPlan(dataSource.getRepository(PlanEntity));

  await app.listen(port, '0.0.0.0');
  const url = await app.getUrl();
  logger.info(`✅ Payme one-time API listening on ${url}/${apiPrefix}`);
  console.log(`✅ Payme one-time API listening on ${url}/${apiPrefix}`);

  // Debug: log registered routes to catch 404 issues quickly
  try {
    const server: any = app.getHttpAdapter().getInstance();
    if (server?._router?.stack) {
      const routes = server._router.stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => {
          const methods = Object.keys(layer.route.methods)
            .filter((m) => layer.route.methods[m])
            .join(',')
            .toUpperCase();
          return `${methods} ${layer.route.path}`;
        });
      const msg = `Registered routes: ${routes.join(' | ')}`;
      Logger.log(msg);
      console.log(msg);
    }
  } catch (e) {
    Logger.warn(`Route dump failed: ${(e as Error).message}`);
  }
}

bootstrap().catch((error) => {
  logger.error('Fatal error during bootstrap', error as any);
  process.exit(1);
});
