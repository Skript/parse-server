// src/Services/SMTPClient.js

/**
 * @file Предоставляет централизованный доступ к синглтон-экземпляру SMTP-клиента
 * @module Services/SMTPClient
 */

const Parse = require('parse/node');

const Config = require('../Config');
const SMTPAdapter = require('../Adapters/Email/SMTPAdapter').default;

let smtpClient = null;

function getSMTPClient() {
  if (smtpClient) {
    return smtpClient;
  }

  const config = Config.get(Parse.applicationId);

  if (!config.emailAdapter || !config.emailAdapter.options) {
    throw new Error('SMTPAdapter is not configured in Parse Server config');
  }

  const smtpOptions = config.emailAdapter.options;

  smtpClient = new SMTPAdapter(smtpOptions);

  return smtpClient;
}

module.exports = { getSMTPClient };
