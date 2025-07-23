// src/Services/Database.js

/**
 * @file Предоставляет централизованный доступ к инициализированному адаптеру базы данных
 * @module Services/Database
 */

const Parse = require('parse/node');

const Config = require('../Config');

let pgAdapter = null;

function getPgAdapter() {
  if (pgAdapter) {
    return pgAdapter;
  }

  const config = Config.get(Parse.applicationId);

  if (!config || !config.database || !config.database.adapter) {
    throw new Error('Database adapter is not configured in Parse Server config');
  }

  pgAdapter = config.database.adapter;

  return pgAdapter;
}

module.exports = {
  getPgAdapter,
};
