export type CancelReasonText = {
    uz: string;
    ru: string;
    en: string;
};
export declare const CANCEL_REASON_MESSAGES: Record<number, CancelReasonText>;
export declare function getCancelReasonText(reason?: number | null): CancelReasonText | null;
