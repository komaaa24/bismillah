export enum SubscriptionType {
  SUBSCRIPTION = 'subscription',
  ONETIME = 'onetime',
}

export enum PaymentProvider {
  PAYME = 'payme',
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  ONETIME = 'onetime',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
