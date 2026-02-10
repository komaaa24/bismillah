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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymeBasicAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const payme_error_1 = require("../../constants/payme-error");
let PaymeBasicAuthGuard = class PaymeBasicAuthGuard {
    constructor(configService) {
        this.configService = configService;
    }
    async canActivate(context) {
        var _a;
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const token = this.extractTokenFromHeader(request);
        const transId = (_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.id;
        if (!token) {
            response.status(200).send({ jsonrpc: '2.0', id: transId !== null && transId !== void 0 ? transId : null, error: payme_error_1.PaymeError.InvalidAuthorization });
            return false;
        }
        try {
            const decoded = Buffer.from(token, 'base64').toString('utf8');
            if (!decoded.includes(':')) {
                response.status(200).send({ id: transId, error: payme_error_1.PaymeError.InvalidAuthorization });
                return false;
            }
            const [username, password] = decoded.split(':');
            const allowedLogin = this.configService.get('PAYME_LOGIN');
            const merchantId = this.configService.get('PAYME_MERCHANT_ID');
            const prodPassword = this.configService.get('PAYME_PASSWORD');
            const testPassword = this.configService.get('PAYME_PASSWORD_TEST');
            const isUsernameOk = (!!allowedLogin && username === allowedLogin) || (!!merchantId && username === merchantId);
            const isPasswordOk = (!!prodPassword && password === prodPassword) || (!!testPassword && testPassword === password);
            if (!isUsernameOk || !isPasswordOk) {
                response.status(200).send({ jsonrpc: '2.0', id: transId !== null && transId !== void 0 ? transId : null, error: payme_error_1.PaymeError.InvalidAuthorization });
                return false;
            }
        }
        catch (error) {
            response.status(200).send({ jsonrpc: '2.0', id: transId !== null && transId !== void 0 ? transId : null, error: payme_error_1.PaymeError.InvalidAuthorization });
            return false;
        }
        return true;
    }
    extractTokenFromHeader(request) {
        const authHeader = request.headers['authorization'];
        if (!authHeader)
            return undefined;
        const [type, token] = authHeader.split(' ');
        return type === 'Basic' ? token : undefined;
    }
};
exports.PaymeBasicAuthGuard = PaymeBasicAuthGuard;
exports.PaymeBasicAuthGuard = PaymeBasicAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymeBasicAuthGuard);
//# sourceMappingURL=payme.guard.js.map