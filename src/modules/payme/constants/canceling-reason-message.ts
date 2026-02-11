import { CancelingReasons } from './canceling-reasons';

export type CancelReasonText = {
  uz: string;
  ru: string;
  en: string;
};

export const CANCEL_REASON_MESSAGES: Record<number, CancelReasonText> = {
  [CancelingReasons.RecipientNotFound]: {
    uz: 'Qabul qiluvchi topilmadi',
    ru: 'Получатель не найден',
    en: 'Recipient not found',
  },
  [CancelingReasons.ErrorWhilePerformingDebitOperation]: {
    uz: "Kartadan yechishda xatolik bo'ldi",
    ru: 'Ошибка при списании средств',
    en: 'Debit operation failed',
  },
  [CancelingReasons.TransactionFailed]: {
    uz: "To'lov muvaffaqiyatsiz yakunlandi (Payme yoki bank tomoni bekor qilgan)",
    ru: 'Платеж завершился неуспешно (отмена на стороне Payme/банка)',
    en: 'Transaction failed (canceled by Payme/bank side)',
  },
  [CancelingReasons.CanceledDueToTimeout]: {
    uz: "To'lov vaqti tugagani uchun bekor qilindi",
    ru: 'Платеж отменён из-за истечения времени',
    en: 'Canceled due to timeout',
  },
  [CancelingReasons.Refund]: {
    uz: "To'lov qaytarildi (refund)",
    ru: 'Платеж возвращён (refund)',
    en: 'Payment refunded',
  },
  [CancelingReasons.UnknownError]: {
    uz: "Noma'lum xatolik",
    ru: 'Неизвестная ошибка',
    en: 'Unknown error',
  },
};

export function getCancelReasonText(reason?: number | null): CancelReasonText | null {
  if (reason === null || reason === undefined) return null;
  return CANCEL_REASON_MESSAGES[reason] ?? {
    uz: `Noma'lum sabab kodi: ${reason}`,
    ru: `Неизвестный код причины: ${reason}`,
    en: `Unknown reason code: ${reason}`,
  };
}

