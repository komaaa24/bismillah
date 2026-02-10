"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentStatus = exports.TransactionStatus = exports.PaymentType = exports.PaymentProvider = exports.SubscriptionType = void 0;
var SubscriptionType;
(function (SubscriptionType) {
    SubscriptionType["SUBSCRIPTION"] = "subscription";
    SubscriptionType["ONETIME"] = "onetime";
})(SubscriptionType || (exports.SubscriptionType = SubscriptionType = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["PAYME"] = "payme";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["SUBSCRIPTION"] = "subscription";
    PaymentType["ONETIME"] = "onetime";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["PAID"] = "PAID";
    TransactionStatus["CANCELED"] = "CANCELED";
    TransactionStatus["FAILED"] = "FAILED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
//# sourceMappingURL=enums.js.map