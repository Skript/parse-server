// src/Services/RedisClient.js

/**
 * @file Предоставляет централизованный доступ к синглтон-экземпляру Redis-клиента
 * @module Services/RedisClient
 */

const RedisCacheAdapter = require('../Adapters/Cache/RedisCacheAdapter').default;

let redisClient = null;

const DEFAULT_TTL = 5 * 60 * 1000;

function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisOptions = {
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  };

  if (!process.env.REDIS_HOST) {
    throw new Error('Redis ENV is not configured');
  }

  redisClient = new RedisCacheAdapter(redisOptions, DEFAULT_TTL);
  return redisClient;
}

module.exports = { getRedisClient };
