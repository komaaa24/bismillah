# Payme One-time Payment API (shavpayme)

Ushbu katalogda `ismlar_programmsoft` loyihasidan ajratilgan **Payme bir martalik to'lov** integratsiyasi joylashgan. NestJS + TypeORM asosida yengillashtirilgan servis bo'lib, Payme JSON-RPC metodlarini (CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction, CheckTransaction, GetStatement) to'liq qo'llab-quvvatlaydi.

## Tez start
1. `cp .env.example .env` va Payme hamda PostgreSQL ma'lumotlarini to'ldiring.
2. `npm install` (yoki `pnpm install`/`yarn`).
3. `npm run start:dev` (yoki `npm start`).

Ilk ishga tushirishda `seedDefaultPlan` avtomatik tarzda 1 ta tarif (10000 UZS, 365 kun) yaratadi.
- `users` jadvalida foydalanuvchi bo'lishi kerak (`telegramId` majburiy). Siz uni:
  - SQL bilan qo'shishingiz mumkin: `insert into users (id, telegramId, \"isActive\") values (gen_random_uuid(), 123456789, false);`
  - yoki `GET /pay/subscription?telegram_id=...` endpointi birinchi chaqirilganda avtomatik yaratadi.

## Muhit o'zgaruvchilari
`POSTGRES_URI`, `PAYME_MERCHANT_ID`, `PAYME_LOGIN`, `PAYME_PASSWORD` majburiy. Sandbox uchun `PAYME_PASSWORD_TEST` ni qo'shishingiz mumkin. Port/prefix qiymatlari `APP_PORT` va `API_PREFIX` bilan boshqariladi.

> Eslatma: agar `PAYME_PASSWORD` ichida `#` bo'lsa, `.env` da qiymatni qo'shtirnoq (`"..."`) ichiga oling. Aks holda `dotenv` `#` dan keyin comment deb kesib tashlaydi va Payme Basic Auth ishlamaydi.

## Asosiy endpoint
`POST /<API_PREFIX>/payme`

- Basic Auth talab qilinadi (`PAYME_LOGIN` yoki `PAYME_MERCHANT_ID` + mos parol/test paroli).
- Body Payme JSON-RPC formatida bo'ladi.

## Oddiy checkout link generatori
`GET /pay?amount=10000&redirect=1`

- `amount` so'mda, majburiy.  
- `redirect=1` bo'lsa 302 bilan Payme checkoutga yo'naltiradi; `redirect=0` bo'lsa `{ url }` JSON qaytaradi.  
- `returnUrl` parametri bo'lsa Payme'dan qaytish URL sifatida yuboriladi.  

Qo'shimcha:
- `user_id`/`plan_id`/`donation_id` ixtiyoriy.
- Agar hech biri berilmasa, donation oqimi ishlaydi va `donation_id` avtomatik yaratiladi. `redirect=0` bo'lsa `{ url, donation_id }` qaytadi.

## Subscription link (telegram_id orqali)
`GET /pay/subscription?telegram_id=123456789&plan=default&redirect=1`

- `telegram_id` majburiy.
- `plan` ixtiyoriy (`plan.id` yoki `selectedName` yoki `name`). Default: `default`.
- `amount` ixtiyoriy (so'm). Default: tarif `price`.
- `redirect=1` bo'lsa 302, `redirect=0` bo'lsa `{ url, userId, planId }` JSON.

### Namunaviy so'rovlar
- **CheckPerformTransaction**
```json
{
  "method": "CheckPerformTransaction",
  "params": {
    "amount": 1000000,
    "account": { "user_id": "<uuid>", "plan_id": "<uuid>" }
  }
}
```
- **CreateTransaction** va **PerformTransaction** ketma-ket yuboriladi; `id` qiymati Payme tomonidan yuborilgan unikal tranzaksiya identifikatori bo'lishi kerak.

## Biznes qoidalari
- Summalar tiyinlarda keladi, server ularni somga (amount/100) konvertatsiya qilib tarif narxi bilan solishtiradi.
- Tranzaksiya muddati 15 daqiqa. Vaqti o'tsa `CanceledDueToTimeout` bilan bekor qilinadi.
- Muvaffaqiyatli `PerformTransaction` foydalanuvchini faollashtiradi (`subscriptionEnd` = hozirgi sana + tarif `duration` kuni) va `user_payments` jadvaliga yozuv qo'shadi.

## Jadval/Entity lar
- `users` (minimal: telegramId, subscription holati)
- `plans` (tarif narxi va davomiyligi)
- `transactions` (Payme bilan ishlash uchun)
- `user_payments` (auditoriya uchun to'lov logi)

## Nima uchun alohida katalog?
`ismlar_programmsoft` dagi Payme moduli murakkab bot va ko'plab provayderlarga bog'langan. Bu katalogda faqat Payme bir martalik to'lov uchun zarur bo'lgan kodlar qoldirildi, shu bois konfiguratsiya soddalashgan va bog'liqliklar minimumda.
