var Promise = require('bluebird');
var redis = require('../common/redis.js');
var logger = require('../common/logger');
var User = require('../models/user.js');
Promise.promisifyAll(redis);
Promise.promisifyAll(User);

redis.getAsync('c_18601355208').then(function(result){
    if(result){
        console.log(result);
    }else{
        console.log('has no key');
    }
    return result;
}).then(function(result){
   console.log('--second time:'+result);
   User.getByMobileAsync('18601355208').then(function(user){
      console.log(user);
   }).catch(function (err) {
      console.log('----catching user err----');
      console.log(err);
   })
}).catch(function (err) {
    console.log('--begin logger--');
    logger.debug('hello good');
    console.log(err);
})

