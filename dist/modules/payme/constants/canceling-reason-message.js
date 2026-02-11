"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANCEL_REASON_MESSAGES = void 0;
exports.getCancelReasonText = getCancelReasonText;
const canceling_reasons_1 = require("./canceling-reasons");
exports.CANCEL_REASON_MESSAGES = {
    [canceling_reasons_1.CancelingReasons.RecipientNotFound]: {
        uz: 'Qabul qiluvchi topilmadi',
        ru: 'Получатель не найден',
        en: 'Recipient not found',
    },
    [canceling_reasons_1.CancelingReasons.ErrorWhilePerformingDebitOperation]: {
        uz: "Kartadan yechishda xatolik bo'ldi",
        ru: 'Ошибка при списании средств',
        en: 'Debit operation failed',
    },
    [canceling_reasons_1.CancelingReasons.TransactionFailed]: {
        uz: "To'lov muvaffaqiyatsiz yakunlandi (Payme yoki bank tomoni bekor qilgan)",
        ru: 'Платеж завершился неуспешно (отмена на стороне Payme/банка)',
        en: 'Transaction failed (canceled by Payme/bank side)',
    },
    [canceling_reasons_1.CancelingReasons.CanceledDueToTimeout]: {
        uz: "To'lov vaqti tugagani uchun bekor qilindi",
        ru: 'Платеж отменён из-за истечения времени',
        en: 'Canceled due to timeout',
    },
    [canceling_reasons_1.CancelingReasons.Refund]: {
        uz: "To'lov qaytarildi (refund)",
        ru: 'Платеж возвращён (refund)',
        en: 'Payment refunded',
    },
    [canceling_reasons_1.CancelingReasons.UnknownError]: {
        uz: "Noma'lum xatolik",
        ru: 'Неизвестная ошибка',
        en: 'Unknown error',
    },
};
function getCancelReasonText(reason) {
    var _a;
    if (reason === null || reason === undefined)
        return null;
    return (_a = exports.CANCEL_REASON_MESSAGES[reason]) !== null && _a !== void 0 ? _a : {
        uz: `Noma'lum sabab kodi: ${reason}`,
        ru: `Неизвестный код причины: ${reason}`,
        en: `Unknown reason code: ${reason}`,
    };
}
//# sourceMappingURL=canceling-reason-message.js.map