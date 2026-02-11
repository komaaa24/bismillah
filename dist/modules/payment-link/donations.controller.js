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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../shared/database/entities");
const canceling_reason_message_1 = require("../payme/constants/canceling-reason-message");
let DonationsController = class DonationsController {
    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }
    async getDonationStatus(donationId) {
        var _a, _b, _c;
        const normalized = (donationId || '').trim();
        if (!normalized) {
            throw new common_1.NotFoundException('donation_id is required');
        }
        const tx = await this.transactionRepository.findOne({
            where: { donationId: normalized },
            order: { createdAt: 'DESC' },
        });
        if (!tx) {
            throw new common_1.NotFoundException('Donation not found');
        }
        return {
            donation_id: tx.donationId,
            status: tx.status,
            state: (_a = tx.state) !== null && _a !== void 0 ? _a : null,
            reason: (_b = tx.reason) !== null && _b !== void 0 ? _b : null,
            cancelReasonText: (0, canceling_reason_message_1.getCancelReasonText)(tx.reason),
            amount: Number(tx.amount),
            transId: (_c = tx.transId) !== null && _c !== void 0 ? _c : null,
            performTime: tx.performTime ? new Date(tx.performTime).toISOString() : null,
            cancelTime: tx.cancelTime ? new Date(tx.cancelTime).toISOString() : null,
            createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : null,
            updatedAt: tx.updatedAt ? new Date(tx.updatedAt).toISOString() : null,
        };
    }
};
exports.DonationsController = DonationsController;
__decorate([
    (0, common_1.Get)(':donation_id'),
    __param(0, (0, common_1.Param)('donation_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "getDonationStatus", null);
exports.DonationsController = DonationsController = __decorate([
    (0, common_1.Controller)('donations'),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TransactionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DonationsController);
//# sourceMappingURL=donations.controller.js.map