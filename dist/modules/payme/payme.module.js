"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const payme_controller_1 = require("./payme.controller");
const payme_service_1 = require("./payme.service");
const entities_1 = require("../../shared/database/entities");
const payme_guard_1 = require("./auth/guards/payme.guard");
let PaymeModule = class PaymeModule {
};
exports.PaymeModule = PaymeModule;
exports.PaymeModule = PaymeModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([entities_1.UserEntity, entities_1.PlanEntity, entities_1.TransactionEntity, entities_1.UserPaymentEntity])],
        controllers: [payme_controller_1.PaymeController],
        providers: [payme_service_1.PaymeService, payme_guard_1.PaymeBasicAuthGuard],
    })
], PaymeModule);
//# sourceMappingURL=payme.module.js.map