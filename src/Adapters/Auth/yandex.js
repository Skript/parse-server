// src/Adapters/Auth/yandex.js

// https://yandex.ru/dev/id/doc/ru/user-information

const httpsRequest = require('./httpsRequest');
const Parse = require('parse/node').Parse;

const log = (options, ...args) => {
  if (options && options.debug) {
    console.log('[YandexAuth]', ...args);
  }
};

const validateAuthData = async (authData, options = {}) => {
  log(options, 'Validation start, [authData]:', authData, ' [options]:', options);

  if (!authData || !authData.access_token) {
    log(options, 'ERROR: access_token is missing');
    throw new Parse.Error(
      Parse.Error.INVALID_PARAMETER,
      '[YandexAuth] ERROR: access_token is missing'
    );
  }

  if (!options.clientId) {
    log(options, 'ERROR: client ID is not configured');
    throw new Parse.Error(
      Parse.Error.INTERNAL_SERVER_ERROR,
      '[YandexAuth] ERROR: client ID is not configured'
    );
  }

  const expectedClientId = options.clientId;

  try {
    log(options, 'Requesting user info: ', authData.access_token);

    const requestOptions = {
      host: 'login.yandex.ru',
      path: '/info?format=json',
      method: 'GET',
      headers: {
        Authorization: `OAuth ${authData.access_token}`,
        Accept: 'application/json',
      },
    };

    const response = await httpsRequest.get(requestOptions);
    log(options, 'Response from Yandex:', response);

    if (!response || typeof response !== 'object' || !response.id) {
      log(options, 'ERROR: invalid or empty user info structure or missing user ID: ', response);
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        '[YandexAuth] ERROR: invalid or empty user info structure or missing user ID'
      );
    }

    if (!response.id) {
      log(options, 'ERROR: no user ID');
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, '[YandexAuth] ERROR: no user ID');
    }

    if (response.client_id && response.client_id !== expectedClientId) {
      log(options, 'ERROR: client ID mismatch');
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, '[YandexAuth] ERROR: client ID mismatch');
    }

    if (authData.id && authData.id !== response.id.toString()) {
      log(options, 'ERROR: user ID mismatch');
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, '[YandexAuth] ERROR: user ID mismatch');
    }

    const result = {
      id: response.id.toString(),
      access_token: authData.access_token,
    };

    log(options, 'SUCCESS: ', authData.access_token);

    return result;
  } catch (error) {
    log(options, 'ERROR: ', error);

    if (error instanceof Parse.Error) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        '[YandexAuth] ERROR: invalid response format'
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Parse.Error(
        Parse.Error.CONNECTION_FAILED,
        `[YandexAuth] ERROR: could not connect to Yandex API: ${error.code}`
      );
    }

    throw new Parse.Error(
      Parse.Error.INTERNAL_SERVER_ERROR,
      `[YandexAuth] ERROR: authentication failed: ${error.message || 'unknown error'}`
    );
  }
};

const validateAppId = () => {
  return Promise.resolve();
};

module.exports = {
  validateAuthData,
  validateAppId,
};
