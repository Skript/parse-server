// src/Adapters/Auth/yandex.js

/**
 * @file Кастомный auth-адаптер для аутентификации пользователя через Яндекс ID
 * @module Adapters/Auth/yandex
 */

const Parse = require('parse/node');

const { logger } = require('../../Services');

const httpsRequest = require('./httpsRequest');

const LOG_PREFIX = '[YandexAuth]';

const validateAuthData = async (authData, options = {}) => {
  logger.debug(`${LOG_PREFIX} Validation started for user ID: ${authData.id}`);

  if (!authData || !authData.access_token) {
    logger.warn(`${LOG_PREFIX} Validation failed: access_token is missing`);
    throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'access_token is missing');
  }
  if (!options.clientId) {
    logger.error(`${LOG_PREFIX} FATAL: Yandex clientId is not configured in Parse Server options`);
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Yandex clientId is not configured');
  }

  try {
    const requestOptions = {
      host: 'login.yandex.ru',
      path: '/info?format=json',
      method: 'GET',
      headers: { Authorization: `OAuth ${authData.access_token}` },
    };

    logger.debug(`${LOG_PREFIX} Requesting user info from Yandex...`);
    const yandexResponse = await httpsRequest.get(requestOptions);
    logger.debug(`${LOG_PREFIX} Received response from Yandex: ${JSON.stringify(yandexResponse)}`);

    if (!yandexResponse || !yandexResponse.id) {
      logger.warn(`${LOG_PREFIX} Validation failed: Invalid response from Yandex`);
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'Invalid response from Yandex');
    }

    if (yandexResponse.client_id && yandexResponse.client_id !== options.clientId) {
      logger.warn(
        `${LOG_PREFIX} Validation failed: Client ID mismatch. Expected ${options.clientId}, got ${yandexResponse.client_id}`
      );
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'Client ID mismatch');
    }

    if (authData.id && authData.id !== yandexResponse.id.toString()) {
      logger.warn(
        `${LOG_PREFIX} Validation failed: User ID mismatch. Client sent ${authData.id}, Yandex returned ${yandexResponse.id}`
      );
      throw new Parse.Error(Parse.Error.UNAUTHORIZED, 'User ID mismatch');
    }

    logger.debug(`${LOG_PREFIX} User ${yandexResponse.id} successfully validated`);

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
