// src/Services/index.js

/**
 * @file Собирает и экспортирует все сервисы приложения
 * @module Services
 */

module.exports = {
  ...require('./Database'),
  ...require('./RedisClient'),
  ...require('./SMTPClient'),
  ...require('./Logger'),
};
