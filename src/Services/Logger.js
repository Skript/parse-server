// src/Services/Logger.js

/**
 * @file Ре-экспортирует нативный логгер Parse Server (Winston) для
 *       единообразного использования во всем приложении
 * @module Services/Logger
 */

const { logger } = require('../Adapters/Logger/WinstonLogger');

module.exports = { logger };
