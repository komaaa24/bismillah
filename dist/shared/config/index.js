"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const envalid_1 = require("envalid");
dotenv_1.default.config();
exports.config = (0, envalid_1.cleanEnv)(process.env, {
    APP_PORT: (0, envalid_1.num)({ default: 9999 }),
    BASE_URL: (0, envalid_1.str)({ default: 'http://localhost:9999' }),
    API_PREFIX: (0, envalid_1.str)({ default: 'api' }),
    NODE_ENV: (0, envalid_1.str)({ choices: ['development', 'production', 'test'], default: 'development' }),
    POSTGRES_URI: (0, envalid_1.str)(),
    PAYME_MERCHANT_ID: (0, envalid_1.str)(),
    PAYME_LOGIN: (0, envalid_1.str)(),
    PAYME_PASSWORD: (0, envalid_1.str)(),
    PAYME_PASSWORD_TEST: (0, envalid_1.str)({ default: '' }),
    PAYMENT_LINK_SECRET: (0, envalid_1.str)({ default: 'change-me-please' }),
    PAYMENT_LINK_BASE_URL: (0, envalid_1.str)({ default: '' })
});
//# sourceMappingURL=index.js.map