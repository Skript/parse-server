// src/Adapters/Auth/email.js

/**
 * @file Кастомный auth-адаптер для аутентификации пользователя по Email и OTP
 * @module Adapters/Auth/email
 */

const Parse = require('parse/node');

const { getRedisClient, logger } = require('../../Services');

const LOG_PREFIX = '[EmailOTPAuth]';

const validateAuthData = async authData => {
  logger.debug(`${LOG_PREFIX} Validation started for user: ${authData.id}`);

  try {
    const { id: email, otp } = authData;
    if (!email || !otp) {
      logger.warn(`${LOG_PREFIX} Validation failed: Email or OTP is missing`);
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'Email or OTP is missing');
    }

    const redisClient = getRedisClient();
    const lowerCaseEmail = email.toLowerCase();
    const redisKey = `email:otp:${lowerCaseEmail}`;

    const storedData = await redisClient.get(redisKey);
    logger.debug(
      `${LOG_PREFIX} Data from Redis for key ${redisKey}: ${JSON.stringify(storedData)}`
    );

    if (!storedData || storedData.otp !== otp) {
      logger.warn(`${LOG_PREFIX} Validation failed: OTP mismatch or expired for user ${email}`);
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'Invalid or expired confirmation code');
    }

    logger.debug(`${LOG_PREFIX} User ${email} successfully validated - deleting OTP key`);
    await redisClient.del(redisKey);

    return;
  } catch (error) {
    logger.error(`${LOG_PREFIX} Authentication failed unexpectedly`, error);

    if (error instanceof Parse.Error) {
      throw error;
    }

    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Authentication failed unexpectedly');
  }
};

const validateAppId = () => {
  return Promise.resolve();
};

module.exports = {
  validateAuthData,
  validateAppId,
};
