export const PaymeError = {
  InvalidAmount: {
    name: 'InvalidAmount',
    code: -31001,
    message: {
      uz: "Noto'g'ri summa",
      ru: 'Недопустимая сумма',
      en: 'Invalid amount',
    },
  },
  UserNotFound: {
    name: 'UserNotFound',
    code: -31050,
    message: {
      uz: 'Foydalanuvchi topilmadi',
      ru: 'Пользователь не найден',
      en: 'User not found',
    },
  },
  ProductNotFound: {
    name: 'ProductNotFound',
    code: -31050,
    message: {
      uz: 'Tarif topilmadi',
      ru: 'Тариф не найден',
      en: 'Product not found',
    },
  },
  CantDoOperation: {
    name: 'CantDoOperation',
    code: -31008,
    message: {
      uz: 'Amalni bajarib bo\'lmadi',
      ru: 'Операция не может быть выполнена',
      en: 'Operation cannot be performed',
    },
  },
  TransactionNotFound: {
    name: 'TransactionNotFound',
    code: -31003,
    message: {
      uz: 'Tranzaksiya topilmadi',
      ru: 'Транзакция не найдена',
      en: 'Transaction not found',
    },
  },
  AlreadyDone: {
    name: 'AlreadyDone',
    code: -31060,
    message: {
      uz: "Mahsulot uchun allaqachon to'langan",
      ru: 'Платеж уже проведён',
      en: 'Payment already completed',
    },
  },
  TransactionInProcess: {
    name: 'TransactionInProcess',
    code: -31099,
    message: {
      uz: 'Ushbu buyurtma uchun to\'lov jarayonda',
      ru: 'Платеж по заказу обрабатывается',
      en: 'Payment is already in process',
    },
  },
  Pending: {
    name: 'Pending',
    code: -31050,
    message: {
      uz: "Mahsulot uchun to'lov kutilmoqda",
      ru: 'Ожидается оплата',
      en: 'Payment is pending',
    },
  },
  InvalidAuthorization: {
    name: 'InvalidAuthorization',
    code: -32504,
    message: {
      uz: 'Avtorizatsiya yaroqsiz',
      ru: 'Авторизация недействительна',
      en: 'Authorization invalid',
    },
  },
};
