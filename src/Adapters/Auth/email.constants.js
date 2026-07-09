// src/Adapters/Auth/email.constants.js

/**
 * @file Константы для Email OTP аутентификации
 *       Используется в Auth/email.js (parse-server) и user/otp.js (parse-cloud)
 * @module Adapters/Auth/email.constants
 */

module.exports = {
  OTP_LENGTH: 6,

  OTP_TTL: 10 * 60 * 1000, // 10 минут - время жизни кода
  OTP_ATTEMPTS_TTL: 60 * 60 * 1000, // 1 час - окно блокировки (проверяется через since)
  RATE_LIMIT_TTL: 1 * 60 * 1000, // 1 минута - между запросами кода

  OTP_MAX_CODE_FAILS: 5, // неверных вводов одного кода → код инвалидируется
  OTP_MAX_FAILS: 10, // суммарных провалов за OTP_ATTEMPTS_TTL → блокировка аккаунта

  OTP_KEY_PREFIX: 'email:otp:',
  OTP_RATE_LIMIT_PREFIX: 'email:rate-limit:',
  OTP_ATTEMPTS_PREFIX: 'email:otp-attempts:',
};
