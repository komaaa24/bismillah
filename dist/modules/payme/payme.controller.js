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
exports.PaymeController = void 0;
const common_1 = require("@nestjs/common");
const payme_service_1 = require("./payme.service");
const payme_guard_1 = require("./auth/guards/payme.guard");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
let PaymeController = class PaymeController {
    constructor(paymeService) {
        this.paymeService = paymeService;
    }
    async handle(body) {
        var _a;
        logger_1.default.debug('Payme request received', body);
        const payload = await this.paymeService.handleTransactionMethods(body);
        const base = { jsonrpc: '2.0', id: (_a = body === null || body === void 0 ? void 0 : body.id) !== null && _a !== void 0 ? _a : null };
        if (payload && typeof payload === 'object' && ('result' in payload || 'error' in payload)) {
            return Object.assign(Object.assign({}, base), payload);
        }
        return Object.assign(Object.assign({}, base), { result: payload });
    }
};
exports.PaymeController = PaymeController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(payme_guard_1.PaymeBasicAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymeController.prototype, "handle", null);
exports.PaymeController = PaymeController = __decorate([
    (0, common_1.Controller)('payme'),
    __metadata("design:paramtypes", [payme_service_1.PaymeService])
], PaymeController);
//# sourceMappingURL=payme.controller.js.map