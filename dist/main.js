"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const logger_1 = __importDefault(require("./shared/utils/logger"));
const typeorm_1 = require("typeorm");
const plan_entity_1 = require("./shared/database/entities/plan.entity");
const plan_seeder_1 = require("./shared/database/seeders/plan.seeder");
async function bootstrap() {
    var _a;
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const configService = app.get(config_1.ConfigService);
    const port = Number(configService.get('APP_PORT', 9999));
    const apiPrefix = configService.get('API_PREFIX', 'api');
    app.setGlobalPrefix(apiPrefix, {
        exclude: [
            { path: 'pay', method: common_1.RequestMethod.GET },
            { path: 'pay/subscription', method: common_1.RequestMethod.GET },
            { path: 'donations/:donation_id', method: common_1.RequestMethod.GET },
        ],
    });
    app.enableCors({ origin: true, credentials: true });
    const normalizedPrefix = (apiPrefix || '').replace(/^\/+|\/+$/g, '');
    if (normalizedPrefix) {
        app.use(`/${normalizedPrefix}/pay`, (req, res, next) => {
            if (req.method !== 'GET')
                return next();
            const url = req.originalUrl || req.url || '';
            const base = `/${normalizedPrefix}/pay`;
            if (!url.startsWith(base))
                return next();
            const rest = url.slice(base.length);
            const qsIndex = rest.indexOf('?');
            const pathPart = qsIndex >= 0 ? rest.slice(0, qsIndex) : rest;
            const qs = qsIndex >= 0 ? rest.slice(qsIndex) : '';
            return res.redirect(`/pay${pathPart}${qs}`);
        });
        app.use(`/${normalizedPrefix}/donations`, (req, res, next) => {
            if (req.method !== 'GET')
                return next();
            const url = req.originalUrl || req.url || '';
            const base = `/${normalizedPrefix}/donations`;
            if (!url.startsWith(base))
                return next();
            const rest = url.slice(base.length);
            const qsIndex = rest.indexOf('?');
            const pathPart = qsIndex >= 0 ? rest.slice(0, qsIndex) : rest;
            const qs = qsIndex >= 0 ? rest.slice(qsIndex) : '';
            return res.redirect(`/donations${pathPart}${qs}`);
        });
    }
    app.use((req, res, next) => {
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
                logger_1.default.error('HTTP request failed', meta);
            }
            else if (res.statusCode >= 400) {
                logger_1.default.warn('HTTP request', meta);
            }
            else {
                logger_1.default.info('HTTP request', meta);
            }
        });
        next();
    });
    const dataSource = app.get(typeorm_1.DataSource);
    await (0, plan_seeder_1.seedDefaultPlan)(dataSource.getRepository(plan_entity_1.PlanEntity));
    await app.listen(port, '0.0.0.0');
    const url = await app.getUrl();
    logger_1.default.info(`✅ Payme one-time API listening on ${url}/${apiPrefix}`);
    console.log(`✅ Payme one-time API listening on ${url}/${apiPrefix}`);
    try {
        const server = app.getHttpAdapter().getInstance();
        if ((_a = server === null || server === void 0 ? void 0 : server._router) === null || _a === void 0 ? void 0 : _a.stack) {
            const routes = server._router.stack
                .filter((layer) => layer.route)
                .map((layer) => {
                const methods = Object.keys(layer.route.methods)
                    .filter((m) => layer.route.methods[m])
                    .join(',')
                    .toUpperCase();
                return `${methods} ${layer.route.path}`;
            });
            const msg = `Registered routes: ${routes.join(' | ')}`;
            common_1.Logger.log(msg);
            console.log(msg);
        }
    }
    catch (e) {
        common_1.Logger.warn(`Route dump failed: ${e.message}`);
    }
}
bootstrap().catch((error) => {
    logger_1.default.error('Fatal error during bootstrap', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map