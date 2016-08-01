var config = require('../settings');
var redis = require('redis');
var logger = require('./logger')


var options = {
  port: config.redis_port,
  host: config.redis_host,
  db: config.redis_db
};

var client = redis.createClient(options);


client.on('error', function (err) {
  if (err) {
    logger.error('connect to redis error, check your redis config', err);
    process.exit(1);
  }
});

exports = module.exports = client;