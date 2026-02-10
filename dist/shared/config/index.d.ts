export declare const config: Readonly<{
    APP_PORT: number;
    BASE_URL: string;
    API_PREFIX: string;
    NODE_ENV: "production" | "development" | "test";
    POSTGRES_URI: string;
    PAYME_MERCHANT_ID: string;
    PAYME_LOGIN: string;
    PAYME_PASSWORD: string;
    PAYME_PASSWORD_TEST: string;
    PAYMENT_LINK_SECRET: string;
    PAYMENT_LINK_BASE_URL: string;
} & import("envalid").CleanedEnvAccessors>;
