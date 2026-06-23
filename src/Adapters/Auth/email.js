// src/Adapters/Auth/email.js

/**
 * @file Кастомный auth-адаптер для аутентификации пользователя по Email и OTP
 *       Вызывается Parse Server при Parse.User.logInWith('email', { authData })
 * @module Adapters/Auth/email
 */

const Parse = require('parse/node');

const { getRedisClient, logger } = require('../../Services');
const {
  OTP_TTL,
  OTP_ATTEMPTS_TTL,

  OTP_MAX_CODE_FAILS,
  OTP_MAX_FAILS,

  OTP_KEY_PREFIX,
  OTP_ATTEMPTS_PREFIX,
} = require('./email.constants');

const LOG_PREFIX = '[EmailOTPAuth]';

async function getFailCount(redisClient, attemptsKey) {
  const data = await redisClient.get(attemptsKey);
  if (!data) return 0;
  if (Date.now() - data.since > OTP_ATTEMPTS_TTL) return 0;
  return data.count;
}

async function incrementFailCount(redisClient, attemptsKey) {
  const data = await redisClient.get(attemptsKey);
  const now = Date.now();

  const isExpired = !data || now - data.since > OTP_ATTEMPTS_TTL;

  // RedisCacheAdapter.put() всегда перезаписывает TTL
  // Поэтому окно блокировки контролируется через поле since, а не через Redis TTL
  const newData = isExpired
    ? { count: 1, since: now }
    : { count: data.count + 1, since: data.since };

  await redisClient.put(attemptsKey, newData, OTP_ATTEMPTS_TTL);
  return newData.count;
}

const validateAuthData = async authData => {
  try {
    const { id: email, otp } = authData;
    if (!email || !otp) {
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'Email or OTP is missing');
    }

    const lowerCaseEmail = email.toLowerCase();

    const redisClient = getRedisClient();

    const otpKey = `${OTP_KEY_PREFIX}${lowerCaseEmail}`;
    const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${lowerCaseEmail}`;

    const currentFails = await getFailCount(redisClient, attemptsKey);
    if (currentFails >= OTP_MAX_FAILS) {
      throw new Parse.Error(403, 'Account temporarily locked. Try again later.');
    }

    const storedData = await redisClient.get(otpKey);
    if (!storedData) {
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'Confirmation code expired or not found');
    }

    if (storedData.otp !== otp.toString()) {
      const newCodeFails = (storedData.fails || 0) + 1;
      const newTotalFails = await incrementFailCount(redisClient, attemptsKey);

      if (newCodeFails >= OTP_MAX_CODE_FAILS || newTotalFails >= OTP_MAX_FAILS) {
        // Инвалидируем код - пользователь должен запросить новый через sendEmailOTP
        await redisClient.del(otpKey);

        if (newTotalFails >= OTP_MAX_FAILS) {
          throw new Parse.Error(403, 'Account temporarily locked. Try again later.');
        }

        throw new Parse.Error(429, 'Too many attempts for this code. Please request a new one.');
      }

      await redisClient.put(otpKey, { ...storedData, fails: newCodeFails }, OTP_TTL);

      throw new Parse.Error(
        Parse.Error.UNAUTHORIZED,
        `Invalid code. Attempts left: ${OTP_MAX_CODE_FAILS - newCodeFails}`
      );
    }

    await Promise.all([redisClient.del(otpKey), redisClient.del(attemptsKey)]);

    return;
  } catch (error) {
    if (error instanceof Parse.Error) throw error;

    logger.error(`${LOG_PREFIX} Authentication failed unexpectedly`, error);

    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Authentication service error');
  }
};

const validateAppId = () => {
  return Promise.resolve();
};

module.exports = {
  validateAuthData,
  validateAppId,
};
