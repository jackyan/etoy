var path = require('path');

var config = {
  cookieSecret: 'etoy', 
  db: 'etoy', 
  mongo_host: '127.0.0.1',
  mongo_port: 5586,
  code_host: "open.bizapp.com",
  code_path: "/api/sms/templateSend",
  code_params: "appId=F0000036&tpId=2079628&customerId=C1010134&userId=U1011346&password=jixingKeji7753&phones=",
  gbk: "GBK",
  utf_8: "UTF-8",
  app_name: 'etoy',
  company_name: '即行科技',
  redis_openid_prefix: 'c_oid_',
  redis_prefix: 'c_',
  redis_code_per_day_prefix: 'per_day_',
  code_per_day: 5,
  redis_host: '127.0.0.1',
  redis_port: 6379,
  redis_db: 0,
  upload:{
    path: path.join( '/opt/static/public/upload/'),
    url: '/upload/'
  },
  file_limit: 5 * 1024 * 1024,
  debug: true

};

module.exports = config;