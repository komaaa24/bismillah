import dotenv from 'dotenv';
import { cleanEnv, num, str } from 'envalid';

dotenv.config();

export const config = cleanEnv(process.env, {
  APP_PORT: num({ default: 9999 }),
  BASE_URL: str({ default: 'http://localhost:9999' }),
  API_PREFIX: str({ default: 'api' }),
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  POSTGRES_URI: str(),
  PAYME_MERCHANT_ID: str(),
  PAYME_LOGIN: str(),
  PAYME_PASSWORD: str(),
  PAYME_PASSWORD_TEST: str({ default: '' }),
  PAYMENT_LINK_SECRET: str({ default: 'change-me-please' }),
  PAYMENT_LINK_BASE_URL: str({ default: '' })
});
