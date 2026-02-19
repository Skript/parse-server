// src/Adapters/Auth/email.js

/**
 * @file Кастомный auth-адаптер для аутентификации пользователя по Email и OTP
 * @module Adapters/Auth/email
 */

const Parse = require('parse/node');

const { getRedisClient, logger } = require('../../Services');

const LOG_PREFIX = '[EmailOTPAuth]';

const OTP_TTL = 10 * 60 * 1000;
const OTP_ATTEMPTS_TTL = 60 * 60 * 1000;

const MAX_ATTEMPTS = 5;

const validateAuthData = async authData => {
  try {
    const { id: email, otp } = authData;
    if (!email || !otp) {
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'Email or OTP is missing');
    }

    const lowerCaseEmail = email.toLowerCase();

    const redisClient = getRedisClient();
    const otpKey = `email:otp:${lowerCaseEmail}`;
    const attemptsKey = `email:otp-attempts:${lowerCaseEmail}`;

    const storedData = await redisClient.get(otpKey);
    if (!storedData) {
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'Confirmation code expired or not found');
    }

    if (storedData.otp !== otp.toString()) {
      storedData.fails += 1;

      const currentAttempts = (await redisClient.get(attemptsKey)) || 0;
      const newAttempts = parseInt(currentAttempts, 10) + 1;

      await Promise.all([
        redisClient.put(otpKey, storedData, OTP_TTL),
        redisClient.put(attemptsKey, newAttempts, OTP_ATTEMPTS_TTL),
      ]);

      if (storedData.fails >= MAX_ATTEMPTS) {
        await redisClient.del(otpKey);
        throw new Parse.Error(429, 'Too many attempts for this code. Please request a new one.');
      }

      throw new Parse.Error(
        Parse.Error.UNAUTHORIZED,
        `Invalid code. Attempts left: ${MAX_ATTEMPTS - storedData.fails}`
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
