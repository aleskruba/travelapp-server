const redis = require('redis');


const redisClient = redis.createClient({
  host: '127.0.0.1',
 // host:'red-cq0mg1iju9rs73avmd4g', 
  port: 6379,
});


module.exports = {redisClient };